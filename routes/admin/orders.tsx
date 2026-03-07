import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import { getAllOrders } from "../../lib/services/order.service.ts";
import { formatPrice } from "../../lib/utils.ts";
import AdminOrderActions from "../../islands/AdminOrderActions.tsx";

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

interface OrdersData {
  orders: OrderItem[];
  statusFilter: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
  shipping: { label: "Đang giao", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
};

export const handler: Handlers<OrdersData, AppState> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") || "";
    const result = await getAllOrders({ status: statusFilter || undefined, limit: 50 });
    return ctx.render({ orders: result.data, statusFilter });
  },
};

export default function AdminOrdersPage({ data }: PageProps<OrdersData>) {
  const { orders, statusFilter } = data;

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Admin header */}
      <header class="bg-brand-black text-white">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/admin" class="font-display text-lg tracking-wide">Admin Panel</a>
            <nav class="hidden md:flex items-center gap-4 text-sm">
              <a href="/admin" class="hover:text-gray-300 transition-colors">Dashboard</a>
              <a href="/admin/orders" class="text-white underline">Đơn hàng</a>
              <a href="/admin/products" class="hover:text-gray-300 transition-colors">Sản phẩm</a>
            </nav>
          </div>
          <a href="/" class="text-sm text-gray-300 hover:text-white transition-colors">← Trang chủ</a>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-8">
        <h1 class="font-display text-3xl font-light tracking-wide mb-8">
          Quản Lý Đơn Hàng
        </h1>

        {/* Status filters */}
        <div class="flex flex-wrap gap-2 mb-6">
          <a
            href="/admin/orders"
            class={`px-3 py-1.5 text-xs tracking-wide uppercase border transition-colors ${
              !statusFilter ? "bg-brand-black text-white border-brand-black" : "border-brand-light-gray hover:border-brand-black"
            }`}
          >
            Tất cả ({orders.length})
          </a>
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <a
              key={key}
              href={`/admin/orders?status=${key}`}
              class={`px-3 py-1.5 text-xs tracking-wide uppercase border transition-colors ${
                statusFilter === key ? "bg-brand-black text-white border-brand-black" : "border-brand-light-gray hover:border-brand-black"
              }`}
            >
              {val.label}
            </a>
          ))}
        </div>

        {/* Orders table */}
        {orders.length === 0 ? (
          <p class="text-brand-gray text-center py-16">Không có đơn hàng nào</p>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-brand-light-gray text-left">
                  <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Mã đơn</th>
                  <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Khách hàng</th>
                  <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">SĐT</th>
                  <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Tổng</th>
                  <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Trạng thái</th>
                  <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Ngày</th>
                  <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || {
                    label: order.status,
                    color: "bg-gray-100 text-gray-800",
                  };
                  return (
                    <tr key={order.id} class="border-b border-brand-light-gray/50 hover:bg-white">
                      <td class="py-3 px-2 font-medium">#{order.orderNumber}</td>
                      <td class="py-3 px-2">{order.customerName}</td>
                      <td class="py-3 px-2">{order.customerPhone}</td>
                      <td class="py-3 px-2">{formatPrice(order.total)}</td>
                      <td class="py-3 px-2">
                        <span class={`text-xs px-2 py-1 rounded ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td class="py-3 px-2 text-brand-gray">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td class="py-3 px-2">
                        <AdminOrderActions orderId={order.id} currentStatus={order.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
