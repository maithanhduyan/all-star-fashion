import Layout from "../components/Layout.tsx";

export default function OrderSuccessPage() {
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

        {/* Order number */}
        <div class="bg-brand-beige p-6 rounded-sm mb-8">
          <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">
            Mã đơn hàng
          </p>
          <p class="font-display text-2xl tracking-wide">
            #AS-2026-{Math.floor(Math.random() * 9000 + 1000)}
          </p>
        </div>

        {/* Info cards */}
        <div class="grid sm:grid-cols-2 gap-4 mb-10 text-left">
          <div class="border border-brand-light-gray p-5">
            <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">
              Phương thức thanh toán
            </p>
            <p class="text-sm">Chuyển khoản ngân hàng</p>
          </div>
          <div class="border border-brand-light-gray p-5">
            <p class="text-xs tracking-wider uppercase text-brand-gray mb-2">
              Thời gian giao hàng dự kiến
            </p>
            <p class="text-sm">2-5 ngày làm việc</p>
          </div>
        </div>

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
