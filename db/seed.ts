// db/seed.ts — Seed database with initial data from lib/data.ts
import "$std/dotenv/load.ts";
import { pool } from "./client.ts";
import { categories, products } from "../lib/data.ts";
import bcrypt from "bcrypt";
const { hash } = bcrypt;

async function seed(): Promise<void> {
  console.log("🌱 Seeding database...\n");

  const client = await pool.connect();
  try {
    // ── Seed Categories ──
    console.log("  📁 Seeding categories...");
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      await client.queryObject(
        `INSERT INTO categories (name, slug, image, description, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug, cat.image, cat.description || null, i + 1],
      );
    }
    console.log(`  ✅ ${categories.length} categories seeded`);

    // ── Seed Products ──
    console.log("  📦 Seeding products...");
    for (const prod of products) {
      // Find category_id by slug
      const catRow = await client.queryObject<{ id: string }>(
        "SELECT id FROM categories WHERE slug = $1",
        [prod.category],
      );
      const categoryId = catRow.rows[0]?.id ?? null;

      // Insert product
      const result = await client.queryObject<{ id: string }>(
        `INSERT INTO products (name, slug, price, original_price, description, category_id, in_stock, is_new, is_best_seller)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id`,
        [
          prod.name,
          prod.slug,
          prod.price,
          prod.originalPrice || null,
          prod.description,
          categoryId,
          prod.inStock,
          prod.isNew || false,
          prod.isBestSeller || false,
        ],
      );

      const productId = result.rows[0]?.id;
      if (!productId) {
        console.log(`    ⏭️  ${prod.name} (already exists)`);
        continue;
      }

      // Insert images
      for (let i = 0; i < prod.images.length; i++) {
        await client.queryObject(
          `INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, $3)`,
          [productId, prod.images[i], i],
        );
      }

      // Insert sizes
      for (const size of prod.sizes) {
        await client.queryObject(
          `INSERT INTO product_sizes (product_id, size) VALUES ($1, $2)`,
          [productId, size],
        );
      }

      // Insert colors
      for (const color of prod.colors) {
        await client.queryObject(
          `INSERT INTO product_colors (product_id, name, hex) VALUES ($1, $2, $3)`,
          [productId, color.name, color.hex],
        );
      }

      console.log(`    ✅ ${prod.name}`);
    }
    console.log(`  ✅ ${products.length} products seeded`);

    // ── Seed Admin User ──
    console.log("  👤 Seeding admin user...");
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@allstarfashion.vn";
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") || "admin12345678";
    const passwordHash = await hash(adminPassword);

    await client.queryObject(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail, passwordHash, "Admin", "admin"],
    );
    console.log(`  ✅ Admin user created (${adminEmail})`);

    // ── Verify ──
    console.log("\n📊 Verification:");
    const counts = await Promise.all([
      client.queryObject<{ count: string }>("SELECT count(*) FROM categories"),
      client.queryObject<{ count: string }>("SELECT count(*) FROM products"),
      client.queryObject<{ count: string }>(
        "SELECT count(*) FROM product_images",
      ),
      client.queryObject<{ count: string }>("SELECT count(*) FROM users"),
    ]);
    console.log(`  Categories: ${counts[0].rows[0].count}`);
    console.log(`  Products:   ${counts[1].rows[0].count}`);
    console.log(`  Images:     ${counts[2].rows[0].count}`);
    console.log(`  Users:      ${counts[3].rows[0].count}`);

    console.log("\n✅ Seed completed successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

await seed();
