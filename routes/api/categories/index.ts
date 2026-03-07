// routes/api/categories/index.ts
import { Handlers } from "$fresh/server.ts";
import { getCategories } from "../../../lib/services/category.service.ts";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    const data = await getCategories();
    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
