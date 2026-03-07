import Layout from "../components/Layout.tsx";
import CheckoutForm from "../islands/CheckoutForm.tsx";

export default function CheckoutPage() {
  return (
    <Layout>
      <div class="max-w-6xl mx-auto px-6 py-16">
        <h1 class="font-display text-3xl md:text-4xl font-light tracking-wide mb-12">
          Thanh Toán
        </h1>

        <div class="grid lg:grid-cols-[1fr_400px] gap-12">
          {/* Checkout Form */}
          <div class="space-y-8">
            {/* Contact */}
            <section>
              <h2 class="text-sm tracking-wider uppercase mb-4">
                Thông Tin Liên Hệ
              </h2>
              <div class="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
              </div>
            </section>

            {/* Shipping */}
            <section>
              <h2 class="text-sm tracking-wider uppercase mb-4">
                Địa Chỉ Giao Hàng
              </h2>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Họ"
                    class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Tên"
                    class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Địa chỉ"
                  class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
                />
                <div class="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Thành phố"
                    class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Quận/Huyện"
                    class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 class="text-sm tracking-wider uppercase mb-4">
                Phương Thức Thanh Toán
              </h2>
              <div class="space-y-3">
                <label class="flex items-center gap-3 border border-brand-light-gray px-4 py-3 cursor-pointer hover:border-brand-black transition-colors">
                  <input type="radio" name="payment" value="cod" checked class="accent-brand-black" />
                  <span class="text-sm">Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label class="flex items-center gap-3 border border-brand-light-gray px-4 py-3 cursor-pointer hover:border-brand-black transition-colors">
                  <input type="radio" name="payment" value="bank" class="accent-brand-black" />
                  <span class="text-sm">Chuyển khoản ngân hàng</span>
                </label>
                <label class="flex items-center gap-3 border border-brand-light-gray px-4 py-3 cursor-pointer hover:border-brand-black transition-colors">
                  <input type="radio" name="payment" value="stripe" class="accent-brand-black" />
                  <span class="text-sm">Thẻ tín dụng / Stripe</span>
                </label>
              </div>
            </section>

            <CheckoutForm />
          </div>

          {/* Order Summary */}
          <div class="bg-brand-beige p-8">
            <h2 class="text-sm tracking-wider uppercase mb-6">
              Tóm Tắt Đơn Hàng
            </h2>
            <div class="space-y-4 text-sm">
              <div class="flex justify-between">
                <span class="text-brand-gray">Tạm tính</span>
                <span>0₫</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-gray">Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <div class="border-t border-brand-light-gray pt-4 flex justify-between text-base font-medium">
                <span>Tổng cộng</span>
                <span>0₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
