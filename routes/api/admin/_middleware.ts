// routes/api/admin/_middleware.ts — Require admin role for admin API endpoints
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import type { AppState } from "../../_middleware.ts";

export async function handler(
  _req: Request,
  ctx: MiddlewareHandlerContext<AppState>,
) {
  if (!ctx.state.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  if (ctx.state.user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  return await ctx.next();
}
