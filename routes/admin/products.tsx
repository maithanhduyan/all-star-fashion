import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import { getProducts } from "../../lib/services/product.service.ts";
import { getCategories } from "../../lib/services/category.service.ts";
import AdminProductManager from "../../islands/AdminProductManager.tsx";

interface ProductsData {
  products: unknown[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  categories: { id: string; name: string; slug: string }[];
}

export const handler: Handlers<ProductsData, AppState> = {
  async GET(_req, ctx) {
    const [result, categories] = await Promise.all([
      getProducts({ limit: 10 }),
      getCategories(),
    ]);
    return ctx.render({
      products: result.data,
      pagination: result.pagination,
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    });
  },
};

export default function AdminProductsPage({ data }: PageProps<ProductsData>) {
  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-brand-black text-white">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-6">
            <a href="/admin" class="font-display text-lg tracking-wide">Admin Panel</a>
            <nav class="hidden md:flex items-center gap-4 text-sm">
              <a href="/admin" class="hover:text-gray-300 transition-colors">Dashboard</a>
              <a href="/admin/orders" class="hover:text-gray-300 transition-colors">Đơn hàng</a>
              <a href="/admin/invoices" class="hover:text-gray-300 transition-colors">Hóa đơn</a>
              <a href="/admin/products" class="text-white underline">Sản phẩm</a>
              <a href="/admin/reports" class="hover:text-gray-300 transition-colors">Báo cáo</a>
            </nav>
          </div>
          <a href="/" class="text-sm text-gray-300 hover:text-white transition-colors">← Trang chủ</a>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-6">
          <h1 class="font-display text-3xl font-light tracking-wide">
            Quản lý sản phẩm
          </h1>
          <span class="text-sm text-gray-500">
            Tổng: {data.pagination.total} sản phẩm
          </span>
        </div>

        <AdminProductManager
          initialProducts={data.products as any}
          initialPagination={data.pagination}
          initialCategories={data.categories}
        />
      </main>
    </div>
  );
}
