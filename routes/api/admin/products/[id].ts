// routes/api/admin/products/[id].ts — Admin single product API
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../_middleware.ts";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "../../../../lib/services/product.service.ts";

export const handler: Handlers<unknown, AppState> = {
  // GET /api/admin/products/:id — Get single product
  async GET(_req, ctx) {
    const product = await getProductById(ctx.params.id);
    if (!product) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy sản phẩm" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify(product), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // PUT /api/admin/products/:id — Update product
  async PUT(req, ctx) {
    try {
      const body = await req.json();
      const product = await updateProduct(ctx.params.id, {
        name: body.name,
        slug: body.slug,
        price: body.price != null ? Number(body.price) : undefined,
        originalPrice: body.originalPrice !== undefined
          ? (body.originalPrice ? Number(body.originalPrice) : null)
          : undefined,
        costPrice: body.costPrice !== undefined
          ? (body.costPrice ? Number(body.costPrice) : null)
          : undefined,
        discountPrice: body.discountPrice !== undefined
          ? (body.discountPrice ? Number(body.discountPrice) : null)
          : undefined,
        stockQuantity: body.stockQuantity != null ? Number(body.stockQuantity) : undefined,
        description: body.description,
        categoryId: body.categoryId !== undefined ? (body.categoryId || null) : undefined,
        inStock: body.inStock,
        isNew: body.isNew,
        isBestSeller: body.isBestSeller,
        metaTitle: body.metaTitle !== undefined ? (body.metaTitle || null) : undefined,
        metaDescription: body.metaDescription !== undefined ? (body.metaDescription || null) : undefined,
        metaKeywords: body.metaKeywords !== undefined ? (body.metaKeywords || null) : undefined,
        images: body.images,
        sizes: body.sizes,
        colors: body.colors,
      });

      if (!product) {
        return new Response(
          JSON.stringify({ error: "Không tìm thấy sản phẩm" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify(product), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi cập nhật sản phẩm";
      const isDuplicate = message.includes("duplicate") || message.includes("unique");
      return new Response(
        JSON.stringify({ error: isDuplicate ? "Slug đã tồn tại" : message }),
        { status: isDuplicate ? 409 : 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  // DELETE /api/admin/products/:id — Delete product
  async DELETE(_req, ctx) {
    const deleted = await deleteProduct(ctx.params.id);
    if (!deleted) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy sản phẩm" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
