import { type PageProps } from "$fresh/server.ts";
import Layout from "../../components/Layout.tsx";
import ProductGrid from "../../components/ProductGrid.tsx";
import SearchBar from "../../islands/SearchBar.tsx";
import {
  categories,
  getCategoryBySlug,
  getProductsByCategory,
  products,
} from "../../lib/data.ts";

export default function ShopPage(props: PageProps) {
  const url = new URL(props.url);
  const categorySlug = url.searchParams.get("category") || "";
  const searchQuery = url.searchParams.get("q") || "";

  const activeCategory = categorySlug
    ? getCategoryBySlug(categorySlug)
    : undefined;

  let filteredProducts = categorySlug
    ? getProductsByCategory(categorySlug)
    : [...products];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  const pageTitle = activeCategory
    ? activeCategory.name
    : searchQuery
    ? `Kết quả tìm kiếm: "${searchQuery}"`
    : "Tất Cả Sản Phẩm";

  return (
    <Layout>
      {/* Page Header */}
      <div class="bg-brand-beige">
        <div class="max-w-7xl mx-auto px-6 py-12">
          <h1 class="font-display text-3xl md:text-4xl font-light tracking-wide mb-2">
            {pageTitle}
          </h1>
          <p class="text-sm text-brand-gray">
            {filteredProducts.length} sản phẩm
          </p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          {/* Sidebar */}
          <aside class="space-y-8">
            {/* Search */}
            <div>
              <h3 class="text-sm tracking-wider uppercase mb-4">Tìm Kiếm</h3>
              <SearchBar initialQuery={searchQuery} />
            </div>

            {/* Categories filter */}
            <div>
              <h3 class="text-sm tracking-wider uppercase mb-4">Danh Mục</h3>
              <ul class="space-y-2">
                <li>
                  <a
                    href="/shop"
                    class={`text-sm block py-1 transition-colors ${
                      !categorySlug
                        ? "text-brand-black font-medium"
                        : "text-brand-gray hover:text-brand-black"
                    }`}
                  >
                    Tất cả
                  </a>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <a
                      href={`/shop?category=${cat.slug}`}
                      class={`text-sm block py-1 transition-colors ${
                        categorySlug === cat.slug
                          ? "text-brand-black font-medium"
                          : "text-brand-gray hover:text-brand-black"
                      }`}
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product Grid */}
          <div>
            {filteredProducts.length > 0
              ? (
                <ProductGrid products={filteredProducts} columns={3} />
              )
              : (
                <div class="text-center py-20">
                  <p class="text-brand-gray text-lg mb-4">
                    Không tìm thấy sản phẩm nào.
                  </p>
                  <a
                    href="/shop"
                    class="inline-block border border-brand-black px-6 py-3 text-xs tracking-extra-wide uppercase hover:bg-brand-black hover:text-white transition-all duration-300"
                  >
                    Xem Tất Cả Sản Phẩm
                  </a>
                </div>
              )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
