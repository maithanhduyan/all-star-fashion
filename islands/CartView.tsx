import { useEffect, useState } from "preact/hooks";
import { createPortal } from "preact/compat";
import {
  type CartItemData,
  clearCart,
  formatPrice,
  getCart,
  getCartCount,
  getCartTotal,
  removeFromCart,
  updateQuantity,
} from "../lib/cart.ts";

const MAX_QTY = 5;

function dispatchCartUpdate() {
  globalThis.dispatchEvent(new CustomEvent("cart-updated"));
}

export default function CartView() {
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Modal state for confirming removal
  const [confirmRemove, setConfirmRemove] = useState<{
    productId: string;
    size: string;
    color: string;
    productName: string;
  } | null>(null);

  // Modal for clearing all
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  useEffect(() => {
    setCart(getCart());
    setLoaded(true);
    setPortalTarget(document.body);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (confirmRemove || confirmClearAll) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [confirmRemove, confirmClearAll]);

  const handleUpdateQuantity = (
    productId: string,
    size: string,
    color: string,
    productName: string,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      // Show confirm modal instead of directly removing
      setConfirmRemove({ productId, size, color, productName });
      return;
    }
    if (quantity > MAX_QTY) return; // Cap at max
    const updated = updateQuantity(productId, size, color, quantity);
    setCart([...updated]);
    dispatchCartUpdate();
  };

  const handleConfirmRemove = () => {
    if (!confirmRemove) return;
    const updated = removeFromCart(
      confirmRemove.productId,
      confirmRemove.size,
      confirmRemove.color,
    );
    setCart([...updated]);
    setConfirmRemove(null);
    dispatchCartUpdate();
  };

  const handleRemove = (
    productId: string,
    size: string,
    color: string,
    productName: string,
  ) => {
    setConfirmRemove({ productId, size, color, productName });
  };

  const handleClearCart = () => {
    setConfirmClearAll(true);
  };

  const handleConfirmClearAll = () => {
    clearCart();
    setCart([]);
    setConfirmClearAll(false);
    dispatchCartUpdate();
  };

  // Not yet loaded from localStorage
  if (!loaded) {
    return (
      <div class="text-center py-20">
        <div class="w-8 h-8 border-2 border-brand-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div class="text-center py-20">
        <div class="w-20 h-20 mx-auto mb-6 text-brand-light-gray">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h2 class="text-xl font-light tracking-wide mb-3">
          Giỏ hàng của bạn đang trống
        </h2>
        <p class="text-sm text-brand-gray mb-8">
          Hãy khám phá các sản phẩm của chúng tôi và thêm vào giỏ hàng.
        </p>
        <a
          href="/shop"
          class="inline-block bg-brand-black text-white px-8 py-4 text-sm tracking-extra-wide uppercase hover:opacity-80 transition-opacity"
        >
          Tiếp Tục Mua Sắm
        </a>
      </div>
    );
  }

  const total = getCartTotal(cart);
  const count = getCartCount(cart);
  const shippingFree = total >= 1000000;

  return (
    <div class="grid lg:grid-cols-3 gap-10">
      {/* Portaled modals – rendered at <body> to avoid parent layout offset */}
      {portalTarget && createPortal(
        <>
          {/* Confirmation Modal – Remove Item */}
          {confirmRemove && (
            <div
              class="fixed inset-0 z-[100] flex items-center justify-center px-4"
              onClick={(e: Event) => {
                if (e.target === e.currentTarget) setConfirmRemove(null);
              }}
            >
              <div class="absolute inset-0 bg-black/50 animate-fade-in" />
              <div class="relative bg-white w-full max-w-sm rounded-sm shadow-2xl animate-modal-in">
                <div class="p-8 text-center">
                  <div class="w-14 h-14 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-display tracking-wide mb-2">
                    Xóa Sản Phẩm?
                  </h3>
                  <p class="text-sm text-brand-gray leading-relaxed mb-6">
                    Bạn có chắc muốn xóa{" "}
                    <span class="text-brand-black font-medium">{confirmRemove.productName}</span>{" "}
                    khỏi giỏ hàng?
                  </p>
                  <div class="flex gap-3">
                    <button
                      onClick={() => setConfirmRemove(null)}
                      class="flex-1 py-3 border border-brand-light-gray text-sm tracking-wide uppercase hover:bg-brand-beige transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleConfirmRemove}
                      class="flex-1 py-3 bg-red-600 text-white text-sm tracking-wide uppercase hover:bg-red-700 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal – Clear All */}
          {confirmClearAll && (
            <div
              class="fixed inset-0 z-[100] flex items-center justify-center px-4"
              onClick={(e: Event) => {
                if (e.target === e.currentTarget) setConfirmClearAll(false);
              }}
            >
              <div class="absolute inset-0 bg-black/50 animate-fade-in" />
              <div class="relative bg-white w-full max-w-sm rounded-sm shadow-2xl animate-modal-in">
                <div class="p-8 text-center">
                  <div class="w-14 h-14 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 class="text-lg font-display tracking-wide mb-2">
                    Xóa Tất Cả?
                  </h3>
                  <p class="text-sm text-brand-gray leading-relaxed mb-6">
                    Bạn có chắc muốn xóa toàn bộ {count} sản phẩm khỏi giỏ hàng?
                  </p>
                  <div class="flex gap-3">
                    <button
                      onClick={() => setConfirmClearAll(false)}
                      class="flex-1 py-3 border border-brand-light-gray text-sm tracking-wide uppercase hover:bg-brand-beige transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleConfirmClearAll}
                      class="flex-1 py-3 bg-red-600 text-white text-sm tracking-wide uppercase hover:bg-red-700 transition-colors"
                    >
                      Xóa Tất Cả
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        portalTarget,
      )}

      {/* Cart items */}
      <div class="lg:col-span-2 space-y-0">
        {/* Header */}
        <div class="flex items-center justify-between pb-4 border-b border-brand-light-gray mb-2">
          <p class="text-sm text-brand-gray tracking-wide">
            {count} sản phẩm trong giỏ hàng
          </p>
          <button
            onClick={handleClearCart}
            class="text-xs text-red-500 hover:text-red-700 tracking-wide uppercase transition-colors"
          >
            Xóa tất cả
          </button>
        </div>

        {/* Items */}
        {cart.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}`}
            class="flex gap-4 py-6 border-b border-brand-light-gray"
          >
            {/* Image */}
            <a href={`/shop/${item.productSlug}`} class="flex-shrink-0">
              <img
                src={item.image}
                alt={item.productName}
                class="w-24 h-32 sm:w-28 sm:h-36 object-cover"
                loading="lazy"
              />
            </a>

            {/* Details */}
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <a
                    href={`/shop/${item.productSlug}`}
                    class="text-sm sm:text-base font-medium tracking-wide hover:underline"
                  >
                    {item.productName}
                  </a>
                  <div class="mt-1 space-y-0.5">
                    <p class="text-xs text-brand-gray">
                      Màu:{" "}
                      <span class="inline-flex items-center gap-1">
                        <span
                          class="inline-block w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        {item.color}
                      </span>
                    </p>
                    <p class="text-xs text-brand-gray">Size: {item.size}</p>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() =>
                    handleRemove(item.productId, item.size, item.color, item.productName)}
                  class="text-brand-gray hover:text-red-500 transition-colors p-1"
                  aria-label="Xóa sản phẩm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Price + Quantity */}
              <div class="flex items-end justify-between mt-4">
                <div class="flex items-center border border-brand-light-gray">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(
                        item.productId,
                        item.size,
                        item.color,
                        item.productName,
                        item.quantity - 1,
                      )}
                    class="w-8 h-8 flex items-center justify-center text-sm hover:bg-brand-beige transition-colors"
                    aria-label="Giảm số lượng"
                  >
                    −
                  </button>
                  <span class="w-10 h-8 flex items-center justify-center text-sm border-x border-brand-light-gray">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      handleUpdateQuantity(
                        item.productId,
                        item.size,
                        item.color,
                        item.productName,
                        item.quantity + 1,
                      )}
                    disabled={item.quantity >= MAX_QTY}
                    class={`w-8 h-8 flex items-center justify-center text-sm transition-colors ${
                      item.quantity >= MAX_QTY
                        ? "text-brand-light-gray cursor-not-allowed"
                        : "hover:bg-brand-beige"
                    }`}
                    aria-label="Tăng số lượng"
                  >
                    +
                  </button>
                </div>

                <div class="text-right">
                  <p class="text-sm font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  {item.quantity > 1 && (
                    <p class="text-xs text-brand-gray">
                      {formatPrice(item.price)} / sản phẩm
                    </p>
                  )}
                  {item.quantity >= MAX_QTY && (
                    <p class="text-xs text-amber-600 mt-0.5">
                      Tối đa {MAX_QTY} sản phẩm
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div class="lg:col-span-1">
        <div class="bg-brand-beige/40 p-6 sticky top-28">
          <h3 class="text-base font-medium tracking-wide uppercase mb-6">
            Tổng Đơn Hàng
          </h3>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-brand-gray">Tạm tính</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-brand-gray">Phí vận chuyển</span>
              <span class={shippingFree ? "text-green-600" : ""}>
                {shippingFree ? "Miễn phí" : formatPrice(30000)}
              </span>
            </div>
            {!shippingFree && (
              <p class="text-xs text-brand-gray">
                Miễn phí vận chuyển cho đơn từ {formatPrice(1000000)}
              </p>
            )}
          </div>

          <div class="border-t border-brand-light-gray mt-4 pt-4">
            <div class="flex justify-between items-center text-base font-medium">
              <span>Tổng cộng</span>
              <span>{formatPrice(total + (shippingFree ? 0 : 30000))}</span>
            </div>
          </div>

          <a
            href="/checkout"
            class="block w-full mt-6 py-4 text-center bg-brand-black text-white text-sm tracking-extra-wide uppercase hover:opacity-80 transition-opacity"
          >
            Thanh Toán
          </a>

          <a
            href="/shop"
            class="block w-full mt-3 py-3 text-center text-sm tracking-wide text-brand-gray hover:text-brand-black transition-colors"
          >
            ← Tiếp tục mua sắm
          </a>
        </div>
      </div>
    </div>
  );
}
