import type { Category } from "../lib/types.ts";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <a href={`/shop?category=${category.slug}`} class="group block relative aspect-[3/4] overflow-hidden">
      <img
        src={category.image}
        alt={category.name}
        loading="lazy"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
      <div class="absolute inset-0 flex flex-col items-center justify-end pb-8">
        <h3 class="text-white text-lg tracking-wider uppercase font-light">
          {category.name}
        </h3>
      </div>
    </a>
  );
}
