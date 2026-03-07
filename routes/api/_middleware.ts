// routes/api/_middleware.ts — Set default JSON content-type for API responses
import { MiddlewareHandlerContext } from "$fresh/server.ts";

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext,
) {
  const resp = await ctx.next();
  // Only set content-type if not already set
  if (!resp.headers.has("content-type")) {
    resp.headers.set("content-type", "application/json; charset=utf-8");
  }
  return resp;
}
