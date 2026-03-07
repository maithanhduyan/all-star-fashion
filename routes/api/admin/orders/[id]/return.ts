// routes/api/admin/orders/[id]/return.ts — Manage order returns
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../../_middleware.ts";
import {
  createReturn,
  approveReturn,
  completeReturn,
  rejectReturn,
  OrderError,
} from "../../../../../lib/services/order.service.ts";
import {
  CreateReturnSchema,
  ResolveReturnSchema,
  formatZodError,
} from "../../../../../lib/validation.ts";

export const handler: Handlers<unknown, AppState> = {
  // POST /api/admin/orders/:id/return — Create return request
  async POST(req, ctx) {
    try {
      const body = await req.json();
      const parsed = CreateReturnSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: formatZodError(parsed.error), code: "VALIDATION_ERROR" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const actorId = ctx.state.user?.id;
      const actorName = ctx.state.user?.name || "Admin";

      const ret = await createReturn(
        ctx.params.id,
        parsed.data.reason,
        parsed.data.refundAmount,
        actorId,
        actorName,
      );

      return new Response(JSON.stringify({ return: ret }), {
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
      console.error("Create return error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  // PATCH /api/admin/orders/:id/return — Approve, Complete, or Reject return
  async PATCH(req, ctx) {
    try {
      const body = await req.json();
      const { returnId, action, adminNote } = body;

      if (!returnId) {
        return new Response(
          JSON.stringify({ error: "Thiếu returnId", code: "VALIDATION_ERROR" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const actorId = ctx.state.user?.id;
      const actorName = ctx.state.user?.name || "Admin";

      let result;
      switch (action) {
        case "approve": {
          const parsed = ResolveReturnSchema.safeParse({ adminNote });
          if (!parsed.success) {
            return new Response(
              JSON.stringify({ error: formatZodError(parsed.error), code: "VALIDATION_ERROR" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }
          result = await approveReturn(returnId, parsed.data.adminNote, actorId, actorName);
          break;
        }
        case "complete":
          result = await completeReturn(returnId, actorId, actorName);
          break;
        case "reject":
          if (!adminNote) {
            return new Response(
              JSON.stringify({ error: "Vui lòng nhập lý do từ chối", code: "VALIDATION_ERROR" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }
          result = await rejectReturn(returnId, adminNote, actorId, actorName);
          break;
        default:
          return new Response(
            JSON.stringify({ error: "Action không hợp lệ", code: "INVALID_ACTION" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
      }

      return new Response(JSON.stringify({ return: result }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof OrderError) {
        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          { status: error.status, headers: { "Content-Type": "application/json" } },
        );
      }
      console.error("Update return error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
