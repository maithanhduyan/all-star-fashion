// routes/api/account/profile.ts — Update profile & change password
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../_middleware.ts";
import { updateProfile, changePassword, AuthError } from "../../../lib/services/auth.service.ts";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).transform((s) => s.trim()).optional(),
  phone: z.string().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ").optional().nullable(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự").max(100),
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

    try {
      const body = await req.json();
      const input = UpdateProfileSchema.parse(body);
      const updated = await updateProfile(user.id, {
        name: input.name,
        phone: input.phone ?? undefined,
      });
      return new Response(JSON.stringify({ user: updated }), {
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

  async PATCH(req, ctx) {
    // PATCH = change password
    const user = ctx.state.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const input = ChangePasswordSchema.parse(body);
      await changePassword(user.id, input.currentPassword, input.newPassword);
      return new Response(JSON.stringify({ success: true }), {
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
