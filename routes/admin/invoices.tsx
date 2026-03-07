import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import { getAllInvoices } from "../../lib/services/order.service.ts";
import AdminInvoiceList from "../../islands/AdminInvoiceList.tsx";

interface InvoicesData {
  invoices: unknown[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const handler: Handlers<InvoicesData, AppState> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || undefined;
    const paymentStatus = url.searchParams.get("paymentStatus") || undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const dateFrom = url.searchParams.get("dateFrom") || undefined;
    const dateTo = url.searchParams.get("dateTo") || undefined;

    const result = await getAllInvoices({ q, paymentStatus, page, limit: 20, dateFrom, dateTo });

    return ctx.render({
      invoices: result.data,
      pagination: result.pagination,
    });
  },
};

export default function AdminInvoicesPage({ data }: PageProps<InvoicesData>) {
  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-brand-black text-white">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/admin" class="font-display text-lg tracking-wide">Admin Panel</a>
            <nav class="hidden md:flex items-center gap-4 text-sm">
              <a href="/admin" class="hover:text-gray-300 transition-colors">Dashboard</a>
              <a href="/admin/orders" class="hover:text-gray-300 transition-colors">Đơn hàng</a>
              <a href="/admin/invoices" class="text-white underline">Hóa đơn</a>
              <a href="/admin/products" class="hover:text-gray-300 transition-colors">Sản phẩm</a>
              <a href="/admin/reports" class="hover:text-gray-300 transition-colors">Báo cáo</a>
            </nav>
          </div>
          <a href="/" class="text-sm text-gray-300 hover:text-white transition-colors">← Trang chủ</a>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="font-display text-3xl font-light tracking-wide">
            Quản Lý Hóa Đơn
          </h1>
          <a
            href="/admin/orders"
            class="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Quản lý đơn hàng
          </a>
        </div>

        <AdminInvoiceList
          initialInvoices={data.invoices as any}
          initialPagination={data.pagination as any}
        />
      </main>
    </div>
  );
}
