import { useEffect, useState } from "preact/hooks";
import { getCart, getCartCount } from "../lib/cart.ts";

export default function CartBadge() {
  const [count, setCount] = useState(0);
  const [pop, setPop] = useState(false);

  const updateCount = () => {
    const cart = getCart();
    const newCount = getCartCount(cart);
    if (newCount > count) {
      setPop(true);
      setTimeout(() => setPop(false), 350);
    }
    setCount(newCount);
  };

  useEffect(() => {
    // Initial count
    updateCount();

    // Listen for cart updates from AddToCart
    const handler = () => updateCount();
    globalThis.addEventListener("cart-updated", handler);

    // Also check on storage events (other tabs)
    globalThis.addEventListener("storage", handler);

    return () => {
      globalThis.removeEventListener("cart-updated", handler);
      globalThis.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <a
      href="/cart"
      class="hover:text-brand-gray transition-colors duration-300 relative"
      aria-label="Giỏ hàng"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {count > 0 && (
        <span
          class={`absolute -top-2 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-black text-white text-[10px] font-medium leading-none px-1 ${
            pop ? "animate-badge-pop" : ""
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </a>
  );
}
