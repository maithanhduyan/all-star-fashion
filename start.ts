/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

// start.ts — Production entrypoint: migrate → seed → start Fresh
// Used by Railway / Docker for automatic initialization

import "$std/dotenv/load.ts";

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

/**
 * Wait for database to become reachable before running init.
 * Railway PostgreSQL may take a few seconds to be ready.
 */
async function waitForDb(): Promise<void> {
  const { pool } = await import("./db/client.ts");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await pool.connect();
      await client.queryObject("SELECT 1");
      client.release();
      console.log("✅ Database is reachable");
      return;
    } catch (err) {
      console.log(
        `⏳ Waiting for database... (attempt ${attempt}/${MAX_RETRIES})`,
      );
      if (attempt === MAX_RETRIES) {
        console.error("❌ Could not connect to database after retries:", err);
        throw err;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

async function autoInit(): Promise<boolean> {
  console.log("🚀 All Star Fashion — Auto Init\n");

  // Step 1: Wait for DB
  try {
    await waitForDb();
  } catch {
    console.error("\n⚠️  Database unavailable — starting server without DB init.");
    console.error("   Pages that require DB will show errors until DB is reachable.");
    return false;
  }

  // Step 2: Run schema migrations (0001-0004 create tables)
  const { runMigrations } = await import("./db/migrate.ts");
  await runMigrations();

  // Step 3: Seed core data (categories, products, admin user)
  // Must run BEFORE demo data migration (0005) which references products by slug
  const { seed } = await import("./db/seed.ts");
  await seed();

  // Step 4: Run remaining migrations (0005+ demo data that depends on seeded products)
  // runMigrations is idempotent — skips already-applied migrations
  await runMigrations();

  console.log("\n✅ Initialization complete.\n");
  return true;
}

// Run init (non-blocking — server starts even if DB is unavailable)
await autoInit();

// Always start Fresh server
console.log("🍋 Starting Fresh server...\n");
const { start } = await import("$fresh/server.ts");
const { default: manifest } = await import("./fresh.gen.ts");
const { default: config } = await import("./fresh.config.ts");

await start(manifest, config);
