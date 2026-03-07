// routes/api/admin/orders/[id]/status.ts — PATCH update order status
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../../_middleware.ts";
import { updateOrderStatus } from "../../../../../lib/services/order.service.ts";
import { UpdateOrderStatusSchema, formatZodError } from "../../../../../lib/validation.ts";

export const handler: Handlers<unknown, AppState> = {
  async PATCH(req, ctx) {
    // Admin only
    if (!ctx.state.user || ctx.state.user.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required", code: "FORBIDDEN" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const body = await req.json();
      const parsed = UpdateOrderStatusSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: formatZodError(parsed.error), code: "VALIDATION_ERROR" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const order = await updateOrderStatus(ctx.params.id, parsed.data.status);
      if (!order) {
        return new Response(
          JSON.stringify({ error: "Order not found", code: "NOT_FOUND" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ order }),
        { headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Update order status error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
