import { Handlers } from "$fresh/server.ts";
import { getProductBySlug } from "../../../lib/services/product.service.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const product = await getProductBySlug(ctx.params.slug);
    if (!product) {
      return new Response(
        JSON.stringify({ error: "Product not found", code: "NOT_FOUND" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify(product), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
