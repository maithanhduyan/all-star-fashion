import { useEffect, useState } from "preact/hooks";
import { createPortal } from "preact/compat";
import { addToCart, getCart } from "../lib/cart.ts";

const MAX_QTY = 5;

interface AddToCartProps {
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  originalPrice?: number;
  image: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
}

export default function AddToCart(
  { productId, productName, productSlug, price, originalPrice, image, sizes, colors }: AddToCartProps,
) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(
    colors[0]?.name || "",
  );
  const [added, setAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastLeaving, setToastLeaving] = useState(false);
  const [maxQtyReached, setMaxQtyReached] = useState(false);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setShowModal(true);
      return;
    }

    const colorObj = colors.find((c) => c.name === selectedColor);

    // Check if adding would exceed max quantity
    const cart = getCart();
    const existing = cart.find(
      (c) => c.productId === productId && c.size === selectedSize && c.color === selectedColor,
    );
    if (existing && existing.quantity >= MAX_QTY) {
      setMaxQtyReached(true);
      setTimeout(() => setMaxQtyReached(false), 3000);
      return;
    }

    addToCart({
      productId,
      productName,
      productSlug,
      price,
      originalPrice,
      image,
      size: selectedSize,
      color: selectedColor,
      colorHex: colorObj?.hex || "#111111",
    });

    console.log("Added to cart:", {
      productName,
      size: selectedSize,
      color: selectedColor,
    });

    // Dispatch custom event so CartBadge updates
    globalThis.dispatchEvent(new CustomEvent("cart-updated"));

    setAdded(true);
    setShowToast(true);
    setToastLeaving(false);

    // Hide toast after 3s with exit animation
    setTimeout(() => {
      setToastLeaving(true);
      setTimeout(() => {
        setShowToast(false);
        setToastLeaving(false);
      }, 250);
    }, 3000);

    setTimeout(() => setAdded(false), 2000);
  };

  // Size selection modal content (portaled to body)
  const sizeModal = showModal && (
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowModal(false);
      }}
    >
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* Modal */}
      <div class="relative bg-white w-full max-w-sm rounded-sm shadow-2xl animate-modal-in">
        {/* Close button */}
        <button
          onClick={() => setShowModal(false)}
          class="absolute top-4 right-4 text-brand-gray hover:text-brand-black transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="p-8 text-center">
          {/* Icon */}
          <div class="w-16 h-16 mx-auto mb-5 rounded-full bg-brand-beige flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-brand-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h3 class="text-lg font-display tracking-wide mb-2">
            Vui Lòng Chọn Size
          </h3>
          <p class="text-sm text-brand-gray leading-relaxed mb-6">
            Bạn cần chọn kích cỡ trước khi thêm sản phẩm vào giỏ hàng.
          </p>

          {/* Quick size selection inside modal */}
          <div class="flex flex-wrap justify-center gap-2 mb-6">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  setShowModal(false);
                }}
                class="min-w-[48px] px-4 py-2.5 border text-sm tracking-wide transition-all duration-200 border-brand-light-gray hover:bg-brand-black hover:text-white hover:border-brand-black"
              >
                {size}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowModal(false)}
            class="text-xs tracking-wider uppercase text-brand-gray hover:text-brand-black transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div class="space-y-6">
      {/* Portaled size-selection modal */}
      {portalTarget && sizeModal && createPortal(sizeModal, portalTarget)}

      {/* Color selector */}
      <div>
        <p class="text-sm mb-3 tracking-wide">
          Màu sắc:{" "}
          <span class="text-brand-gray">{selectedColor}</span>
        </p>
        <div class="flex gap-3">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color.name)}
              class={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                selectedColor === color.name
                  ? "border-brand-black scale-110"
                  : "border-brand-light-gray"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Size selector */}
      <div>
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm tracking-wide">Kích cỡ</p>
          <button class="text-xs text-brand-gray underline hover:text-brand-black transition-colors">
            Hướng dẫn chọn size
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              class={`min-w-[48px] px-4 py-2.5 border text-sm tracking-wide transition-all duration-200 ${
                selectedSize === size
                  ? "bg-brand-black text-white border-brand-black"
                  : "border-brand-light-gray hover:border-brand-black"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Add to cart button */}
      <button
        onClick={handleAddToCart}
        class={`w-full py-4 text-sm tracking-extra-wide uppercase transition-all duration-300 ${
          added
            ? "bg-green-700 text-white scale-[1.02]"
            : "bg-brand-black text-white hover:opacity-80"
        }`}
      >
        {added
          ? (
            <span class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Đã Thêm Vào Giỏ
            </span>
          )
          : "Thêm Vào Giỏ Hàng"}
      </button>

      {/* Portaled overlays – rendered at <body> to avoid parent layout offset */}
      {portalTarget && createPortal(
        <>
          {/* Toast notification */}
          {showToast && (
            <div
              class={`fixed bottom-6 inset-x-0 z-[200] px-4 pointer-events-none ${
                toastLeaving ? "animate-toast-out" : "animate-toast-in"
              }`}
            >
              <div class="max-w-md mx-auto bg-white border border-brand-light-gray shadow-2xl rounded-sm p-4 flex items-center gap-4 pointer-events-auto">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-700 animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs tracking-wider uppercase text-green-700 font-medium mb-0.5">
                    Đã thêm vào giỏ hàng
                  </p>
                  <p class="text-sm text-brand-black truncate">
                    {productName} — {selectedSize}, {selectedColor}
                  </p>
                </div>
                <a
                  href="/cart"
                  class="flex-shrink-0 text-xs tracking-wider uppercase font-medium text-brand-black underline underline-offset-2 hover:text-brand-gray transition-colors"
                >
                  Xem giỏ
                </a>
              </div>
            </div>
          )}

          {/* Max quantity warning toast */}
          {maxQtyReached && (
            <div class="fixed bottom-6 inset-x-0 z-[200] px-4 pointer-events-none animate-toast-in">
              <div class="max-w-md mx-auto bg-white border border-amber-200 shadow-2xl rounded-sm p-4 flex items-center gap-4 pointer-events-auto">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs tracking-wider uppercase text-amber-700 font-medium mb-0.5">
                    Đã đạt giới hạn
                  </p>
                  <p class="text-sm text-brand-black">
                    Tối đa {MAX_QTY} sản phẩm cho mỗi mặt hàng
                  </p>
                </div>
              </div>
            </div>
          )}
        </>,
        portalTarget,
      )}
    </div>
  );
}
