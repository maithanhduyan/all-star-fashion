import { Handlers } from "$fresh/server.ts";
import { getProducts } from "../../../lib/services/product.service.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") ?? undefined;
    const q = url.searchParams.get("q") ?? undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);
    const sort = url.searchParams.get("sort") ?? undefined;

    const result = await getProducts({ category, q, page, limit, sort });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
