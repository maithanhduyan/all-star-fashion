// routes/_middleware.ts — Root middleware: parse session cookie, attach user to state
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import {
  getUserBySessionId,
  parseSessionIdFromCookie,
} from "../lib/services/auth.service.ts";
import type { UserResponse } from "../lib/services/auth.service.ts";

export interface AppState {
  user: UserResponse | null;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<AppState>,
) {
  // Parse session from cookie
  const cookieHeader = req.headers.get("cookie");
  const sessionId = parseSessionIdFromCookie(cookieHeader);

  if (sessionId) {
    try {
      ctx.state.user = await getUserBySessionId(sessionId);
    } catch {
      ctx.state.user = null;
    }
  } else {
    ctx.state.user = null;
  }

  return await ctx.next();
}
