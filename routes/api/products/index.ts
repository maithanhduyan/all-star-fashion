import { Handlers } from "$fresh/server.ts";
import { products } from "../../../lib/data.ts";

export const handler: Handlers = {
  GET(_req, _ctx) {
    return new Response(JSON.stringify(products), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
