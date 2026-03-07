import { Handlers } from "$fresh/server.ts";
import { getProductBySlug } from "../../../lib/data.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    const product = getProductBySlug(ctx.params.slug);
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(product), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
