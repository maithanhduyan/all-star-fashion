// routes/api/auth/register.ts
import { Handlers } from "$fresh/server.ts";
import { register, getSessionCookie, AuthError } from "../../../lib/services/auth.service.ts";
import { RegisterSchema, formatZodError } from "../../../lib/validation.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const body = await req.json();
      const parsed = RegisterSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: formatZodError(parsed.error), code: "VALIDATION_ERROR" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const { user, sessionId } = await register(parsed.data);

      return new Response(
        JSON.stringify({ user }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": getSessionCookie(sessionId),
          },
        },
      );
    } catch (error) {
      if (error instanceof AuthError) {
        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          { status: error.status, headers: { "Content-Type": "application/json" } },
        );
      }
      console.error("Register error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
