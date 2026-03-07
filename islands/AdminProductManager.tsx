// islands/AdminProductManager.tsx — Full product management island
import { useEffect, useRef, useState } from "preact/hooks";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductColor {
  name: string;
  hex: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  costPrice: number | null;
  discountPrice: number | null;
  stockQuantity: number;
  description: string;
  category: { id: string; name: string; slug: string } | null;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props {
  initialProducts: Product[];
  initialPagination: Pagination;
  initialCategories: Category[];
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  slug: "",
  price: 0,
  originalPrice: "",
  costPrice: "",
  discountPrice: "",
  stockQuantity: 0,
  description: "",
  categoryId: "",
  inStock: true,
  isNew: false,
  isBestSeller: false,
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  images: "",
  sizes: "",
  colors: [] as ProductColor[],
};

interface ProductFormData {
  name: string;
  slug: string;
  price: number;
  originalPrice: string | number;
  costPrice: string | number;
  discountPrice: string | number;
  stockQuantity: number;
  description: string;
  categoryId: string;
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  images: string;
  sizes: string;
  colors: ProductColor[];
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
}

export default function AdminProductManager(
  { initialProducts, initialPagination, initialCategories }: Props,
) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [categories] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "seo">("general");
  const searchTimeout = useRef<number | null>(null);

  // Fetch products from API
  async function fetchProducts(page = 1, q = search, sort = sortBy, cat = filterCategory) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (q) params.set("q", q);
      if (sort) params.set("sort", sort);
      if (cat) params.set("category", cat);

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      setProducts(data.data);
      setPagination(data.pagination);
    } catch {
      setError("Lỗi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchProducts(1, value, sortBy, filterCategory);
    }, 400) as unknown as number;
  }

  function handleSortChange(value: string) {
    setSortBy(value);
    fetchProducts(1, search, value, filterCategory);
  }

  function handleCategoryFilter(value: string) {
    setFilterCategory(value);
    fetchProducts(1, search, sortBy, value);
  }

  function goToPage(page: number) {
    fetchProducts(page);
  }

  // Open modal for adding
  function openAddModal() {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM });
    setActiveTab("general");
    setError("");
    setShowModal(true);
  }

  // Open edit modal
  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice ?? "",
      costPrice: product.costPrice ?? "",
      discountPrice: product.discountPrice ?? "",
      stockQuantity: product.stockQuantity,
      description: product.description,
      categoryId: product.category?.id ?? "",
      inStock: product.inStock,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
      metaKeywords: product.metaKeywords ?? "",
      images: product.images.join("\n"),
      sizes: product.sizes.join(", "),
      colors: product.colors.length > 0 ? [...product.colors] : [],
    });
    setActiveTab("general");
    setError("");
    setShowModal(true);
  }

  // Handle form field change
  function updateForm(field: string, value: unknown) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name
      if (field === "name" && !editingProduct) {
        updated.slug = slugify(value as string);
      }
      return updated;
    });
  }

  // Add a color entry
  function addColor() {
    setForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: "", hex: "#000000" }],
    }));
  }

  function updateColor(index: number, field: "name" | "hex", value: string) {
    setForm((prev) => {
      const colors = [...prev.colors];
      colors[index] = { ...colors[index], [field]: value };
      return { ...prev, colors };
    });
  }

  function removeColor(index: number) {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  }

  // Save product (create or update)
  async function handleSave() {
    setError("");
    setSaving(true);

    try {
      const images = (form.images as string)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const sizes = (form.sizes as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: form.name,
        slug: form.slug,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        description: form.description,
        categoryId: form.categoryId || null,
        inStock: form.inStock,
        isNew: form.isNew,
        isBestSeller: form.isBestSeller,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        metaKeywords: form.metaKeywords || null,
        images,
        sizes,
        colors: form.colors.filter((c) => c.name && c.hex),
      };

      if (!payload.name || !payload.slug || !payload.price) {
        setError("Tên, slug và giá bán là bắt buộc");
        setSaving(false);
        return;
      }

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Lỗi lưu sản phẩm");
        setSaving(false);
        return;
      }

      setShowModal(false);
      setSuccess(editingProduct ? "Cập nhật thành công!" : "Thêm sản phẩm thành công!");
      setTimeout(() => setSuccess(""), 3000);
      fetchProducts(pagination.page);
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setSaving(false);
    }
  }

  // Delete product
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Lỗi xóa sản phẩm");
        return;
      }
      setDeleteConfirm(null);
      setSuccess("Xóa sản phẩm thành công!");
      setTimeout(() => setSuccess(""), 3000);
      fetchProducts(pagination.page);
    } catch {
      setError("Lỗi kết nối server");
    }
  }

  return (
    <div>
      {/* Success toast */}
      {success && (
        <div class="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Toolbar: Search + Filter + Sort + Add */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div class="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div class="relative flex-1 min-w-[200px]">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
              class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition"
            />
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => handleCategoryFilter((e.target as HTMLSelectElement).value)}
            class="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange((e.target as HTMLSelectElement).value)}
            class="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="best_seller">Bán chạy</option>
          </select>

          {/* Add button */}
          <button
            onClick={openAddModal}
            class="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                <th class="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh mục</th>
                <th class="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá nhập</th>
                <th class="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá bán</th>
                <th class="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá giảm</th>
                <th class="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tồn kho</th>
                <th class="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th class="py-3 px-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} class="py-12 text-center text-gray-400">
                  <div class="flex items-center justify-center gap-2">
                    <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Đang tải...
                  </div>
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} class="py-12 text-center text-gray-400">
                  <div class="flex flex-col items-center gap-2">
                    <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Không có sản phẩm nào
                  </div>
                </td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} class="hover:bg-gray-50/50 transition-colors">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} class="w-full h-full object-cover" />
                          ) : (
                            <div class="w-full h-full flex items-center justify-center text-gray-300">
                              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div class="min-w-0">
                          <a href={`/shop/${product.slug}`} class="font-medium text-gray-900 hover:text-black hover:underline truncate block max-w-[200px]" title={product.name}>
                            {product.name}
                          </a>
                          <div class="flex gap-1 mt-1">
                            {product.isNew && <span class="text-[10px] bg-black text-white px-1.5 py-0.5 rounded">NEW</span>}
                            {product.isBestSeller && <span class="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded">HOT</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-gray-500">{product.category?.name || "—"}</td>
                    <td class="py-3 px-4 text-right text-gray-500 font-mono text-xs">
                      {product.costPrice ? formatVND(product.costPrice) : "—"}
                    </td>
                    <td class="py-3 px-4 text-right font-medium font-mono text-xs">
                      <div>{formatVND(product.price)}</div>
                      {product.originalPrice && (
                        <div class="text-gray-400 line-through text-[11px]">{formatVND(product.originalPrice)}</div>
                      )}
                    </td>
                    <td class="py-3 px-4 text-right font-mono text-xs">
                      {product.discountPrice ? (
                        <span class="text-red-600 font-medium">{formatVND(product.discountPrice)}</span>
                      ) : "—"}
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span class={`inline-block min-w-[40px] text-xs font-medium px-2 py-1 rounded-full ${
                        product.stockQuantity > 10
                          ? "bg-green-50 text-green-700"
                          : product.stockQuantity > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span class={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        product.inStock
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {product.inStock ? "Còn hàng" : "Hết hàng"}
                      </span>
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(product)}
                          class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <div class="text-sm text-gray-500">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} sản phẩm
            </div>
            <div class="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
                class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ‹ Trước
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return p === 1 || p === pagination.totalPages ||
                    Math.abs(p - pagination.page) <= 2;
                })
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span key={`dots-${i}`} class="px-2 text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      class={`px-3 py-1.5 text-sm rounded-lg transition ${
                        p === pagination.page
                          ? "bg-black text-white"
                          : "border border-gray-200 hover:bg-white"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
                class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Sau ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold">Xác nhận xóa</h3>
                <p class="text-sm text-gray-500">Sản phẩm sẽ bị xóa vĩnh viễn</p>
              </div>
            </div>
            <div class="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8" onClick={() => setShowModal(false)}>
          <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 my-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 class="text-lg font-semibold">
                {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <button onClick={() => setShowModal(false)} class="p-2 hover:bg-gray-100 rounded-lg transition">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div class="flex border-b border-gray-100 px-6">
              {[
                { key: "general" as const, label: "Thông tin chung" },
                { key: "pricing" as const, label: "Giá & Kho" },
                { key: "seo" as const, label: "SEO" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  class={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === tab.key
                      ? "border-black text-black"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div class="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Tab Content */}
            <div class="p-6 max-h-[60vh] overflow-y-auto">
              {/* General Tab */}
              {activeTab === "general" && (
                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                      <input
                        type="text"
                        value={form.name}
                        onInput={(e) => updateForm("name", (e.target as HTMLInputElement).value)}
                        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                        placeholder="Áo thun trắng minimalist"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                      <input
                        type="text"
                        value={form.slug}
                        onInput={(e) => updateForm("slug", (e.target as HTMLInputElement).value)}
                        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                        placeholder="ao-thun-trang-minimalist"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => updateForm("categoryId", (e.target as HTMLSelectElement).value)}
                      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                    >
                      <option value="">— Không chọn —</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                      value={form.description}
                      onInput={(e) => updateForm("description", (e.target as HTMLTextAreaElement).value)}
                      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                      rows={4}
                      placeholder="Mô tả chi tiết sản phẩm..."
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Hình ảnh (mỗi URL một dòng)</label>
                    <textarea
                      value={form.images as string}
                      onInput={(e) => updateForm("images", (e.target as HTMLTextAreaElement).value)}
                      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                      rows={3}
                      placeholder={"/images/products/example/1.webp\n/images/products/example/2.webp"}
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Size (cách nhau bởi dấu phẩy)</label>
                      <input
                        type="text"
                        value={form.sizes as string}
                        onInput={(e) => updateForm("sizes", (e.target as HTMLInputElement).value)}
                        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="S, M, L, XL"
                      />
                    </div>
                    <div class="flex items-end gap-4">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isNew} onChange={(e) => updateForm("isNew", (e.target as HTMLInputElement).checked)} class="rounded" />
                        <span class="text-sm">Mới (NEW)</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isBestSeller} onChange={(e) => updateForm("isBestSeller", (e.target as HTMLInputElement).checked)} class="rounded" />
                        <span class="text-sm">Bán chạy (HOT)</span>
                      </label>
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-sm font-medium text-gray-700">Màu sắc</label>
                      <button onClick={addColor} type="button" class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        + Thêm màu
                      </button>
                    </div>
                    {form.colors.length === 0 && (
                      <p class="text-sm text-gray-400 italic">Chưa có màu nào</p>
                    )}
                    <div class="space-y-2">
                      {form.colors.map((color, i) => (
                        <div key={i} class="flex items-center gap-2">
                          <input
                            type="color"
                            value={color.hex}
                            onChange={(e) => updateColor(i, "hex", (e.target as HTMLInputElement).value)}
                            class="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={color.name}
                            onInput={(e) => updateColor(i, "name", (e.target as HTMLInputElement).value)}
                            placeholder="Tên màu"
                            class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                          />
                          <input
                            type="text"
                            value={color.hex}
                            onInput={(e) => updateColor(i, "hex", (e.target as HTMLInputElement).value)}
                            placeholder="#000000"
                            class="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10"
                          />
                          <button onClick={() => removeColor(i)} class="p-2 text-gray-400 hover:text-red-500 transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === "pricing" && (
                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ) *</label>
                      <input
                        type="number"
                        value={form.price}
                        onInput={(e) => updateForm("price", Number((e.target as HTMLInputElement).value))}
                        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá gốc (VNĐ)</label>
                      <input
                        type="number"
                        value={form.originalPrice}
                        onInput={(e) => updateForm("originalPrice", (e.target as HTMLInputElement).value)}
                        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10"
                        min="0"
                        step="1000"
                        placeholder="Giá trước giảm"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá nhập (VNĐ)</label>
                      <input
                        type="number"
                        value={form.costPrice}
                        onInput={(e) => updateForm("costPrice", (e.target as HTMLInputElement).value)}
                        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10"
                        min="0"
                        step="1000"
                        placeholder="Giá vốn"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Giá giảm (VNĐ)</label>
                      <input
                        type="number"
                        value={form.discountPrice}
                        onInput={(e) => updateForm("discountPrice", (e.target as HTMLInputElement).value)}
                        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10"
                        min="0"
                        step="1000"
                        placeholder="Giá khuyến mãi"
                      />
                    </div>
                  </div>

                  {/* Profit preview */}
                  {form.price > 0 && form.costPrice && Number(form.costPrice) > 0 && (
                    <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <h4 class="text-sm font-medium text-blue-800 mb-2">Lợi nhuận ước tính</h4>
                      <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span class="text-blue-600">Lợi nhuận/SP:</span>
                          <span class="font-mono font-medium ml-2 text-blue-900">
                            {formatVND(Number(form.price) - Number(form.costPrice))}
                          </span>
                        </div>
                        <div>
                          <span class="text-blue-600">Biên lợi nhuận:</span>
                          <span class="font-mono font-medium ml-2 text-blue-900">
                            {(((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn kho</label>
                      <input
                        type="number"
                        value={form.stockQuantity}
                        onInput={(e) => updateForm("stockQuantity", Number((e.target as HTMLInputElement).value))}
                        class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10"
                        min="0"
                      />
                    </div>
                    <div class="flex items-end">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.inStock}
                          onChange={(e) => updateForm("inStock", (e.target as HTMLInputElement).checked)}
                          class="rounded"
                        />
                        <span class="text-sm">Còn hàng</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === "seo" && (
                <div class="space-y-4">
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 class="text-sm font-medium text-gray-600 mb-2">Xem trước trên Google</h4>
                    <div class="text-blue-700 text-base font-medium truncate">
                      {form.metaTitle || form.name || "Tiêu đề sản phẩm"}
                    </div>
                    <div class="text-green-700 text-xs font-mono mt-1">
                      allstarfashion.vn/shop/{form.slug || "slug-san-pham"}
                    </div>
                    <div class="text-gray-500 text-sm mt-1 line-clamp-2">
                      {form.metaDescription || form.description || "Mô tả sản phẩm sẽ hiển thị ở đây..."}
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                    <input
                      type="text"
                      value={form.metaTitle}
                      onInput={(e) => updateForm("metaTitle", (e.target as HTMLInputElement).value)}
                      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      placeholder="Tiêu đề SEO (để trống sẽ dùng tên sản phẩm)"
                      maxLength={60}
                    />
                    <div class="text-xs text-gray-400 mt-1 text-right">{(form.metaTitle || "").length}/60</div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                    <textarea
                      value={form.metaDescription}
                      onInput={(e) => updateForm("metaDescription", (e.target as HTMLTextAreaElement).value)}
                      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      rows={3}
                      placeholder="Mô tả SEO (để trống sẽ dùng mô tả sản phẩm)"
                      maxLength={160}
                    />
                    <div class="text-xs text-gray-400 mt-1 text-right">{(form.metaDescription || "").length}/160</div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                    <input
                      type="text"
                      value={form.metaKeywords}
                      onInput={(e) => updateForm("metaKeywords", (e.target as HTMLInputElement).value)}
                      class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      placeholder="thời trang, áo thun, minimalist"
                    />
                    <div class="text-xs text-gray-400 mt-1">Phân cách bằng dấu phẩy</div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                class="px-5 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                class="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving && (
                  <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                )}
                {editingProduct ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
