// db/client.ts — PostgreSQL connection pool (lazy initialization)
import { Pool } from "postgres";

let _pool: Pool | null = null;

/**
 * Parse DATABASE_URL into connection options.
 * Supports: postgres://user:password@host:port/database?sslmode=require
 */
function parseDbUrl(url: string) {
  const parsed = new URL(url);
  return {
    hostname: parsed.hostname,
    port: Number(parsed.port) || 5432,
    database: parsed.pathname.slice(1),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    tls: {
      enabled: parsed.searchParams.get("sslmode") !== "disable",
      enforce: false,
    },
  };
}

function getPool(): Pool {
  if (!_pool) {
    const databaseUrl = Deno.env.get("DATABASE_URL");

    if (databaseUrl) {
      // Railway / cloud providers inject DATABASE_URL
      _pool = new Pool(parseDbUrl(databaseUrl), 10);
    } else {
      // Fallback: individual env vars (docker-compose, local dev)
      const sslEnabled = Deno.env.get("DATABASE_SSL") === "true";
      _pool = new Pool({
        hostname: Deno.env.get("DATABASE_HOST") || "localhost",
        port: Number(Deno.env.get("DATABASE_PORT")) || 5432,
        database: Deno.env.get("DATABASE_NAME") || "allstar_fashion",
        user: Deno.env.get("DATABASE_USER") || "allstar",
        password: Deno.env.get("DATABASE_PASSWORD") || "",
        tls: { enabled: sslEnabled, enforce: false },
      }, 10);
    }
  }
  return _pool;
}

/**
 * Execute a query with automatic connection management.
 * Usage: const rows = await query<User>("SELECT * FROM users WHERE id = $1", [id]);
 */
export async function query<T>(
  sql: string,
  args: unknown[] = [],
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.queryObject<T>(sql, args);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return the first row or null.
 */
export async function queryOne<T>(
  sql: string,
  args: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows[0] ?? null;
}

/**
 * Execute a statement (INSERT/UPDATE/DELETE) and return affected row count.
 */
export async function execute(
  sql: string,
  args: unknown[] = [],
): Promise<number> {
  const client = await getPool().connect();
  try {
    const result = await client.queryObject(sql, args);
    return result.rowCount ?? 0;
  } finally {
    client.release();
  }
}

/**
 * Execute multiple statements in a transaction.
 * If any statement fails, the entire transaction is rolled back.
 */
export async function transaction<T>(
  fn: (client: TransactionClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.queryObject("BEGIN");
    const txClient: TransactionClient = {
      query: async <R>(sql: string, args: unknown[] = []): Promise<R[]> => {
        const result = await client.queryObject<R>(sql, args);
        return result.rows;
      },
      queryOne: async <R>(
        sql: string,
        args: unknown[] = [],
      ): Promise<R | null> => {
        const result = await client.queryObject<R>(sql, args);
        return result.rows[0] ?? null;
      },
      execute: async (sql: string, args: unknown[] = []): Promise<number> => {
        const result = await client.queryObject(sql, args);
        return result.rowCount ?? 0;
      },
    };
    const result = await fn(txClient);
    await client.queryObject("COMMIT");
    return result;
  } catch (error) {
    await client.queryObject("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export interface TransactionClient {
  query: <T>(sql: string, args?: unknown[]) => Promise<T[]>;
  queryOne: <T>(sql: string, args?: unknown[]) => Promise<T | null>;
  execute: (sql: string, args?: unknown[]) => Promise<number>;
}

/** Close the pool (for graceful shutdown) */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

/** Get the pool instance (lazily initialized) */
export const pool = {
  connect: () => getPool().connect(),
  end: () => {
    if (_pool) return _pool.end();
    return Promise.resolve();
  },
};
