// lib/services/category.service.ts — Category DB queries
import { query } from "../../db/client.ts";

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  sort_order: number;
}

export async function getCategories(): Promise<CategoryResponse[]> {
  const rows = await query<CategoryRow>(
    "SELECT id, name, slug, image, description FROM categories ORDER BY sort_order ASC",
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    image: r.image,
    description: r.description,
  }));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryResponse | null> {
  const rows = await query<CategoryRow>(
    "SELECT id, name, slug, image, description FROM categories WHERE slug = $1",
    [slug],
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    image: r.image,
    description: r.description,
  };
}
