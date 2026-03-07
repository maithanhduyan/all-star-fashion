// routes/api/admin/invoices/index.ts — Invoice list API for accounting
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../_middleware.ts";
import { getAllInvoices } from "../../../../lib/services/order.service.ts";

export const handler: Handlers<unknown, AppState> = {
  // GET /api/admin/invoices — List invoices with search, filter, pagination
  async GET(req, _ctx) {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const paymentStatus = url.searchParams.get("paymentStatus") ?? undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
    const dateTo = url.searchParams.get("dateTo") ?? undefined;

    const result = await getAllInvoices({ q, paymentStatus, page, limit, dateFrom, dateTo });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
