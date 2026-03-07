// lib/services/product.service.ts — Product DB queries
import { query, queryOne, execute, transaction } from "../../db/client.ts";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  cost_price: number | null;
  discount_price: number | null;
  stock_quantity: number;
  description: string;
  category_id: string | null;
  in_stock: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

interface ImageRow {
  url: string;
}

interface SizeRow {
  size: string;
}

interface ColorRow {
  name: string;
  hex: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  costPrice: number | null;
  discountPrice: number | null;
  stockQuantity: number;
  description: string;
  category: CategoryInfo | null;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

async function enrichProduct(row: ProductRow): Promise<ProductResponse> {
  const [images, sizes, colors, catRows] = await Promise.all([
    query<ImageRow>(
      "SELECT url FROM product_images WHERE product_id = $1 ORDER BY sort_order",
      [row.id],
    ),
    query<SizeRow>(
      "SELECT size FROM product_sizes WHERE product_id = $1",
      [row.id],
    ),
    query<ColorRow>(
      "SELECT name, hex FROM product_colors WHERE product_id = $1",
      [row.id],
    ),
    row.category_id
      ? query<CategoryInfo>(
        "SELECT id, name, slug FROM categories WHERE id = $1",
        [row.category_id],
      )
      : Promise.resolve([]),
  ]);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    originalPrice: row.original_price,
    costPrice: row.cost_price,
    discountPrice: row.discount_price,
    stockQuantity: row.stock_quantity,
    description: row.description,
    category: catRows[0] ?? null,
    images: images.map((i) => i.url),
    sizes: sizes.map((s) => s.size),
    colors: colors.map((c) => ({ name: c.name, hex: c.hex })),
    inStock: row.in_stock,
    isNew: row.is_new,
    isBestSeller: row.is_best_seller,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
  };
}

export async function getProducts(options: {
  category?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<{ data: ProductResponse[]; pagination: Pagination }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  // Build WHERE clauses
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (options.category) {
    conditions.push(
      `p.category_id = (SELECT id FROM categories WHERE slug = $${paramIdx})`,
    );
    params.push(options.category);
    paramIdx++;
  }

  if (options.q) {
    conditions.push(
      `(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`,
    );
    params.push(`%${options.q}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Sort
  let orderBy: string;
  switch (options.sort) {
    case "price_asc":
      orderBy = "p.price ASC";
      break;
    case "price_desc":
      orderBy = "p.price DESC";
      break;
    case "best_seller":
      orderBy = "p.is_best_seller DESC, p.created_at DESC";
      break;
    default:
      orderBy = "p.created_at DESC";
  }

  // Count total
  const countResult = await queryOne<{ count: string }>(
    `SELECT count(*) FROM products p ${whereClause}`,
    params,
  );
  const total = parseInt(countResult?.count || "0");

  // Fetch rows
  const rows = await query<ProductRow>(
    `SELECT p.* FROM products p ${whereClause} ORDER BY ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset],
  );

  const data = await Promise.all(rows.map(enrichProduct));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductResponse | null> {
  const row = await queryOne<ProductRow>(
    "SELECT * FROM products WHERE slug = $1",
    [slug],
  );
  if (!row) return null;
  return enrichProduct(row);
}

export async function getProductById(
  id: string,
): Promise<ProductResponse | null> {
  const row = await queryOne<ProductRow>(
    "SELECT * FROM products WHERE id = $1",
    [id],
  );
  if (!row) return null;
  return enrichProduct(row);
}

export async function getBestSellers(
  limit = 4,
): Promise<ProductResponse[]> {
  const rows = await query<ProductRow>(
    "SELECT * FROM products WHERE is_best_seller = true ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return Promise.all(rows.map(enrichProduct));
}

export async function getNewArrivals(
  limit = 4,
): Promise<ProductResponse[]> {
  const rows = await query<ProductRow>(
    "SELECT * FROM products WHERE is_new = true ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return Promise.all(rows.map(enrichProduct));
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<ProductResponse[]> {
  const rows = await query<ProductRow>(
    "SELECT * FROM products WHERE category_id = $1 AND id != $2 ORDER BY created_at DESC LIMIT $3",
    [categoryId, excludeId, limit],
  );
  return Promise.all(rows.map(enrichProduct));
}

// ============================================
// CRUD Operations for Admin
// ============================================

export interface CreateProductInput {
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  costPrice?: number | null;
  discountPrice?: number | null;
  stockQuantity?: number;
  description?: string;
  categoryId?: string | null;
  inStock?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  images?: string[];
  sizes?: string[];
  colors?: { name: string; hex: string }[];
}

export type UpdateProductInput = Partial<CreateProductInput>;

export async function createProduct(
  input: CreateProductInput,
): Promise<ProductResponse> {
  return await transaction(async (tx) => {
    const row = await tx.queryOne<ProductRow>(
      `INSERT INTO products (name, slug, price, original_price, cost_price, discount_price, stock_quantity, description, category_id, in_stock, is_new, is_best_seller, meta_title, meta_description, meta_keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        input.name,
        input.slug,
        input.price,
        input.originalPrice ?? null,
        input.costPrice ?? null,
        input.discountPrice ?? null,
        input.stockQuantity ?? 0,
        input.description ?? "",
        input.categoryId ?? null,
        input.inStock ?? true,
        input.isNew ?? false,
        input.isBestSeller ?? false,
        input.metaTitle ?? null,
        input.metaDescription ?? null,
        input.metaKeywords ?? null,
      ],
    );

    if (!row) throw new Error("Failed to create product");

    // Insert images
    if (input.images?.length) {
      for (let i = 0; i < input.images.length; i++) {
        await tx.execute(
          "INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, $3)",
          [row.id, input.images[i], i],
        );
      }
    }

    // Insert sizes
    if (input.sizes?.length) {
      for (const size of input.sizes) {
        await tx.execute(
          "INSERT INTO product_sizes (product_id, size) VALUES ($1, $2)",
          [row.id, size],
        );
      }
    }

    // Insert colors
    if (input.colors?.length) {
      for (const color of input.colors) {
        await tx.execute(
          "INSERT INTO product_colors (product_id, name, hex) VALUES ($1, $2, $3)",
          [row.id, color.name, color.hex],
        );
      }
    }

    return enrichProductFromTx(row, tx);
  });
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ProductResponse | null> {
  return await transaction(async (tx) => {
    // Build dynamic SET clause
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (input.name !== undefined) {
      setClauses.push(`name = $${idx++}`);
      params.push(input.name);
    }
    if (input.slug !== undefined) {
      setClauses.push(`slug = $${idx++}`);
      params.push(input.slug);
    }
    if (input.price !== undefined) {
      setClauses.push(`price = $${idx++}`);
      params.push(input.price);
    }
    if (input.originalPrice !== undefined) {
      setClauses.push(`original_price = $${idx++}`);
      params.push(input.originalPrice);
    }
    if (input.costPrice !== undefined) {
      setClauses.push(`cost_price = $${idx++}`);
      params.push(input.costPrice);
    }
    if (input.discountPrice !== undefined) {
      setClauses.push(`discount_price = $${idx++}`);
      params.push(input.discountPrice);
    }
    if (input.stockQuantity !== undefined) {
      setClauses.push(`stock_quantity = $${idx++}`);
      params.push(input.stockQuantity);
    }
    if (input.description !== undefined) {
      setClauses.push(`description = $${idx++}`);
      params.push(input.description);
    }
    if (input.categoryId !== undefined) {
      setClauses.push(`category_id = $${idx++}`);
      params.push(input.categoryId);
    }
    if (input.inStock !== undefined) {
      setClauses.push(`in_stock = $${idx++}`);
      params.push(input.inStock);
    }
    if (input.isNew !== undefined) {
      setClauses.push(`is_new = $${idx++}`);
      params.push(input.isNew);
    }
    if (input.isBestSeller !== undefined) {
      setClauses.push(`is_best_seller = $${idx++}`);
      params.push(input.isBestSeller);
    }
    if (input.metaTitle !== undefined) {
      setClauses.push(`meta_title = $${idx++}`);
      params.push(input.metaTitle);
    }
    if (input.metaDescription !== undefined) {
      setClauses.push(`meta_description = $${idx++}`);
      params.push(input.metaDescription);
    }
    if (input.metaKeywords !== undefined) {
      setClauses.push(`meta_keywords = $${idx++}`);
      params.push(input.metaKeywords);
    }

    setClauses.push("updated_at = NOW()");

    if (setClauses.length === 1) {
      // Nothing to update except updated_at
      const existing = await tx.queryOne<ProductRow>(
        "SELECT * FROM products WHERE id = $1",
        [id],
      );
      if (!existing) return null;
      return enrichProductFromTx(existing, tx);
    }

    params.push(id);
    const row = await tx.queryOne<ProductRow>(
      `UPDATE products SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      params,
    );

    if (!row) return null;

    // Update images if provided
    if (input.images !== undefined) {
      await tx.execute("DELETE FROM product_images WHERE product_id = $1", [id]);
      for (let i = 0; i < input.images.length; i++) {
        await tx.execute(
          "INSERT INTO product_images (product_id, url, sort_order) VALUES ($1, $2, $3)",
          [id, input.images[i], i],
        );
      }
    }

    // Update sizes if provided
    if (input.sizes !== undefined) {
      await tx.execute("DELETE FROM product_sizes WHERE product_id = $1", [id]);
      for (const size of input.sizes) {
        await tx.execute(
          "INSERT INTO product_sizes (product_id, size) VALUES ($1, $2)",
          [id, size],
        );
      }
    }

    // Update colors if provided
    if (input.colors !== undefined) {
      await tx.execute("DELETE FROM product_colors WHERE product_id = $1", [id]);
      for (const color of input.colors) {
        await tx.execute(
          "INSERT INTO product_colors (product_id, name, hex) VALUES ($1, $2, $3)",
          [id, color.name, color.hex],
        );
      }
    }

    return enrichProductFromTx(row, tx);
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  const count = await execute(
    "DELETE FROM products WHERE id = $1",
    [id],
  );
  return count > 0;
}

// Helper: enrich product from transaction client
async function enrichProductFromTx(
  row: ProductRow,
  tx: { query: <T>(sql: string, args?: unknown[]) => Promise<T[]> },
): Promise<ProductResponse> {
  const [images, sizes, colors, catRows] = await Promise.all([
    tx.query<ImageRow>(
      "SELECT url FROM product_images WHERE product_id = $1 ORDER BY sort_order",
      [row.id],
    ),
    tx.query<SizeRow>(
      "SELECT size FROM product_sizes WHERE product_id = $1",
      [row.id],
    ),
    tx.query<ColorRow>(
      "SELECT name, hex FROM product_colors WHERE product_id = $1",
      [row.id],
    ),
    row.category_id
      ? tx.query<CategoryInfo>(
        "SELECT id, name, slug FROM categories WHERE id = $1",
        [row.category_id],
      )
      : Promise.resolve([]),
  ]);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    originalPrice: row.original_price,
    costPrice: row.cost_price,
    discountPrice: row.discount_price,
    stockQuantity: row.stock_quantity,
    description: row.description,
    category: catRows[0] ?? null,
    images: images.map((i) => i.url),
    sizes: sizes.map((s) => s.size),
    colors: colors.map((c) => ({ name: c.name, hex: c.hex })),
    inStock: row.in_stock,
    isNew: row.is_new,
    isBestSeller: row.is_best_seller,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
  };
}
