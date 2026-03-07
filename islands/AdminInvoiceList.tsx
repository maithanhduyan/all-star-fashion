// islands/AdminInvoiceList.tsx — Invoice list for accounting
import { useEffect, useRef, useState } from "preact/hooks";

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  issuedAt: string;
  paidAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props {
  initialInvoices: InvoiceListItem[];
  initialPagination: Pagination;
}

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
  partial_refund: "Hoàn tiền một phần",
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
  refunded: "bg-gray-100 text-gray-700",
  partial_refund: "bg-yellow-100 text-yellow-700",
};

const METHOD_LABELS: Record<string, string> = {
  cod: "COD",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  vnpay: "VNPay",
  credit_card: "Thẻ tín dụng",
};

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(s: string): string {
  return new Date(s).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function AdminInvoiceList({ initialInvoices, initialPagination }: Props) {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>(initialInvoices);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const searchTimeout = useRef<number | null>(null);

  // Summary stats
  const totalAmount = invoices.reduce((s, inv) => s + inv.total, 0);
  const paidCount = invoices.filter((inv) => inv.paymentStatus === "paid").length;
  const unpaidCount = invoices.filter((inv) => inv.paymentStatus === "unpaid").length;

  async function fetchInvoices(page = 1, q = search, payStatus = paymentFilter, from = dateFrom, to = dateTo) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (q) params.set("q", q);
      if (payStatus) params.set("paymentStatus", payStatus);
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);

      const res = await fetch(`/api/admin/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.data);
      setPagination(data.pagination);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchInvoices(1, value, paymentFilter, dateFrom, dateTo);
    }, 400) as unknown as number;
  }

  function handlePaymentFilter(value: string) {
    setPaymentFilter(value);
    fetchInvoices(1, search, value, dateFrom, dateTo);
  }

  function handleDateFilter(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
    fetchInvoices(1, search, paymentFilter, from, to);
  }

  function clearFilters() {
    setSearch("");
    setPaymentFilter("");
    setDateFrom("");
    setDateTo("");
    fetchInvoices(1, "", "", "", "");
  }

  function goToPage(page: number) {
    fetchInvoices(page);
  }

  return (
    <div class="space-y-6">
      {/* Quick Stats */}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Tổng hóa đơn</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{pagination.total}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Tổng giá trị</p>
          <p class="text-2xl font-bold text-emerald-600 mt-1">{formatVND(totalAmount)}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-green-200 p-4 bg-green-50">
          <p class="text-xs text-green-700 uppercase tracking-wide">Đã thanh toán</p>
          <p class="text-2xl font-bold text-green-800 mt-1">{paidCount}</p>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-red-200 p-4 bg-red-50">
          <p class="text-xs text-red-700 uppercase tracking-wide">Chưa thanh toán</p>
          <p class="text-2xl font-bold text-red-800 mt-1">{unpaidCount}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
                placeholder="Tìm số hóa đơn, mã đơn, tên khách..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => handlePaymentFilter((e.target as HTMLSelectElement).value)}
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả TT thanh toán</option>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            class={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Lọc nâng cao
          </button>
        </div>

        {showFilters && (
          <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex flex-col md:flex-row gap-4 items-end">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setDateFrom(val);
                    handleDateFilter(val, dateTo);
                  }}
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    setDateTo(val);
                    handleDateFilter(dateFrom, val);
                  }}
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="flex gap-2">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    handleDateFilter(today, today);
                  }}
                  class="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    handleDateFilter(monthStart.toISOString().split("T")[0], today.toISOString().split("T")[0]);
                  }}
                  class="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Tháng này
                </button>
              </div>
              <button
                onClick={clearFilters}
                class="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
              >
                Xóa lọc
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && (
          <div class="text-center py-8 text-gray-500">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
            <p class="mt-2 text-sm">Đang tải...</p>
          </div>
        )}
        {!loading && invoices.length === 0 && (
          <div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mt-3 text-sm">Chưa có hóa đơn nào</p>
          </div>
        )}
        {!loading && invoices.length > 0 && (
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left py-3 px-4 font-medium text-gray-500">Số hóa đơn</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-500">Mã đơn hàng</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-500">Khách hàng</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-500">Phương thức TT</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-500">Trạng thái TT</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Tổng tiền</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Ngày xuất</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Ngày TT</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} class="hover:bg-gray-50">
                    <td class="py-3 px-4">
                      <span class="font-mono font-medium text-teal-600">{inv.invoiceNumber}</span>
                    </td>
                    <td class="py-3 px-4">
                      <a href={`/admin/orders?q=${inv.orderNumber}`} class="font-mono text-indigo-600 hover:underline text-xs">
                        {inv.orderNumber}
                      </a>
                    </td>
                    <td class="py-3 px-4 font-medium text-gray-900">{inv.customerName}</td>
                    <td class="py-3 px-4 text-center text-xs text-gray-600">
                      {METHOD_LABELS[inv.paymentMethod] || inv.paymentMethod}
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_COLORS[inv.paymentStatus] || "bg-gray-100 text-gray-800"}`}>
                        {PAYMENT_LABELS[inv.paymentStatus] || inv.paymentStatus}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right font-medium text-gray-900">{formatVND(inv.total)}</td>
                    <td class="py-3 px-4 text-right text-gray-500 text-xs">{formatDateShort(inv.issuedAt)}</td>
                    <td class="py-3 px-4 text-right text-gray-500 text-xs">
                      {inv.paidAt ? formatDateShort(inv.paidAt) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} hóa đơn
          </p>
          <div class="flex gap-1">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              ‹
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
              .map((p, i, arr) => (
                <>
                  {i > 0 && arr[i - 1] !== p - 1 && <span class="px-2 py-1.5 text-gray-400">...</span>}
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    class={`px-3 py-1.5 rounded-lg text-sm ${
                      p === pagination.page
                        ? "bg-indigo-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                </>
              ))}
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
