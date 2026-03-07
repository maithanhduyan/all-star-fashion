// routes/admin/_middleware.ts — Require admin role for admin pages
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<AppState>,
) {
  if (!ctx.state.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/auth/login?redirect=/admin" },
    });
  }

  if (ctx.state.user.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  return await ctx.next();
}
