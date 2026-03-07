// routes/api/admin/orders/index.ts — Admin order list API
import { Handlers } from "$fresh/server.ts";
import type { AppState } from "../../../_middleware.ts";
import { getAllOrders, getShippingCarriers, exportOrdersCSV } from "../../../../lib/services/order.service.ts";

export const handler: Handlers<unknown, AppState> = {
  // GET /api/admin/orders — List orders with search, filter, pagination, date range
  async GET(req, _ctx) {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const paymentStatus = url.searchParams.get("paymentStatus") ?? undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);
    const sort = url.searchParams.get("sort") ?? undefined;
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
    const dateTo = url.searchParams.get("dateTo") ?? undefined;
    const format = url.searchParams.get("format");

    // CSV export
    if (format === "csv") {
      const csv = await exportOrdersCSV({ status, dateFrom, dateTo });
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="orders_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const [result, carriers] = await Promise.all([
      getAllOrders({ q, status, paymentStatus, page, limit, sort, dateFrom, dateTo }),
      getShippingCarriers(),
    ]);

    return new Response(JSON.stringify({ ...result, carriers }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
