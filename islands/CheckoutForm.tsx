import { useState, useEffect, useRef } from "preact/hooks";

interface CartItem {
  product: { id: string; name: string; slug: string; price: number; images: string[] };
  size: string;
  color: string;
  quantity: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}

export default function CheckoutForm() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("allstar_cart");
      if (stored) setCart(JSON.parse(stored));
    } catch { /* empty cart */ }
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const shippingFee = subtotal >= 1000000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (cart.length === 0 || submitting) return;

    setSubmitting(true);
    setError("");

    const form = formRef.current!;
    const fd = new FormData(form);

    const body = {
      customerName: fd.get("customerName") as string,
      customerEmail: fd.get("customerEmail") as string,
      customerPhone: fd.get("customerPhone") as string,
      shippingAddress: fd.get("shippingAddress") as string,
      city: fd.get("city") as string,
      district: fd.get("district") as string,
      note: fd.get("note") as string || "",
      paymentMethod: "cod" as const,
      items: cart.map((i) => ({
        productId: i.product.id,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Có lỗi xảy ra, vui lòng thử lại");
        setSubmitting(false);
        return;
      }

      // Clear cart & redirect
      localStorage.removeItem("allstar_cart");
      globalThis.dispatchEvent(new CustomEvent("cart-updated"));
      globalThis.location.href = `/order-success?id=${data.order.id}`;
    } catch {
      setError("Không thể kết nối server. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div class="text-center py-12">
        <p class="text-brand-gray text-lg mb-6">Giỏ hàng trống</p>
        <a href="/shop" class="btn-luxury inline-block">Tiếp Tục Mua Sắm</a>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} class="grid lg:grid-cols-[1fr_400px] gap-12">
      {/* Left: Form Fields */}
      <div class="space-y-8">
        {/* Contact */}
        <section>
          <h2 class="text-sm tracking-wider uppercase mb-4">Thông Tin Liên Hệ</h2>
          <div class="space-y-4">
            <input
              type="text"
              name="customerName"
              placeholder="Họ và tên *"
              required
              class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
            />
            <input
              type="email"
              name="customerEmail"
              placeholder="Email *"
              required
              class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
            />
            <input
              type="tel"
              name="customerPhone"
              placeholder="Số điện thoại (VD: 0901234567) *"
              required
              pattern="^0\d{9,10}$"
              class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
            />
          </div>
        </section>

        {/* Shipping */}
        <section>
          <h2 class="text-sm tracking-wider uppercase mb-4">Địa Chỉ Giao Hàng</h2>
          <div class="space-y-4">
            <input
              type="text"
              name="shippingAddress"
              placeholder="Địa chỉ chi tiết *"
              required
              class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
            />
            <div class="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="city"
                placeholder="Thành phố *"
                required
                class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
              />
              <input
                type="text"
                name="district"
                placeholder="Quận/Huyện *"
                required
                class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Note */}
        <section>
          <h2 class="text-sm tracking-wider uppercase mb-4">Ghi Chú</h2>
          <textarea
            name="note"
            placeholder="Ghi chú cho đơn hàng (tùy chọn)"
            rows={3}
            class="w-full border border-brand-light-gray px-4 py-3 text-sm focus:outline-none focus:border-brand-black transition-colors resize-none"
          />
        </section>

        {/* Payment */}
        <section>
          <h2 class="text-sm tracking-wider uppercase mb-4">Phương Thức Thanh Toán</h2>
          <label class="flex items-center gap-3 border border-brand-black px-4 py-3 cursor-pointer bg-brand-beige/50">
            <input type="radio" name="payment" value="cod" checked class="accent-brand-black" />
            <span class="text-sm">Thanh toán khi nhận hàng (COD)</span>
          </label>
        </section>

        {/* Error */}
        {error && (
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          class={`w-full py-4 text-sm tracking-extra-wide uppercase transition-all duration-300 ${
            submitting
              ? "bg-brand-gray text-white cursor-wait"
              : "bg-brand-black text-white hover:opacity-80"
          }`}
        >
          {submitting ? "Đang xử lý..." : "Đặt Hàng"}
        </button>
      </div>

      {/* Right: Order Summary */}
      <div class="lg:sticky lg:top-32 self-start">
        <div class="bg-brand-beige p-8">
          <h2 class="text-sm tracking-wider uppercase mb-6">Tóm Tắt Đơn Hàng</h2>

          {/* Cart items */}
          <div class="space-y-4 mb-6">
            {cart.map((item, idx) => (
              <div key={idx} class="flex gap-4">
                <div class="w-16 h-20 bg-white flex-shrink-0 overflow-hidden">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{item.product.name}</p>
                  <p class="text-xs text-brand-gray mt-0.5">
                    {item.size} / {item.color} × {item.quantity}
                  </p>
                  <p class="text-sm mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div class="space-y-3 text-sm border-t border-brand-light-gray pt-4">
            <div class="flex justify-between">
              <span class="text-brand-gray">Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-brand-gray">Phí vận chuyển</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
            </div>
            <div class="border-t border-brand-light-gray pt-3 flex justify-between text-base font-medium">
              <span>Tổng cộng</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
