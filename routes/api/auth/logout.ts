// routes/api/auth/logout.ts
import { Handlers } from "$fresh/server.ts";
import {
  logout,
  parseSessionIdFromCookie,
  getClearSessionCookie,
} from "../../../lib/services/auth.service.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    const cookieHeader = req.headers.get("cookie");
    const sessionId = parseSessionIdFromCookie(cookieHeader);

    if (sessionId) {
      await logout(sessionId);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": getClearSessionCookie(),
        },
      },
    );
  },
};
