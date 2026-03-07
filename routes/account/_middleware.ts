// routes/account/_middleware.ts — Require authentication for account pages
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<AppState>,
) {
  if (!ctx.state.user) {
    const url = new URL(req.url);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/auth/login?redirect=${encodeURIComponent(url.pathname)}`,
      },
    });
  }

  return await ctx.next();
}
