import { useState } from "preact/hooks";

export default function CheckoutForm() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);

    // Clear cart on successful order
    setTimeout(() => {
      localStorage.removeItem("allstar_cart");
      globalThis.dispatchEvent(new CustomEvent("cart-updated"));
      globalThis.location.href = "/order-success";
    }, 800);
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={submitting}
      class={`w-full py-4 text-sm tracking-extra-wide uppercase transition-all duration-300 ${
        submitting
          ? "bg-brand-gray text-white cursor-wait"
          : "bg-brand-black text-white hover:opacity-80"
      }`}
    >
      {submitting ? "Đang xử lý..." : "Đặt Hàng"}
    </button>
  );
}
