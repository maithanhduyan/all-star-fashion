import type { Product } from "../lib/types.ts";
import { formatPrice } from "../lib/utils.ts";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <a href={`/shop/${product.slug}`} class="group block">
      {/* Image container */}
      <div class="relative aspect-[3/4] overflow-hidden bg-brand-beige mb-4">
        {/* Primary image */}
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        {/* Hover image */}
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={product.name}
            loading="lazy"
            class="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {/* Badges */}
        <div class="absolute top-3 left-3 flex flex-col gap-2">
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

        {/* Quick add overlay */}
        <div class="absolute bottom-0 left-0 right-0 bg-brand-black/80 text-white text-center py-3 text-xs tracking-wider uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          Xem Chi Tiết
        </div>
      </div>

      {/* Product info */}
      <div class="space-y-1">
        <h3 class="text-sm font-light tracking-wide">{product.name}</h3>
        <div class="flex items-center gap-2">
          <p class="text-sm">{formatPrice(product.price)}</p>
          {product.originalPrice && (
            <p class="text-sm text-brand-gray line-through">
              {formatPrice(product.originalPrice)}
            </p>
          )}
        </div>
        {/* Color dots */}
        <div class="flex gap-1.5 pt-1">
          {product.colors.map((color) => (
            <span
              key={color.name}
              class="w-3 h-3 rounded-full border border-brand-light-gray"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </a>
  );
}
