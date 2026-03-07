// routes/api/orders/index.ts — POST create order, GET list user orders
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../_middleware.ts";
import { createOrder, getOrdersByUserId, OrderError } from "../../../lib/services/order.service.ts";
import { CreateOrderSchema, formatZodError } from "../../../lib/validation.ts";

export const handler: Handlers<unknown, AppState> = {
  async POST(req, ctx) {
    try {
      const body = await req.json();
      const parsed = CreateOrderSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: formatZodError(parsed.error), code: "VALIDATION_ERROR" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // User can be null (guest checkout)
      const userId = ctx.state.user?.id ?? null;

      const order = await createOrder(parsed.data, userId);

      return new Response(
        JSON.stringify({ order }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      if (error instanceof OrderError) {
        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          { status: error.status, headers: { "Content-Type": "application/json" } },
        );
      }
      console.error("Create order error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  async GET(_req, ctx) {
    if (!ctx.state.user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated", code: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await getOrdersByUserId(ctx.state.user.id);
    return new Response(
      JSON.stringify({ data }),
      { headers: { "Content-Type": "application/json" } },
    );
  },
};
