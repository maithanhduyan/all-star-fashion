// routes/api/admin/reports/index.ts — Business reports API
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../_middleware.ts";
import { getBusinessReport } from "../../../../lib/services/order.service.ts";

export const handler: Handlers<unknown, AppState> = {
  // GET /api/admin/reports — Business analytics data
  async GET(req, _ctx) {
    const url = new URL(req.url);
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
    const dateTo = url.searchParams.get("dateTo") ?? undefined;

    const report = await getBusinessReport(dateFrom, dateTo);

    return new Response(JSON.stringify({ report }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
