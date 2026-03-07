// routes/api/admin/products/index.ts — Admin product CRUD API
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../_middleware.ts";
import {
  getProducts,
  createProduct,
} from "../../../../lib/services/product.service.ts";
import { getCategories } from "../../../../lib/services/category.service.ts";

export const handler: Handlers<unknown, AppState> = {
  // GET /api/admin/products — List products with pagination, search, sort
  async GET(req, _ctx) {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const category = url.searchParams.get("category") ?? undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 50);
    const sort = url.searchParams.get("sort") ?? undefined;

    const [result, categories] = await Promise.all([
      getProducts({ q, category, page, limit, sort }),
      getCategories(),
    ]);

    return new Response(JSON.stringify({ ...result, categories }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // POST /api/admin/products — Create product
  async POST(req, _ctx) {
    try {
      const body = await req.json();

      // Validate required fields
      if (!body.name || !body.slug || !body.price) {
        return new Response(
          JSON.stringify({ error: "Tên, slug và giá bán là bắt buộc" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const product = await createProduct({
        name: body.name,
        slug: body.slug,
        price: Number(body.price),
        originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
        costPrice: body.costPrice ? Number(body.costPrice) : null,
        discountPrice: body.discountPrice ? Number(body.discountPrice) : null,
        stockQuantity: body.stockQuantity != null ? Number(body.stockQuantity) : 0,
        description: body.description || "",
        categoryId: body.categoryId || null,
        inStock: body.inStock ?? true,
        isNew: body.isNew ?? false,
        isBestSeller: body.isBestSeller ?? false,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        metaKeywords: body.metaKeywords || null,
        images: body.images || [],
        sizes: body.sizes || [],
        colors: body.colors || [],
      });

      return new Response(JSON.stringify(product), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi tạo sản phẩm";
      const isDuplicate = message.includes("duplicate") || message.includes("unique");
      return new Response(
        JSON.stringify({ error: isDuplicate ? "Slug đã tồn tại" : message }),
        { status: isDuplicate ? 409 : 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
