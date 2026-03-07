// routes/api/auth/me.ts
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../_middleware.ts";

export const handler: Handlers<unknown, AppState> = {
  GET(_req, ctx) {
    if (!ctx.state.user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated", code: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ user: ctx.state.user }),
      { headers: { "Content-Type": "application/json" } },
    );
  },
};
