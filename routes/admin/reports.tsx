import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import { getBusinessReport } from "../../lib/services/order.service.ts";
import BusinessReports from "../../islands/BusinessReports.tsx";

interface ReportPageData {
  report: unknown;
}

export const handler: Handlers<ReportPageData, AppState> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
    const dateTo = url.searchParams.get("dateTo") ?? undefined;

    const report = await getBusinessReport(dateFrom, dateTo);

    return ctx.render({ report });
  },
};

export default function AdminReportsPage({ data }: PageProps<ReportPageData>) {
  return (
    <div class="min-h-screen bg-gray-50">
      {/* Admin header */}
      <header class="bg-brand-black text-white">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/admin" class="font-display text-lg tracking-wide">Admin Panel</a>
            <nav class="hidden md:flex items-center gap-4 text-sm">
              <a href="/admin" class="hover:text-gray-300 transition-colors">Dashboard</a>
              <a href="/admin/orders" class="hover:text-gray-300 transition-colors">Đơn hàng</a>
              <a href="/admin/invoices" class="hover:text-gray-300 transition-colors">Hóa đơn</a>
              <a href="/admin/products" class="hover:text-gray-300 transition-colors">Sản phẩm</a>
              <a href="/admin/reports" class="text-white underline">Báo cáo</a>
            </nav>
          </div>
          <a href="/" class="text-sm text-gray-300 hover:text-white transition-colors">← Trang chủ</a>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="font-display text-3xl font-light tracking-wide">
            Báo Cáo Kinh Doanh
          </h1>
          <a
            href="/admin/orders"
            class="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Quản lý đơn hàng
          </a>
        </div>

        <BusinessReports initialReport={data.report as any} />
      </main>
    </div>
  );
}
