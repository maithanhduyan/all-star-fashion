import { Handlers, PageProps } from "$fresh/server.ts";
import type { AppState } from "../_middleware.ts";
import { getProducts } from "../../lib/services/product.service.ts";
import { formatPrice } from "../../lib/utils.ts";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  images: string[];
  category: { name: string; slug: string } | null;
}

interface ProductsData {
  products: ProductItem[];
  total: number;
}

export const handler: Handlers<ProductsData, AppState> = {
  async GET(_req, ctx) {
    const result = await getProducts({ limit: 50 });
    return ctx.render({
      products: result.data,
      total: result.pagination.total,
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
              <a href="/admin/products" class="text-white underline">Sản phẩm</a>
            </nav>
          </div>
          <a href="/" class="text-sm text-gray-300 hover:text-white transition-colors">← Trang chủ</a>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="font-display text-3xl font-light tracking-wide">
            Sản Phẩm ({data.total})
          </h1>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-brand-light-gray text-left">
                <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Hình</th>
                <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Sản phẩm</th>
                <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Danh mục</th>
                <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Giá</th>
                <th class="py-3 px-2 text-xs tracking-wider uppercase text-brand-gray font-normal">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product.id} class="border-b border-brand-light-gray/50 hover:bg-white">
                  <td class="py-3 px-2">
                    <div class="w-12 h-16 bg-brand-beige overflow-hidden">
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          class="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </td>
                  <td class="py-3 px-2">
                    <a href={`/shop/${product.slug}`} class="font-medium hover:underline">
                      {product.name}
                    </a>
                    <div class="flex gap-1 mt-1">
                      {product.isNew && (
                        <span class="text-[10px] bg-brand-black text-white px-1.5 py-0.5">NEW</span>
                      )}
                      {product.isBestSeller && (
                        <span class="text-[10px] bg-yellow-500 text-white px-1.5 py-0.5">HOT</span>
                      )}
                    </div>
                  </td>
                  <td class="py-3 px-2 text-brand-gray">
                    {product.category?.name || "—"}
                  </td>
                  <td class="py-3 px-2">
                    <div>{formatPrice(product.price)}</div>
                    {product.originalPrice && (
                      <div class="text-xs text-brand-gray line-through">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                  </td>
                  <td class="py-3 px-2">
                    <span class={`text-xs px-2 py-1 rounded ${
                      product.inStock
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {product.inStock ? "Còn hàng" : "Hết hàng"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
