// db/migrate.ts — Run database migrations
import "$std/dotenv/load.ts";
import { pool } from "./client.ts";

const MIGRATIONS_DIR = new URL("./migrations", import.meta.url).pathname
  // Fix Windows path (remove leading / from /C:/...)
  .replace(/^\/([A-Z]:)/, "$1");

async function ensureMigrationsTable(
  client: Awaited<ReturnType<typeof pool.connect>>,
): Promise<void> {
  await client.queryObject(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(
  client: Awaited<ReturnType<typeof pool.connect>>,
): Promise<Set<string>> {
  const result = await client.queryObject<{ name: string }>(
    "SELECT name FROM _migrations ORDER BY id",
  );
  return new Set(result.rows.map((r) => r.name));
}

async function runMigrations(): Promise<void> {
  console.log("🔄 Running migrations...\n");

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    // Read migration files sorted by name
    const entries: string[] = [];
    for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
      if (entry.isFile && entry.name.endsWith(".sql")) {
        entries.push(entry.name);
      }
    }
    entries.sort();

    let count = 0;
    for (const filename of entries) {
      if (applied.has(filename)) {
        console.log(`  ✅ ${filename} (already applied)`);
        continue;
      }

      const filepath = `${MIGRATIONS_DIR}/${filename}`;
      const sql = await Deno.readTextFile(filepath);

      console.log(`  ⏳ Applying ${filename}...`);
      await client.queryObject("BEGIN");
      try {
        await client.queryObject(sql);
        await client.queryObject(
          "INSERT INTO _migrations (name) VALUES ($1)",
          [filename],
        );
        await client.queryObject("COMMIT");
        console.log(`  ✅ ${filename} applied successfully`);
        count++;
      } catch (error) {
        await client.queryObject("ROLLBACK");
        console.error(`  ❌ ${filename} failed:`, error);
        throw error;
      }
    }

    if (count === 0) {
      console.log("\n✅ Database is up to date. No new migrations.");
    } else {
      console.log(`\n✅ Applied ${count} migration(s) successfully.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Run
await runMigrations();
