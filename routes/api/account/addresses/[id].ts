// routes/api/account/addresses/[id].ts — Update/Delete a user address
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../_middleware.ts";
import {
  updateUserAddress,
  deleteUserAddress,
  AuthError,
} from "../../../../lib/services/auth.service.ts";
import { z } from "zod";

const UpdateAddressSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  recipientName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ").optional(),
  address: z.string().min(1).max(500).optional(),
  district: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
});

export const handler: Handlers<unknown, AppState> = {
  async PUT(req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const addressId = ctx.params.id;
    try {
      const body = await req.json();
      const input = UpdateAddressSchema.parse(body);
      const address = await updateUserAddress(user.id, addressId, input);
      return new Response(JSON.stringify({ address }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return new Response(JSON.stringify({ error: err.errors[0].message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (err instanceof AuthError) {
        return new Response(JSON.stringify({ error: err.message, code: err.code }), {
          status: err.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw err;
    }
  },

  async DELETE(_req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const addressId = ctx.params.id;
    try {
      await deleteUserAddress(user.id, addressId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return new Response(JSON.stringify({ error: err.message, code: err.code }), {
          status: err.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw err;
    }
  },
};
