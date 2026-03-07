// lib/utils.ts — Shared utility functions
import type { Product } from "./types.ts";
import type { ProductResponse } from "./services/product.service.ts";

/**
 * Format VND price
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

/**
 * Convert DB ProductResponse → frontend Product type (used by components)
 */
export function toProduct(p: ProductResponse): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    description: p.description,
    category: p.category?.slug ?? "",
    images: p.images,
    sizes: p.sizes,
    colors: p.colors,
    inStock: p.inStock,
    isNew: p.isNew || undefined,
    isBestSeller: p.isBestSeller || undefined,
  };
}
