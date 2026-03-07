// lib/services/auth.service.ts — Authentication & session management
import { query, queryOne, execute } from "../../db/client.ts";
import { hash, compare } from "bcrypt";

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  role: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
}

// ── Session Token Generation ──

function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Register ──

export async function register(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<{ user: UserResponse; sessionId: string }> {
  // Check existing
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [input.email],
  );
  if (existing) {
    throw new AuthError("Email đã được sử dụng", "EMAIL_EXISTS", 409);
  }

  // Hash password
  const passwordHash = await hash(input.password);

  // Insert user
  const user = await queryOne<UserRow>(
    `INSERT INTO users (email, password_hash, name, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, password_hash, name, phone, role`,
    [input.email, passwordHash, input.name, input.phone || null],
  );
  if (!user) throw new Error("Failed to create user");

  // Create session
  const sessionId = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
    sessionId,
  };
}

// ── Login ──

export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user: UserResponse; sessionId: string }> {
  const user = await queryOne<UserRow>(
    "SELECT id, email, password_hash, name, phone, role FROM users WHERE email = $1",
    [input.email],
  );
  if (!user) {
    throw new AuthError(
      "Email hoặc mật khẩu không đúng",
      "INVALID_CREDENTIALS",
      401,
    );
  }

  const valid = await compare(input.password, user.password_hash);
  if (!valid) {
    throw new AuthError(
      "Email hoặc mật khẩu không đúng",
      "INVALID_CREDENTIALS",
      401,
    );
  }

  const sessionId = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
    sessionId,
  };
}

// ── Session Management ──

async function createSession(userId: string): Promise<string> {
  const sessionId = generateSessionToken();
  const maxAge = parseInt(Deno.env.get("SESSION_MAX_AGE") || "2592000");
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

  await execute(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [sessionId, userId, expiresAt],
  );

  return sessionId;
}

export async function getUserBySessionId(
  sessionId: string,
): Promise<UserResponse | null> {
  const row = await queryOne<{
    user_id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    expires_at: string;
  }>(
    `SELECT s.user_id, u.email, u.name, u.phone, u.role, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [sessionId],
  );

  if (!row) return null;

  // Check expiration
  if (new Date(row.expires_at) < new Date()) {
    // Clean up expired session
    await execute("DELETE FROM sessions WHERE id = $1", [sessionId]);
    return null;
  }

  return {
    id: row.user_id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
  };
}

export async function logout(sessionId: string): Promise<void> {
  await execute("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

// ── Session Cookie Helpers ──

export function getSessionCookie(sessionId: string): string {
  const maxAge = Deno.env.get("SESSION_MAX_AGE") || "2592000";
  const isProduction = Deno.env.get("APP_ENV") === "production";
  const secure = isProduction ? "; Secure" : "";
  return `session_id=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

export function getClearSessionCookie(): string {
  return "session_id=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0";
}

export function parseSessionIdFromCookie(
  cookieHeader: string | null,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/session_id=([a-f0-9]{64})/);
  return match?.[1] ?? null;
}

// ── Auth Error ──

export class AuthError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
