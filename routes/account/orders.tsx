import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import Layout from "../../components/Layout.tsx";
import { getOrdersByUserId } from "../../lib/services/order.service.ts";
import { formatPrice } from "../../lib/utils.ts";

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

interface OrdersData {
  orders: OrderListItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
  shipping: { label: "Đang giao", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
};

export const handler: Handlers<OrdersData, AppState> = {
  async GET(_req, ctx) {
    const user = ctx.state.user!;
    const orders = await getOrdersByUserId(user.id);
    return ctx.render({ orders });
  },
};

export default function OrdersPage({ data }: PageProps<OrdersData>) {
  const { orders } = data;

  return (
    <Layout>
      <div class="max-w-3xl mx-auto px-6 py-16">
        <div class="flex items-center justify-between mb-10">
          <h1 class="font-display text-3xl font-light tracking-wide">
            Đơn Hàng
          </h1>
          <a href="/account" class="text-sm text-brand-gray hover:text-brand-black transition-colors">
            ← Tài khoản
          </a>
        </div>

        {orders.length === 0 ? (
          <div class="text-center py-16">
            <p class="text-brand-gray mb-6">Bạn chưa có đơn hàng nào</p>
            <a href="/shop" class="btn-luxury inline-block">Mua Sắm Ngay</a>
          </div>
        ) : (
          <div class="space-y-4">
            {orders.map((order) => {
              const statusInfo = STATUS_MAP[order.status] || {
                label: order.status,
                color: "bg-gray-100 text-gray-800",
              };
              return (
                <a
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  class="block border border-brand-light-gray p-5 hover:border-brand-black transition-colors"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium">#{order.orderNumber}</span>
                    <span class={`text-xs px-2 py-1 rounded ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm text-brand-gray">
                    <span>{order.itemCount} sản phẩm</span>
                    <span class="font-medium text-brand-black">{formatPrice(order.total)}</span>
                  </div>
                  <p class="text-xs text-brand-gray mt-1">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
