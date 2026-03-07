import { categories } from "../lib/data.ts";
import MobileMenu from "../islands/MobileMenu.tsx";
import CartBadge from "../islands/CartBadge.tsx";
import SearchModal from "../islands/SearchModal.tsx";
import UserMenu from "../islands/UserMenu.tsx";

export default function Navbar() {
  return (
    <header class="sticky top-0 z-50 bg-brand-white/95 backdrop-blur-sm border-b border-brand-light-gray">
      {/* Top bar */}
      <div class="bg-brand-black text-white text-center py-2 text-xs tracking-extra-wide uppercase">
        Miễn phí vận chuyển cho đơn hàng từ 1.000.000₫
      </div>

      {/* Main nav */}
      <nav class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" class="flex-shrink-0 flex items-center gap-3">
          <img src="/logo.svg" alt="All Star Fashion" class="h-10 w-auto" />
        </a>

        {/* Desktop Navigation */}
        <div class="hidden md:flex items-center gap-8">
          <a
            href="/shop"
            class="text-sm tracking-wide uppercase hover:text-brand-gray transition-colors duration-300"
          >
            Cửa Hàng
          </a>
          {categories.slice(0, 4).map((cat) => (
            <a
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              class="text-sm tracking-wide uppercase hover:text-brand-gray transition-colors duration-300"
            >
              {cat.name}
            </a>
          ))}
          <a
            href="/about"
            class="text-sm tracking-wide uppercase hover:text-brand-gray transition-colors duration-300"
          >
            Giới Thiệu
          </a>
        </div>

        {/* Right icons */}
        <div class="flex items-center gap-5">
          {/* Search Modal Island (includes trigger button) */}
          <SearchModal />

          {/* User menu */}
          <UserMenu />

          {/* Cart with badge */}
          <CartBadge />

          {/* Mobile menu island */}
          <MobileMenu categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
        </div>
      </nav>
    </header>
  );
}
