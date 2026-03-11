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
    // Priority order for connection config:
    // 1. DATABASE_PRIVATE_URL (Railway internal networking — fastest)
    // 2. DATABASE_URL (Railway public / cloud providers)
    // 3. PGHOST + PGPORT + ... (Railway plugin or manual config)
    // 4. DATABASE_HOST + ... (docker-compose / local dev)
    // 5. localhost fallback (local dev only)
    const databaseUrl = Deno.env.get("DATABASE_PRIVATE_URL")
      || Deno.env.get("DATABASE_URL");
    const pgHost = Deno.env.get("PGHOST");
    const dbHost = Deno.env.get("DATABASE_HOST");
    const isRailway = !!Deno.env.get("RAILWAY_ENVIRONMENT");

    if (databaseUrl) {
      const opts = parseDbUrl(databaseUrl);
      console.log(`[DB] Connecting via DATABASE_URL → ${opts.hostname}:${opts.port}/${opts.database}`);
      _pool = new Pool(opts, 10, true);
    } else if (pgHost) {
      // Railway PostgreSQL plugin or manually set PG* vars
      const port = Number(Deno.env.get("PGPORT")) || 5432;
      const database = Deno.env.get("PGDATABASE") || "railway";
      console.log(`[DB] Connecting via PGHOST → ${pgHost}:${port}/${database}`);
      _pool = new Pool({
        hostname: pgHost,
        port,
        database,
        user: Deno.env.get("PGUSER") || "postgres",
        password: Deno.env.get("PGPASSWORD") || "",
        tls: { enabled: !isRailway ? false : true, enforce: false },
      }, 10, true);
    } else if (dbHost) {
      // docker-compose: DATABASE_HOST=db
      const sslEnabled = Deno.env.get("DATABASE_SSL") === "true";
      const port = Number(Deno.env.get("DATABASE_PORT")) || 5432;
      const database = Deno.env.get("DATABASE_NAME") || "allstar_fashion";
      console.log(`[DB] Connecting via DATABASE_HOST → ${dbHost}:${port}/${database}`);
      _pool = new Pool({
        hostname: dbHost,
        port,
        database,
        user: Deno.env.get("DATABASE_USER") || "allstar",
        password: Deno.env.get("DATABASE_PASSWORD") || "",
        tls: { enabled: sslEnabled, enforce: false },
      }, 10, true);
    } else if (isRailway) {
      // On Railway but no DB vars at all — show one-time error, don't spam
      console.error(`\n${"=".repeat(60)}`);
      console.error(`[DB] ❌ DATABASE_URL is not set!`);
      console.error(`[DB]`);
      console.error(`[DB] To fix, go to Railway Dashboard:`);
      console.error(`[DB]   1. Click on your app service`);
      console.error(`[DB]   2. Go to "Variables" tab`);
      console.error(`[DB]   3. Click "Add a Variable Reference"`);
      console.error(`[DB]   4. Select your PostgreSQL service → DATABASE_URL`);
      console.error(`[DB]`);
      console.error(`[DB] Or manually add:`);
      console.error(`[DB]   DATABASE_URL = $\{\{Postgres.DATABASE_URL\}\}`);
      console.error(`${"=".repeat(60)}\n`);
      // Return a dummy pool that will fail on connect — avoids repeated error spam
      _pool = new Pool({
        hostname: "__not_configured__",
        port: 5432,
        database: "none",
        user: "none",
        password: "none",
      }, 1, true);
    } else {
      // Local dev fallback: localhost
      console.log(`[DB] Connecting → localhost:5432/allstar_fashion`);
      _pool = new Pool({
        hostname: "localhost",
        port: Number(Deno.env.get("DATABASE_PORT")) || 5432,
        database: Deno.env.get("DATABASE_NAME") || "allstar_fashion",
        user: Deno.env.get("DATABASE_USER") || "allstar",
        password: Deno.env.get("DATABASE_PASSWORD") || "",
        tls: { enabled: false, enforce: false },
      }, 10, true);
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
