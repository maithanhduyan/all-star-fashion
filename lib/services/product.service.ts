// lib/services/product.service.ts — Product DB queries
import { query, queryOne } from "../../db/client.ts";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  description: string;
  category_id: string | null;
  in_stock: boolean;
  is_new: boolean;
  is_best_seller: boolean;
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
  description: string;
  category: CategoryInfo | null;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
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
    description: row.description,
    category: catRows[0] ?? null,
    images: images.map((i) => i.url),
    sizes: sizes.map((s) => s.size),
    colors: colors.map((c) => ({ name: c.name, hex: c.hex })),
    inStock: row.in_stock,
    isNew: row.is_new,
    isBestSeller: row.is_best_seller,
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
