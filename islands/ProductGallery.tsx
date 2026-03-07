import { useState } from "preact/hooks";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery(
  { images, productName }: ProductGalleryProps,
) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div class="grid grid-cols-[72px_1fr] gap-4">
      {/* Thumbnails */}
      <div class="flex flex-col gap-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            class={`aspect-[3/4] overflow-hidden border-2 transition-colors duration-200 ${
              idx === activeIndex ? "border-brand-black" : "border-transparent"
            }`}
          >
            <img
              src={img}
              alt={`${productName} - ảnh ${idx + 1}`}
              class="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div class="aspect-[3/4] overflow-hidden bg-brand-beige">
        <img
          src={images[activeIndex]}
          alt={productName}
          class="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>
    </div>
  );
}
