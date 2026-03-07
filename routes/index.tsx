import { Handlers, PageProps } from "$fresh/server.ts";
import Layout from "../components/Layout.tsx";
import Hero from "../components/Hero.tsx";
import ProductGrid from "../components/ProductGrid.tsx";
import CategoryCard from "../components/CategoryCard.tsx";
import { getBestSellers, getNewArrivals } from "../lib/services/product.service.ts";
import { getCategories } from "../lib/services/category.service.ts";
import { toProduct } from "../lib/utils.ts";
import type { Product, Category } from "../lib/types.ts";

interface HomeData {
  categories: Category[];
  bestSellers: Product[];
  newArrivals: Product[];
}

export const handler: Handlers<HomeData> = {
  async GET(_req, ctx) {
    const [categoriesRaw, bestSellersRaw, newArrivalsRaw] = await Promise.all([
      getCategories(),
      getBestSellers(4),
      getNewArrivals(4),
    ]);

    return ctx.render({
      categories: categoriesRaw,
      bestSellers: bestSellersRaw.map(toProduct),
      newArrivals: newArrivalsRaw.map(toProduct),
    });
  },
};

export default function HomePage({ data }: PageProps<HomeData>) {
  const { categories, bestSellers, newArrivals } = data;

  return (
    <Layout>
      {/* Hero */}
      <Hero
        title="New Collection"
        subtitle="Khám phá bộ sưu tập mới nhất — nơi phong cách gặp gỡ sự tinh tế"
        image="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop"
        cta={{ text: "Khám Phá Ngay", href: "/shop" }}
      />

      {/* Categories Grid */}
      <section class="max-w-7xl mx-auto px-6 py-20">
        <div class="text-center mb-12 reveal">
          <h2 class="font-display text-3xl md:text-4xl font-light tracking-wide mb-3">
            Danh Mục
          </h2>
          <p class="text-sm text-brand-gray tracking-wide">
            Khám phá các danh mục sản phẩm của chúng tôi
          </p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 reveal-stagger">
          {categories.map((cat) => (
            <div key={cat.id} class="reveal">
              <CategoryCard category={cat} />
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section class="bg-brand-beige">
        <div class="max-w-7xl mx-auto px-6 py-20">
          <div class="flex items-center justify-between mb-12 reveal">
            <div>
              <h2 class="font-display text-3xl md:text-4xl font-light tracking-wide mb-2">
                Hàng Mới Về
              </h2>
              <p class="text-sm text-brand-gray tracking-wide">
                Những thiết kế mới nhất cho bạn
              </p>
            </div>
            <a
              href="/shop"
              class="hidden md:inline-block border border-brand-black px-6 py-3 text-xs tracking-extra-wide uppercase hover:bg-brand-black hover:text-white transition-all duration-300"
            >
              Xem Tất Cả
            </a>
          </div>
          <ProductGrid products={newArrivals} columns={4} />
        </div>
      </section>

      {/* Editorial Banner */}
      <section class="relative h-[60vh] min-h-[400px] overflow-hidden reveal-fade">
        <img
          src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=800&fit=crop"
          alt="Editorial"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/40" />
        <div class="relative h-full flex flex-col items-center justify-center text-center text-white px-6">
          <p class="text-xs tracking-extra-wide uppercase mb-4 opacity-80">
            Lookbook 2026
          </p>
          <h2 class="font-display text-3xl md:text-5xl font-light tracking-wide mb-6 max-w-2xl leading-tight">
            Phong Cách Tối Giản, Vẻ Đẹp Vượt Thời Gian
          </h2>
          <a
            href="/shop"
            class="inline-block border border-white px-8 py-3 text-xs tracking-extra-wide uppercase hover:bg-white hover:text-brand-black transition-all duration-300"
          >
            Xem Lookbook
          </a>
        </div>
      </section>

      {/* Best Sellers */}
      <section class="max-w-7xl mx-auto px-6 py-20">
        <div class="flex items-center justify-between mb-12 reveal">
          <div>
            <h2 class="font-display text-3xl md:text-4xl font-light tracking-wide mb-2">
              Bán Chạy Nhất
            </h2>
            <p class="text-sm text-brand-gray tracking-wide">
              Được yêu thích bởi khách hàng của chúng tôi
            </p>
          </div>
          <a
            href="/shop"
            class="hidden md:inline-block border border-brand-black px-6 py-3 text-xs tracking-extra-wide uppercase hover:bg-brand-black hover:text-white transition-all duration-300"
          >
            Xem Tất Cả
          </a>
        </div>
        <ProductGrid products={bestSellers} columns={4} />
      </section>

      {/* Features */}
      <section class="border-t border-brand-light-gray reveal">
        <div class="max-w-7xl mx-auto px-6 py-16">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div class="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h4 class="text-sm tracking-wider uppercase mb-2">Miễn Phí Vận Chuyển</h4>
              <p class="text-xs text-brand-gray">Cho đơn hàng từ 1.000.000₫</p>
            </div>
            <div>
              <div class="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 class="text-sm tracking-wider uppercase mb-2">Đổi Trả 30 Ngày</h4>
              <p class="text-xs text-brand-gray">Đổi trả dễ dàng, không rắc rối</p>
            </div>
            <div>
              <div class="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 class="text-sm tracking-wider uppercase mb-2">Chất Lượng Cao Cấp</h4>
              <p class="text-xs text-brand-gray">Chất liệu được tuyển chọn kỹ càng</p>
            </div>
            <div>
              <div class="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 class="text-sm tracking-wider uppercase mb-2">Hỗ Trợ 24/7</h4>
              <p class="text-xs text-brand-gray">Luôn sẵn sàng phục vụ bạn</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
