// routes/api/auth/login.ts
import { Handlers } from "$fresh/server.ts";
import { login, getSessionCookie, AuthError } from "../../../lib/services/auth.service.ts";
import { LoginSchema, formatZodError } from "../../../lib/validation.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const body = await req.json();
      const parsed = LoginSchema.safeParse(body);

      if (!parsed.success) {
        return new Response(
          JSON.stringify({ error: formatZodError(parsed.error), code: "VALIDATION_ERROR" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const { user, sessionId } = await login(parsed.data);

      return new Response(
        JSON.stringify({ user }),
        {
          status: 200,
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
      console.error("Login error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", code: "INTERNAL_ERROR" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
