import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import { getDashboardStats } from "../../lib/services/order.service.ts";
import { formatPrice } from "../../lib/utils.ts";

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
}

export const handler: Handlers<DashboardData, AppState> = {
  async GET(_req, ctx) {
    const stats = await getDashboardStats();
    return ctx.render(stats);
  },
};

export default function AdminDashboard({ data }: PageProps<DashboardData>) {
  return (
    <AdminLayout title="Dashboard">
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Tổng đơn hàng" value={String(data.totalOrders)} />
        <StatCard label="Doanh thu" value={formatPrice(data.totalRevenue)} />
        <StatCard label="Chờ xác nhận" value={String(data.pendingOrders)} highlight />
        <StatCard label="Hôm nay" value={String(data.todayOrders)} />
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <div class="border border-brand-light-gray p-6">
          <h2 class="text-sm tracking-wider uppercase mb-4">Liên Kết Nhanh</h2>
          <div class="space-y-3">
            <a href="/admin/orders" class="block text-sm hover:underline">→ Quản lý đơn hàng</a>
            <a href="/admin/products" class="block text-sm hover:underline">→ Quản lý sản phẩm</a>
            <a href="/admin/reports" class="block text-sm hover:underline">→ Báo cáo kinh doanh</a>
            <a href="/" class="block text-sm text-brand-gray hover:underline">← Về trang chủ</a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div class={`border p-6 ${highlight ? "border-yellow-400 bg-yellow-50" : "border-brand-light-gray"}`}>
      <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">{label}</p>
      <p class="text-2xl font-display tracking-wide">{value}</p>
    </div>
  );
}

function AdminLayout({ title, children }: { title: string; children: preact.ComponentChildren }) {
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
              <a href="/admin/reports" class="hover:text-gray-300 transition-colors">Báo cáo</a>
            </nav>
          </div>
          <a href="/" class="text-sm text-gray-300 hover:text-white transition-colors">← Trang chủ</a>
        </div>
      </header>

      {/* Content */}
      <main class="max-w-7xl mx-auto px-6 py-8">
        <h1 class="font-display text-3xl font-light tracking-wide mb-8">{title}</h1>
        {children}
      </main>
    </div>
  );
}
