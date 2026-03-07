// routes/api/orders/[id].ts — GET order detail
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../_middleware.ts";
import { getOrderById, getOrderOwner } from "../../../lib/services/order.service.ts";

export const handler: Handlers<unknown, AppState> = {
  async GET(_req, ctx) {
    const orderId = ctx.params.id;

    // Get order
    const order = await getOrderById(orderId);
    if (!order) {
      return new Response(
        JSON.stringify({ error: "Order not found", code: "NOT_FOUND" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check authorization: owner or admin
    const user = ctx.state.user;
    if (user) {
      const ownerId = await getOrderOwner(orderId);
      if (user.role !== "admin" && ownerId !== user.id) {
        return new Response(
          JSON.stringify({ error: "Forbidden", code: "FORBIDDEN" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
    }
    // Guest can view order by ID (they receive the ID after checkout)

    return new Response(
      JSON.stringify({ order }),
      { headers: { "Content-Type": "application/json" } },
    );
  },
};
