import { type PageProps } from "$fresh/server.ts";
import { Handlers } from "$fresh/server.ts";
import Layout from "../../components/Layout.tsx";
import ProductGrid from "../../components/ProductGrid.tsx";
import ProductGallery from "../../islands/ProductGallery.tsx";
import AddToCart from "../../islands/AddToCart.tsx";
import { formatPrice, toProduct } from "../../lib/utils.ts";
import { getProductBySlug, getRelatedProducts } from "../../lib/services/product.service.ts";
import type { Product } from "../../lib/types.ts";

interface Data {
  product: Product;
  relatedProducts: Product[];
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const raw = await getProductBySlug(ctx.params.slug);
    if (!raw) {
      return ctx.renderNotFound();
    }

    const product = toProduct(raw);

    const relatedRaw = raw.category
      ? await getRelatedProducts(raw.category.id, raw.id, 4)
      : [];

    return ctx.render({
      product,
      relatedProducts: relatedRaw.map(toProduct),
    });
  },
};

export default function ProductDetailPage({ data }: PageProps<Data>) {
  const { product, relatedProducts } = data;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div class="max-w-7xl mx-auto px-6 py-4">
        <nav class="flex items-center gap-2 text-xs text-brand-gray">
          <a href="/" class="hover:text-brand-black transition-colors">
            Trang Chủ
          </a>
          <span>/</span>
          <a href="/shop" class="hover:text-brand-black transition-colors">
            Cửa Hàng
          </a>
          <span>/</span>
          <span class="text-brand-black">{product.name}</span>
        </nav>
      </div>

      {/* Product Detail */}
      <div class="max-w-7xl mx-auto px-6 py-6 grid md:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery */}
        <ProductGallery
          images={product.images}
          productName={product.name}
        />

        {/* Product Info */}
        <div class="space-y-6">
          {/* Badges */}
          <div class="flex gap-2">
            {product.isNew && (
              <span class="bg-brand-black text-white text-[10px] tracking-extra-wide uppercase px-3 py-1">
                Mới
              </span>
            )}
            {product.originalPrice && (
              <span class="bg-red-600 text-white text-[10px] tracking-extra-wide uppercase px-3 py-1">
                Sale
              </span>
            )}
          </div>

          <h1 class="font-display text-2xl md:text-3xl font-light tracking-wide">
            {product.name}
          </h1>

          {/* Price */}
          <div class="flex items-center gap-3">
            <p class="text-xl">{formatPrice(product.price)}</p>
            {product.originalPrice && (
              <p class="text-lg text-brand-gray line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>

          {/* Add to Cart Island */}
          <AddToCart
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            price={product.price}
            originalPrice={product.originalPrice}
            image={product.images[0]}
            sizes={product.sizes}
            colors={product.colors}
          />

          {/* Description */}
          <div class="border-t border-brand-light-gray pt-6">
            <h3 class="text-sm tracking-wider uppercase mb-3">Mô Tả</h3>
            <p class="text-sm text-brand-gray leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Details */}
          <div class="border-t border-brand-light-gray pt-6">
            <h3 class="text-sm tracking-wider uppercase mb-3">Chi Tiết</h3>
            <ul class="text-sm text-brand-gray space-y-2">
              <li>• Chất liệu cao cấp</li>
              <li>• Thiết kế tối giản, dễ phối đồ</li>
              <li>• Sản xuất có trách nhiệm</li>
              <li>• Đổi trả trong 30 ngày</li>
            </ul>
          </div>

          {/* Shipping info */}
          <div class="border-t border-brand-light-gray pt-6">
            <h3 class="text-sm tracking-wider uppercase mb-3">
              Vận Chuyển & Đổi Trả
            </h3>
            <ul class="text-sm text-brand-gray space-y-2">
              <li>• Miễn phí vận chuyển cho đơn từ 1.000.000₫</li>
              <li>• Giao hàng trong 2-5 ngày làm việc</li>
              <li>• Đổi trả miễn phí trong 30 ngày</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section class="max-w-7xl mx-auto px-6 py-16 border-t border-brand-light-gray mt-8">
          <h2 class="font-display text-2xl md:text-3xl font-light tracking-wide mb-8">
            Sản Phẩm Liên Quan
          </h2>
          <ProductGrid products={relatedProducts} columns={4} />
        </section>
      )}
    </Layout>
  );
}
