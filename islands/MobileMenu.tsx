import { useEffect, useRef, useState } from "preact/hooks";
import { createPortal } from "preact/compat";

interface MobileMenuProps {
  categories: { name: string; slug: string }[];
}

export default function MobileMenu({ categories }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Create portal target on mount (client-side only)
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const menuContent = (
    <>
      {/* Overlay - full screen backdrop */}
      <div
        class={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 9998 }}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide menu panel */}
      <div
        class={`fixed top-0 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ zIndex: 9999, width: "min(320px, 85vw)" }}
      >
        <div class="h-full overflow-y-auto p-6">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            class="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-300"
            aria-label="Đóng menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <nav class="mt-14 space-y-1">
            <a
              href="/shop"
              class="block py-3 text-base tracking-wide uppercase font-medium border-b border-gray-200"
            >
              Cửa Hàng
            </a>
            {categories.map((cat) => (
              <a
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                class="block py-3 text-sm tracking-wide text-gray-500 hover:text-black hover:pl-2 transition-all duration-200 border-b border-gray-100"
              >
                {cat.name}
              </a>
            ))}
            <a
              href="/about"
              class="block py-3 text-base tracking-wide uppercase font-medium border-b border-gray-200 mt-4"
            >
              Giới Thiệu
            </a>
            <a
              href="/cart"
              class="block py-3 text-base tracking-wide uppercase font-medium border-b border-gray-200"
            >
              Giỏ Hàng
            </a>
          </nav>

          {/* Contact info at bottom */}
          <div class="mt-10 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-400 mb-2">Liên hệ:</p>
            <p class="text-xs text-gray-400">0123-456-789</p>
            <p class="text-xs text-gray-400">support@allstarfashion.com</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div class="md:hidden">
      {/* Animated hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        class="relative w-7 h-5 flex flex-col justify-between items-center group"
        aria-label={isOpen ? "Đóng menu" : "Mở menu"}
      >
        <span
          class={`block w-6 h-[1.5px] bg-current transition-all duration-300 ease-in-out ${
            isOpen
              ? "rotate-45 translate-y-[9px]"
              : ""
          }`}
        />
        <span
          class={`block w-6 h-[1.5px] bg-current transition-all duration-200 ease-in-out ${
            isOpen ? "opacity-0 scale-x-0" : "opacity-100"
          }`}
        />
        <span
          class={`block w-6 h-[1.5px] bg-current transition-all duration-300 ease-in-out ${
            isOpen
              ? "-rotate-45 -translate-y-[9px]"
              : ""
          }`}
        />
      </button>

      {/* Portal the overlay + panel to document.body to escape header stacking context */}
      {portalTarget && createPortal(menuContent, portalTarget)}
    </div>
  );
}
