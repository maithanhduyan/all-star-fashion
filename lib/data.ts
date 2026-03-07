// Mock data cho All Star Fashion
import type { Category, Product } from "./types.ts";

export const categories: Category[] = [
  {
    id: "1",
    name: "Áo Thun",
    slug: "ao-thun",
    image: "/images/categories/ao-thun.jpg",
    description: "Áo thun nam nữ chất liệu cao cấp",
  },
  {
    id: "2",
    name: "Váy Đầm",
    slug: "vay-dam",
    image: "/images/categories/vay-dam.jpg",
    description: "Váy đầm thời trang cho nữ",
  },
  {
    id: "3",
    name: "Quần Jeans",
    slug: "quan-jeans",
    image: "/images/categories/quan-jeans.jpg",
    description: "Quần jeans chất lượng cao",
  },
  {
    id: "4",
    name: "Áo Khoác",
    slug: "ao-khoac",
    image: "/images/categories/ao-khoac.jpg",
    description: "Áo khoác đa dạng mẫu mã",
  },
  {
    id: "5",
    name: "Phụ Kiện",
    slug: "phu-kien",
    image: "/images/categories/phu-kien.jpg",
    description: "Phụ kiện thời trang",
  },
  {
    id: "6",
    name: "Giày Dép",
    slug: "giay-dep",
    image: "/images/categories/giay-dep.jpg",
    description: "Giày dép phong cách",
  },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Oversized Wool Coat",
    slug: "oversized-wool-coat",
    price: 2990000,
    originalPrice: 3990000,
    description:
      "Áo khoác len oversize cao cấp, thiết kế tối giản phong cách Hàn Quốc. Chất liệu wool blend mềm mại, giữ ấm tốt. Phù hợp cho mùa thu đông, dễ phối đồ với nhiều phong cách khác nhau.",
    category: "ao-khoac",
    images: [
      "/images/products/oversized-wool-coat/1.jpg",
      "/images/products/oversized-wool-coat/2.jpg",
      "/images/products/oversized-wool-coat/3.jpg",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Đen", hex: "#111111" },
      { name: "Be", hex: "#C8B89A" },
      { name: "Xám", hex: "#808080" },
    ],
    inStock: true,
    isNew: true,
    isBestSeller: true,
  },
  {
    id: "2",
    name: "Minimal White Tee",
    slug: "minimal-white-tee",
    price: 590000,
    description:
      "Áo thun trắng tối giản, chất liệu cotton organic 100%. Form dáng regular fit thoải mái, phù hợp với mọi dáng người. Essential item cho tủ đồ minimal.",
    category: "ao-thun",
    images: [
      "/images/products/minimal-white-tee/1.jpg",
      "/images/products/minimal-white-tee/2.jpg",
      "/images/products/minimal-white-tee/3.jpg",
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Đen", hex: "#111111" },
    ],
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "3",
    name: "Silk Wrap Dress",
    slug: "silk-wrap-dress",
    price: 1890000,
    originalPrice: 2390000,
    description:
      "Váy lụa wrap dress thanh lịch, thiết kế tôn dáng. Chất liệu silk blend mềm mại, rũ tự nhiên. Phù hợp cho các buổi tiệc, sự kiện hoặc đi làm.",
    category: "vay-dam",
    images: [
      "/images/products/silk-wrap-dress/1.jpg",
      "/images/products/silk-wrap-dress/2.jpg",
      "/images/products/silk-wrap-dress/3.jpg",
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Đen", hex: "#111111" },
      { name: "Đỏ Đô", hex: "#722F37" },
    ],
    inStock: true,
    isNew: true,
  },
  {
    id: "4",
    name: "Slim Fit Dark Jeans",
    slug: "slim-fit-dark-jeans",
    price: 1290000,
    description:
      "Quần jeans slim fit wash đậm, denim Nhật Bản cao cấp. Form dáng ôm vừa phải, thoải mái vận động. Thiết kế clean, dễ phối đồ.",
    category: "quan-jeans",
    images: [
      "/images/products/slim-fit-dark-jeans/1.jpg",
      "/images/products/slim-fit-dark-jeans/2.jpg",
      "/images/products/slim-fit-dark-jeans/3.jpg",
    ],
    sizes: ["28", "30", "32", "34", "36"],
    colors: [
      { name: "Dark Wash", hex: "#1A1A2E" },
      { name: "Black", hex: "#111111" },
    ],
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "5",
    name: "Cashmere Knit Sweater",
    slug: "cashmere-knit-sweater",
    price: 1690000,
    description:
      "Áo len cashmere blend siêu mềm, dệt tinh xảo. Form dáng relaxed fit, có thể mặc quanh năm. Phong cách thanh lịch, tối giản.",
    category: "ao-thun",
    images: [
      "/images/products/cashmere-knit-sweater/1.jpg",
      "/images/products/cashmere-knit-sweater/2.jpg",
      "/images/products/cashmere-knit-sweater/3.jpg",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Cream", hex: "#FFFDD0" },
      { name: "Camel", hex: "#C19A6B" },
      { name: "Đen", hex: "#111111" },
    ],
    inStock: true,
    isNew: true,
  },
  {
    id: "6",
    name: "Pleated Midi Skirt",
    slug: "pleated-midi-skirt",
    price: 990000,
    description:
      "Chân váy xếp ly midi thanh lịch, chất liệu polyester cao cấp. Phom dáng chữ A tôn dáng, phối được với nhiều kiểu áo khác nhau.",
    category: "vay-dam",
    images: [
      "/images/products/pleated-midi-skirt/1.jpg",
      "/images/products/pleated-midi-skirt/2.jpg",
      "/images/products/pleated-midi-skirt/3.jpg",
    ],
    sizes: ["XS", "S", "M", "L"],
    colors: [
      { name: "Đen", hex: "#111111" },
      { name: "Be", hex: "#C8B89A" },
    ],
    inStock: true,
  },
  {
    id: "7",
    name: "Leather Crossbody Bag",
    slug: "leather-crossbody-bag",
    price: 1490000,
    originalPrice: 1890000,
    description:
      "Túi đeo chéo da thật, thiết kế tối giản. Ngăn chứa rộng rãi, dây đeo điều chỉnh được. Phụ kiện hoàn hảo cho mọi outfit.",
    category: "phu-kien",
    images: [
      "/images/products/leather-crossbody-bag/1.jpg",
      "/images/products/leather-crossbody-bag/2.jpg",
      "/images/products/leather-crossbody-bag/3.jpg",
    ],
    sizes: ["One Size"],
    colors: [
      { name: "Đen", hex: "#111111" },
      { name: "Nâu", hex: "#5C4033" },
    ],
    inStock: true,
    isBestSeller: true,
  },
  {
    id: "8",
    name: "Minimal Sneakers",
    slug: "minimal-sneakers",
    price: 1790000,
    description:
      "Giày sneaker tối giản, da thật cao cấp. Đế cao su tự nhiên, êm ái khi di chuyển. Phong cách clean, phù hợp với mọi trang phục.",
    category: "giay-dep",
    images: [
      "/images/products/minimal-sneakers/1.jpg",
      "/images/products/minimal-sneakers/2.jpg",
      "/images/products/minimal-sneakers/3.jpg",
    ],
    sizes: ["39", "40", "41", "42", "43", "44"],
    colors: [
      { name: "Trắng", hex: "#FFFFFF" },
      { name: "Đen", hex: "#111111" },
    ],
    inStock: true,
    isNew: true,
  },
];

// Helpers
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.category === categorySlug);
}

export function getBestSellers(): Product[] {
  return products.filter((p) => p.isBestSeller);
}

export function getNewArrivals(): Product[] {
  return products.filter((p) => p.isNew);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}
