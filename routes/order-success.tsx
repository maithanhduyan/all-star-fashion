import { Handlers, PageProps } from "$fresh/server.ts";
import Layout from "../components/Layout.tsx";
import { getOrderById } from "../lib/services/order.service.ts";
import { formatPrice } from "../lib/utils.ts";

interface OrderData {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  district: string;
}

export const handler: Handlers<OrderData | null> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return ctx.render(null);
    }

    try {
      const order = await getOrderById(id);
      if (!order) return ctx.render(null);

      return ctx.render({
        orderNumber: order.orderNumber,
        total: order.total,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        city: order.city,
        district: order.district,
      });
    } catch {
      return ctx.render(null);
    }
  },
};

export default function OrderSuccessPage({ data }: PageProps<OrderData | null>) {
  return (
    <Layout>
      <div class="max-w-2xl mx-auto px-6 py-24 text-center">
        {/* Success Icon */}
        <div class="w-20 h-20 mx-auto mb-8 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            class="w-10 h-10 text-green-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 class="font-display text-3xl md:text-4xl font-light tracking-wide mb-4">
          Đặt Hàng Thành Công!
        </h1>

        <p class="text-brand-gray leading-relaxed mb-3">
          Cảm ơn bạn đã mua sắm tại{" "}
          <span class="text-brand-black font-medium">All Star Fashion</span>.
        </p>
        <p class="text-brand-gray leading-relaxed mb-8">
          Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ để xác nhận
          và giao hàng trong thời gian sớm nhất.
        </p>

        {data && (
          <>
            {/* Order number */}
            <div class="bg-brand-beige p-6 rounded-sm mb-8">
              <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">
                Mã đơn hàng
              </p>
              <p class="font-display text-2xl tracking-wide">
                #{data.orderNumber}
              </p>
            </div>

            {/* Info cards */}
            <div class="grid sm:grid-cols-2 gap-4 mb-10 text-left">
              <div class="border border-brand-light-gray p-5">
                <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">
                  Phương thức thanh toán
                </p>
                <p class="text-sm">
                  {data.paymentMethod === "cod"
                    ? "Thanh toán khi nhận hàng (COD)"
                    : data.paymentMethod}
                </p>
              </div>
              <div class="border border-brand-light-gray p-5">
                <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">
                  Tổng thanh toán
                </p>
                <p class="text-sm font-medium">{formatPrice(data.total)}</p>
              </div>
              <div class="border border-brand-light-gray p-5">
                <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">
                  Giao đến
                </p>
                <p class="text-sm">{data.shippingAddress}, {data.district}, {data.city}</p>
              </div>
              <div class="border border-brand-light-gray p-5">
                <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">
                  Thời gian giao hàng dự kiến
                </p>
                <p class="text-sm">2-5 ngày làm việc</p>
              </div>
            </div>
          </>
        )}

        {!data && (
          <div class="bg-brand-beige p-6 rounded-sm mb-8">
            <p class="text-sm text-brand-gray">
              Đơn hàng đã được ghi nhận. Vui lòng kiểm tra email để biết thêm
              chi tiết.
            </p>
          </div>
        )}

        {/* Actions */}
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/shop"
            class="btn-luxury text-center"
          >
            Tiếp Tục Mua Sắm
          </a>
          <a
            href="/"
            class="btn-outline text-center"
          >
            Về Trang Chủ
          </a>
        </div>
      </div>
    </Layout>
  );
}
