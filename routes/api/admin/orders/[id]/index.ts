// routes/api/admin/orders/[id]/index.ts — Admin order detail + status update
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../../_middleware.ts";
import {
  getOrderById,
  updateOrderStatus,
  assignCarrier,
  markOrderPaid,
  OrderError,
} from "../../../../../lib/services/order.service.ts";
import {
  UpdateOrderStatusSchema,
  AssignCarrierSchema,
  formatZodError,
} from "../../../../../lib/validation.ts";

export const handler: Handlers<unknown, AppState> = {
  // GET /api/admin/orders/:id — Order detail
  async GET(_req, ctx) {
    const order = await getOrderById(ctx.params.id);
    if (!order) {
      return new Response(
        JSON.stringify({ error: "Đơn hàng không tồn tại", code: "NOT_FOUND" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ order }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // PATCH /api/admin/orders/:id — Update order status
  async PATCH(req, ctx) {
    try {
      const body = await req.json();
      const actorId = ctx.state.user?.id;
      const actorName = ctx.state.user?.name || "Admin";

      // Determine action type
      if (body.action === "assign_carrier") {
        const parsed = AssignCarrierSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: formatZodError(parsed.error), code: "VALIDATION_ERROR" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        const order = await assignCarrier(
          ctx.params.id,
          parsed.data.carrierId,
          parsed.data.trackingNumber,
          actorId,
          actorName,
        );
        if (!order) {
          return new Response(
            JSON.stringify({ error: "Đơn hàng không tồn tại", code: "NOT_FOUND" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ order }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (body.action === "mark_paid") {
        const order = await markOrderPaid(ctx.params.id, actorId, actorName);
        if (!order) {
          return new Response(
            JSON.stringify({ error: "Đơn hàng không tồn tại", code: "NOT_FOUND" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ order }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Default: status update
      const parsed = UpdateOrderStatusSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: formatZodError(parsed.error), code: "VALIDATION_ERROR" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const order = await updateOrderStatus(
        ctx.params.id,
        parsed.data.status,
        { note: parsed.data.note, actorId, actorName },
      );
      if (!order) {
        return new Response(
          JSON.stringify({ error: "Đơn hàng không tồn tại", code: "NOT_FOUND" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ order }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof OrderError) {
        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          { status: error.status, headers: { "Content-Type": "application/json" } },
        );
      }
      console.error("Admin order update error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
