// routes/api/account/addresses.ts — CRUD for user addresses
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../_middleware.ts";
import {
  getUserAddresses,
  addUserAddress,
  AuthError,
} from "../../../../lib/services/auth.service.ts";
import { z } from "zod";

const AddAddressSchema = z.object({
  label: z.string().min(1).max(50).default("Nhà"),
  recipientName: z.string().min(1, "Vui lòng nhập tên người nhận").max(100),
  phone: z.string().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  address: z.string().min(1, "Vui lòng nhập địa chỉ").max(500),
  district: z.string().min(1, "Vui lòng nhập quận/huyện").max(100),
  city: z.string().min(1, "Vui lòng nhập thành phố").max(100),
  isDefault: z.boolean().optional(),
});

export const handler: Handlers<unknown, AppState> = {
  async GET(_req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const addresses = await getUserAddresses(user.id);
    return new Response(JSON.stringify({ addresses }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  async POST(req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const input = AddAddressSchema.parse(body);
      const address = await addUserAddress(user.id, input);
      return new Response(JSON.stringify({ address }), {
        status: 201,
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
};
