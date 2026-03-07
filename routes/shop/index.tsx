import { Handlers, type PageProps } from "$fresh/server.ts";
import Layout from "../../components/Layout.tsx";
import ProductGrid from "../../components/ProductGrid.tsx";
import SearchBar from "../../islands/SearchBar.tsx";
import { getProducts } from "../../lib/services/product.service.ts";
import { getCategories } from "../../lib/services/category.service.ts";
import { toProduct } from "../../lib/utils.ts";
import type { Product, Category } from "../../lib/types.ts";

interface ShopData {
  products: Product[];
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
  categorySlug: string;
  searchQuery: string;
  activeCategory?: Category;
}

export const handler: Handlers<ShopData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const categorySlug = url.searchParams.get("category") || "";
    const searchQuery = url.searchParams.get("q") || "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const sort = url.searchParams.get("sort") || undefined;

    const [result, categoriesRaw] = await Promise.all([
      getProducts({
        category: categorySlug || undefined,
        q: searchQuery || undefined,
        page,
        limit: 12,
        sort,
      }),
      getCategories(),
    ]);

    const activeCategory = categorySlug
      ? categoriesRaw.find((c) => c.slug === categorySlug)
      : undefined;

    return ctx.render({
      products: result.data.map(toProduct),
      categories: categoriesRaw,
      total: result.pagination.total,
      page: result.pagination.page,
      totalPages: result.pagination.totalPages,
      categorySlug,
      searchQuery,
      activeCategory,
    });
  },
};

function buildPageUrl(
  page: number,
  category: string,
  q: string,
): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/shop${qs ? "?" + qs : ""}`;
}

export default function ShopPage({ data }: PageProps<ShopData>) {
  const {
    products: filteredProducts,
    categories,
    total,
    page,
    totalPages,
    categorySlug,
    searchQuery,
    activeCategory,
  } = data;

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
            {total} sản phẩm
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
                <>
                  <ProductGrid products={filteredProducts} columns={3} />
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div class="flex justify-center gap-2 mt-12">
                      {page > 1 && (
                        <a
                          href={buildPageUrl(page - 1, categorySlug, searchQuery)}
                          class="border border-brand-light-gray px-4 py-2 text-sm hover:border-brand-black transition-colors"
                        >
                          ← Trước
                        </a>
                      )}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <a
                            key={p}
                            href={buildPageUrl(p, categorySlug, searchQuery)}
                            class={`border px-4 py-2 text-sm transition-colors ${
                              p === page
                                ? "bg-brand-black text-white border-brand-black"
                                : "border-brand-light-gray hover:border-brand-black"
                            }`}
                          >
                            {p}
                          </a>
                        ),
                      )}
                      {page < totalPages && (
                        <a
                          href={buildPageUrl(page + 1, categorySlug, searchQuery)}
                          class="border border-brand-light-gray px-4 py-2 text-sm hover:border-brand-black transition-colors"
                        >
                          Tiếp →
                        </a>
                      )}
                    </div>
                  )}
                </>
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
