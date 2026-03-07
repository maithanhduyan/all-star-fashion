// routes/account/orders/[id].tsx — Order detail page
import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../../_middleware.ts";
import Layout from "../../../components/Layout.tsx";
import { getOrderById, getOrderOwner } from "../../../lib/services/order.service.ts";
import type { OrderResponse } from "../../../lib/services/order.service.ts";
import { formatPrice } from "../../../lib/utils.ts";

interface OrderDetailData {
  order: OrderResponse;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
  shipping: { label: "Đang giao", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Đã giao", color: "bg-green-100 text-green-800" },
  completed: { label: "Hoàn thành", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800" },
  returning: { label: "Đang trả hàng", color: "bg-orange-100 text-orange-800" },
  returned: { label: "Đã trả hàng", color: "bg-gray-100 text-gray-800" },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  unpaid: { label: "Chưa thanh toán", color: "text-red-600" },
  paid: { label: "Đã thanh toán", color: "text-green-600" },
  refunded: { label: "Đã hoàn tiền", color: "text-orange-600" },
  partial_refund: { label: "Hoàn tiền một phần", color: "text-orange-600" },
};

export const handler: Handlers<OrderDetailData, AppState> = {
  async GET(_req, ctx) {
    const user = ctx.state.user!;
    const orderId = ctx.params.id;

    const order = await getOrderById(orderId);
    if (!order) {
      return ctx.renderNotFound();
    }

    // Check ownership (unless admin)
    if (user.role !== "admin") {
      const ownerId = await getOrderOwner(orderId);
      if (ownerId !== user.id) {
        return ctx.renderNotFound();
      }
    }

    return ctx.render({ order });
  },
};

export default function OrderDetailPage({ data }: PageProps<OrderDetailData>) {
  const { order } = data;
  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
  const paymentInfo = PAYMENT_STATUS_MAP[order.paymentStatus] || { label: order.paymentStatus, color: "" };

  return (
    <Layout>
      <div class="max-w-3xl mx-auto px-6 py-16">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h1 class="font-display text-2xl font-light tracking-wide">
              Đơn hàng #{order.orderNumber}
            </h1>
            <p class="text-xs text-brand-gray mt-1">
              {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <a href="/account/orders" class="text-sm text-brand-gray hover:text-brand-black transition-colors">
            ← Đơn hàng
          </a>
        </div>

        <div class="grid gap-6">
          {/* Status & Payment */}
          <div class="border border-brand-light-gray p-5">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-xs text-brand-gray uppercase tracking-wider">Trạng thái</span>
                <div class="mt-1">
                  <span class={`text-xs px-3 py-1 rounded ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <span class="text-xs text-brand-gray uppercase tracking-wider">Thanh toán</span>
                <div class={`mt-1 text-sm font-medium ${paymentInfo.color}`}>
                  {paymentInfo.label}
                </div>
              </div>
            </div>

            {order.carrier && (
              <div class="mt-4 pt-4 border-t border-brand-light-gray">
                <span class="text-xs text-brand-gray">Đơn vị vận chuyển: </span>
                <span class="text-sm">{order.carrier.name}</span>
                {order.trackingNumber && (
                  <span class="text-sm ml-2">
                    - Mã vận đơn: <span class="font-medium">{order.trackingNumber}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div class="border border-brand-light-gray p-5">
            <h2 class="text-sm tracking-wider uppercase mb-4">Sản Phẩm</h2>
            <div class="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} class="flex gap-4">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      class="w-16 h-16 object-cover"
                    />
                  )}
                  <div class="flex-1">
                    <p class="text-sm font-medium">{item.productName}</p>
                    <p class="text-xs text-brand-gray mt-1">
                      Size: {item.size} | Màu: {item.color} | SL: {item.quantity}
                    </p>
                  </div>
                  <div class="text-sm font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div class="mt-4 pt-4 border-t border-brand-light-gray space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-brand-gray">Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-gray">Phí vận chuyển</span>
                <span>{order.shippingFee === 0 ? "Miễn phí" : formatPrice(order.shippingFee)}</span>
              </div>
              <div class="flex justify-between font-medium text-base pt-2 border-t border-brand-light-gray">
                <span>Tổng cộng</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping info */}
          <div class="border border-brand-light-gray p-5">
            <h2 class="text-sm tracking-wider uppercase mb-4">Thông Tin Giao Hàng</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-brand-gray">Người nhận</span>
                <span>{order.customerName}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-gray">Điện thoại</span>
                <span>{order.customerPhone}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-gray">Email</span>
                <span>{order.customerEmail}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-gray">Địa chỉ</span>
                <span class="text-right max-w-xs">
                  {order.shippingAddress}, {order.district}, {order.city}
                </span>
              </div>
              {order.note && (
                <div class="flex justify-between">
                  <span class="text-brand-gray">Ghi chú</span>
                  <span class="text-right max-w-xs">{order.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div class="border border-brand-light-gray p-5">
              <h2 class="text-sm tracking-wider uppercase mb-4">Lịch Sử Đơn Hàng</h2>
              <div class="space-y-3">
                {order.timeline.map((entry) => (
                  <div key={entry.id} class="flex gap-3 text-sm">
                    <div class="w-2 h-2 rounded-full bg-brand-black mt-1.5 shrink-0"></div>
                    <div>
                      <p class="font-medium">{entry.action}</p>
                      {entry.note && <p class="text-xs text-brand-gray">{entry.note}</p>}
                      <p class="text-xs text-brand-gray">
                        {new Date(entry.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {entry.actorName && ` — ${entry.actorName}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Return info */}
          {order.returnInfo && (
            <div class="border border-orange-200 bg-orange-50 p-5">
              <h2 class="text-sm tracking-wider uppercase mb-3">Thông Tin Trả Hàng</h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-brand-gray">Mã trả hàng</span>
                  <span>#{order.returnInfo.returnNumber}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-brand-gray">Lý do</span>
                  <span class="text-right max-w-xs">{order.returnInfo.reason}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-brand-gray">Trạng thái</span>
                  <span class="capitalize">{order.returnInfo.status}</span>
                </div>
                {order.returnInfo.refundAmount > 0 && (
                  <div class="flex justify-between">
                    <span class="text-brand-gray">Hoàn tiền</span>
                    <span>{formatPrice(order.returnInfo.refundAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
