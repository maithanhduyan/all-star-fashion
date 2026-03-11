// lib/services/auth.service.ts — Authentication & session management
import { query, queryOne, execute } from "../../db/client.ts";
import bcrypt from "bcrypt";
const { hash, compare: compareHash } = bcrypt;

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
  const passwordHash = await hash(input.password, 10);

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

  const valid = await compareHash(input.password, user.password_hash);
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

// ── Update Profile ──

export async function updateProfile(
  userId: string,
  input: { name?: string; phone?: string },
): Promise<UserResponse> {
  const sets: string[] = [];
  const args: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) {
    sets.push(`name = $${idx++}`);
    args.push(input.name.trim());
  }
  if (input.phone !== undefined) {
    sets.push(`phone = $${idx++}`);
    args.push(input.phone || null);
  }
  if (sets.length === 0) throw new AuthError("Không có gì để cập nhật", "NO_CHANGES", 400);

  sets.push(`updated_at = NOW()`);
  args.push(userId);

  const user = await queryOne<{ id: string; email: string; name: string; phone: string | null; role: string }>(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING id, email, name, phone, role`,
    args,
  );
  if (!user) throw new AuthError("Không tìm thấy người dùng", "NOT_FOUND", 404);

  return user;
}

// ── Change Password ──

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await queryOne<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId],
  );
  if (!user) throw new AuthError("Không tìm thấy người dùng", "NOT_FOUND", 404);

  const valid = await compare(currentPassword, user.password_hash);
  if (!valid) throw new AuthError("Mật khẩu hiện tại không đúng", "WRONG_PASSWORD", 400);

  const newHash = await hash(newPassword, 10);
  await execute("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newHash, userId]);
}

// ── User Addresses ──

export interface UserAddress {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export async function getUserAddresses(userId: string): Promise<UserAddress[]> {
  const rows = await query<{
    id: string; user_id: string; label: string; recipient_name: string;
    phone: string; address: string; district: string; city: string; is_default: boolean;
  }>(
    "SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
    [userId],
  );
  return rows.map((r) => ({
    id: r.id, userId: r.user_id, label: r.label, recipientName: r.recipient_name,
    phone: r.phone, address: r.address, district: r.district, city: r.city, isDefault: r.is_default,
  }));
}

export async function addUserAddress(userId: string, input: {
  label: string; recipientName: string; phone: string;
  address: string; district: string; city: string; isDefault?: boolean;
}): Promise<UserAddress> {
  // If setting as default, unset others
  if (input.isDefault) {
    await execute("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [userId]);
  }
  const row = await queryOne<{
    id: string; user_id: string; label: string; recipient_name: string;
    phone: string; address: string; district: string; city: string; is_default: boolean;
  }>(
    `INSERT INTO user_addresses (user_id, label, recipient_name, phone, address, district, city, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [userId, input.label, input.recipientName, input.phone, input.address, input.district, input.city, input.isDefault ?? false],
  );
  if (!row) throw new Error("Failed to create address");
  return {
    id: row.id, userId: row.user_id, label: row.label, recipientName: row.recipient_name,
    phone: row.phone, address: row.address, district: row.district, city: row.city, isDefault: row.is_default,
  };
}

export async function updateUserAddress(userId: string, addressId: string, input: {
  label?: string; recipientName?: string; phone?: string;
  address?: string; district?: string; city?: string; isDefault?: boolean;
}): Promise<UserAddress> {
  if (input.isDefault) {
    await execute("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [userId]);
  }
  const row = await queryOne<{
    id: string; user_id: string; label: string; recipient_name: string;
    phone: string; address: string; district: string; city: string; is_default: boolean;
  }>(
    `UPDATE user_addresses SET
       label = COALESCE($3, label), recipient_name = COALESCE($4, recipient_name),
       phone = COALESCE($5, phone), address = COALESCE($6, address),
       district = COALESCE($7, district), city = COALESCE($8, city),
       is_default = COALESCE($9, is_default), updated_at = NOW()
     WHERE id = $2 AND user_id = $1
     RETURNING *`,
    [userId, addressId, input.label, input.recipientName, input.phone, input.address, input.district, input.city, input.isDefault],
  );
  if (!row) throw new AuthError("Địa chỉ không tồn tại", "NOT_FOUND", 404);
  return {
    id: row.id, userId: row.user_id, label: row.label, recipientName: row.recipient_name,
    phone: row.phone, address: row.address, district: row.district, city: row.city, isDefault: row.is_default,
  };
}

export async function deleteUserAddress(userId: string, addressId: string): Promise<void> {
  const result = await execute(
    "DELETE FROM user_addresses WHERE id = $1 AND user_id = $2",
    [addressId, userId],
  );
  if (result === 0) throw new AuthError("Địa chỉ không tồn tại", "NOT_FOUND", 404);
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
