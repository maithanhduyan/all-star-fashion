// routes/api/admin/orders/[id]/invoice.ts — Create invoice for order
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../../_middleware.ts";
import { createInvoice, OrderError } from "../../../../../lib/services/order.service.ts";

export const handler: Handlers<unknown, AppState> = {
  // POST /api/admin/orders/:id/invoice — Generate invoice
  async POST(_req, ctx) {
    try {
      const actorId = ctx.state.user?.id;
      const actorName = ctx.state.user?.name || "Admin";

      const invoice = await createInvoice(ctx.params.id, actorId, actorName);

      return new Response(JSON.stringify({ invoice }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof OrderError) {
        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          { status: error.status, headers: { "Content-Type": "application/json" } },
        );
      }
      console.error("Create invoice error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
