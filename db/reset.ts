// db/reset.ts — Drop all tables and re-run migrations + seed
import "$std/dotenv/load.ts";
import { pool } from "./client.ts";

async function reset(): Promise<void> {
  console.log("⚠️  Resetting database (dropping all tables)...\n");

  const client = await pool.connect();
  try {
    await client.queryObject(`
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS product_colors CASCADE;
      DROP TABLE IF EXISTS product_sizes CASCADE;
      DROP TABLE IF EXISTS product_images CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS _migrations CASCADE;
    `);
    console.log("✅ All tables dropped.\n");
  } finally {
    client.release();
    await pool.end();
  }
}

await reset();

// Now run migrate + seed
console.log("─".repeat(40));
const migrateCmd = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "db/migrate.ts"],
  cwd: Deno.cwd(),
  stdout: "inherit",
  stderr: "inherit",
});
const migrateResult = await migrateCmd.output();
if (!migrateResult.success) {
  console.error("❌ Migration failed!");
  Deno.exit(1);
}

console.log("\n" + "─".repeat(40));
const seedCmd = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "db/seed.ts"],
  cwd: Deno.cwd(),
  stdout: "inherit",
  stderr: "inherit",
});
const seedResult = await seedCmd.output();
if (!seedResult.success) {
  console.error("❌ Seed failed!");
  Deno.exit(1);
}
