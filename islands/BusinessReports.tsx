// islands/BusinessReports.tsx — Business reporting dashboard island
import { useEffect, useState } from "preact/hooks";

interface RevenueByPeriod {
  period: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  refunds: number;
  netRevenue: number;
  avgOrderValue: number;
}

interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface ReportData {
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    returnedOrders: number;
    totalRevenue: number;
    totalRefunds: number;
    netRevenue: number;
    avgOrderValue: number;
    totalItemsSold: number;
    totalInvoices: number;
    totalShippingFees: number;
  };
  revenueByMonth: RevenueByPeriod[];
  revenueByDay: RevenueByPeriod[];
  topProducts: TopProduct[];
  statusBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
  carrierBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>;
}

interface Props {
  initialReport: ReportData;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  returning: "Đang trả hàng",
  returned: "Đã trả hàng",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#eab308",
  confirmed: "#3b82f6",
  shipping: "#8b5cf6",
  delivered: "#22c55e",
  completed: "#10b981",
  cancelled: "#ef4444",
  returning: "#f97316",
  returned: "#6b7280",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "COD",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  vnpay: "VNPay",
  credit_card: "Thẻ tín dụng",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa TT",
  paid: "Đã TT",
  refunded: "Đã hoàn",
  partial_refund: "Hoàn 1 phần",
};

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function formatShortVND(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// Simple bar chart component using pure CSS
function BarChart({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue?: number }) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  return (
    <div class="space-y-2">
      {data.map((d, i) => (
        <div key={i} class="flex items-center gap-3">
          <span class="text-xs text-gray-600 w-24 truncate text-right">{d.label}</span>
          <div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max((d.value / max) * 100, 1)}%`, backgroundColor: d.color || "#6366f1" }}
            />
          </div>
          <span class="text-xs font-medium text-gray-700 w-16 text-right">{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function RevenueChart({ data }: { data: RevenueByPeriod[] }) {
  if (data.length === 0) return <p class="text-sm text-gray-500">Chưa có dữ liệu</p>;
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const reversed = [...data].reverse();
  return (
    <div class="flex items-end gap-1 h-48">
      {reversed.map((d, i) => {
        const height = Math.max((d.revenue / maxRevenue) * 100, 2);
        return (
          <div key={i} class="flex-1 flex flex-col items-center justify-end group relative">
            <div class="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {formatVND(d.revenue)} — {d.totalOrders} đơn
            </div>
            <div
              class="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer"
              style={{ height: `${height}%` }}
            />
            <span class="text-[10px] text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
              {d.period.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function BusinessReports({ initialReport }: Props) {
  const [report, setReport] = useState<ReportData>(initialReport);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "products" | "invoices">("overview");

  async function fetchReport(from = dateFrom, to = dateTo) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setReport(data.report);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handleDateFilter(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
    fetchReport(from, to);
  }

  const { summary } = report;

  return (
    <div class="space-y-6">
      {/* Date filter */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom((e.target as HTMLInputElement).value)}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div class="flex-1">
            <label class="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo((e.target as HTMLInputElement).value)}
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => handleDateFilter(dateFrom, dateTo)}
            disabled={loading}
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Áp dụng"}
          </button>
          <div class="flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const first = new Date(today.getFullYear(), today.getMonth(), 1);
                handleDateFilter(first.toISOString().split("T")[0], today.toISOString().split("T")[0]);
              }}
              class="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Tháng này
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const q = Math.floor(today.getMonth() / 3) * 3;
                const first = new Date(today.getFullYear(), q, 1);
                handleDateFilter(first.toISOString().split("T")[0], today.toISOString().split("T")[0]);
              }}
              class="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Quý này
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const first = new Date(today.getFullYear(), 0, 1);
                handleDateFilter(first.toISOString().split("T")[0], today.toISOString().split("T")[0]);
              }}
              class="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Năm nay
            </button>
            <button
              onClick={() => handleDateFilter("", "")}
              class="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
            >
              Tất cả
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div class="flex border-b border-gray-200">
        {(["overview", "revenue", "products", "invoices"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            class={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "overview" ? "Tổng quan" : tab === "revenue" ? "Doanh thu" : tab === "products" ? "Sản phẩm" : "Hóa đơn"}
          </button>
        ))}
      </div>

      {loading && (
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
          <p class="mt-3 text-sm text-gray-500">Đang tải báo cáo...</p>
        </div>
      )}

      {!loading && activeTab === "overview" && (
        <div class="space-y-6">
          {/* KPI Cards */}
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Tổng đơn hàng" value={String(summary.totalOrders)} />
            <KPICard label="Doanh thu" value={formatShortVND(summary.totalRevenue)} color="emerald" />
            <KPICard label="Doanh thu thuần" value={formatShortVND(summary.netRevenue)} color="blue" />
            <KPICard label="TB/đơn hàng" value={formatVND(summary.avgOrderValue)} />
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Hoàn thành" value={String(summary.completedOrders)} color="green" />
            <KPICard label="Đã hủy" value={String(summary.cancelledOrders)} color="red" />
            <KPICard label="Đã trả hàng" value={String(summary.returnedOrders)} color="orange" />
            <KPICard label="SP đã bán" value={String(summary.totalItemsSold)} color="purple" />
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard label="Tổng hoàn tiền" value={formatVND(summary.totalRefunds)} color="red" />
            <KPICard label="Phí vận chuyển" value={formatVND(summary.totalShippingFees)} />
            <KPICard label="Hóa đơn đã xuất" value={String(summary.totalInvoices)} color="teal" />
          </div>

          {/* Charts grid */}
          <div class="grid lg:grid-cols-2 gap-6">
            {/* Status breakdown */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Phân bổ trạng thái</h3>
              <BarChart
                data={Object.entries(report.statusBreakdown).map(([k, v]) => ({
                  label: STATUS_LABELS[k] || k,
                  value: v,
                  color: STATUS_COLORS[k],
                }))}
              />
            </div>

            {/* Payment method breakdown */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Phương thức thanh toán</h3>
              <BarChart
                data={Object.entries(report.paymentMethodBreakdown).map(([k, v]) => ({
                  label: PAYMENT_METHOD_LABELS[k] || k,
                  value: v,
                  color: "#6366f1",
                }))}
              />
            </div>

            {/* Payment status breakdown */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Trạng thái thanh toán</h3>
              <BarChart
                data={Object.entries(report.paymentStatusBreakdown).map(([k, v]) => ({
                  label: PAYMENT_STATUS_LABELS[k] || k,
                  value: v,
                  color: k === "paid" ? "#22c55e" : k === "unpaid" ? "#ef4444" : "#6b7280",
                }))}
              />
            </div>

            {/* Carrier breakdown */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Đơn vị vận chuyển</h3>
              <BarChart
                data={Object.entries(report.carrierBreakdown).map(([k, v]) => ({
                  label: k,
                  value: v,
                  color: "#8b5cf6",
                }))}
              />
            </div>

            {/* City breakdown */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
              <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Phân bổ theo khu vực</h3>
              <BarChart
                data={Object.entries(report.cityBreakdown).map(([k, v]) => ({
                  label: k,
                  value: v,
                  color: "#0ea5e9",
                }))}
              />
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "revenue" && (
        <div class="space-y-6">
          {/* Monthly revenue chart */}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-6">Doanh thu theo tháng</h3>
            <RevenueChart data={report.revenueByMonth} />
          </div>

          {/* Monthly table */}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left py-3 px-4 font-medium text-gray-500">Tháng</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Đơn hàng</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Hoàn thành</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Đã hủy</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Doanh thu</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">TB/đơn</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {report.revenueByMonth.map((m) => (
                  <tr key={m.period} class="hover:bg-gray-50">
                    <td class="py-3 px-4 font-medium text-gray-900">{m.period}</td>
                    <td class="py-3 px-4 text-right text-gray-600">{m.totalOrders}</td>
                    <td class="py-3 px-4 text-right text-green-600">{m.completedOrders}</td>
                    <td class="py-3 px-4 text-right text-red-600">{m.cancelledOrders}</td>
                    <td class="py-3 px-4 text-right font-medium text-gray-900">{formatVND(m.revenue)}</td>
                    <td class="py-3 px-4 text-right text-gray-600">{formatVND(m.avgOrderValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Daily revenue chart */}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-6">Doanh thu 30 ngày gần nhất</h3>
            <RevenueChart data={report.revenueByDay} />
          </div>

          {/* Daily table */}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="max-h-96 overflow-y-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="text-left py-3 px-4 font-medium text-gray-500">Ngày</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-500">Đơn hàng</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-500">Doanh thu</th>
                    <th class="text-right py-3 px-4 font-medium text-gray-500">TB/đơn</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  {report.revenueByDay.map((d) => (
                    <tr key={d.period} class="hover:bg-gray-50">
                      <td class="py-2.5 px-4 text-gray-900">{d.period}</td>
                      <td class="py-2.5 px-4 text-right text-gray-600">{d.totalOrders}</td>
                      <td class="py-2.5 px-4 text-right font-medium text-gray-900">{formatVND(d.revenue)}</td>
                      <td class="py-2.5 px-4 text-right text-gray-600">{formatVND(d.avgOrderValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "products" && (
        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Top sản phẩm bán chạy</h3>
            {report.topProducts.length === 0 ? (
              <p class="text-sm text-gray-500">Chưa có dữ liệu</p>
            ) : (
              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-left py-3 px-4 font-medium text-gray-500">#</th>
                      <th class="text-left py-3 px-4 font-medium text-gray-500">Sản phẩm</th>
                      <th class="text-right py-3 px-4 font-medium text-gray-500">SL bán</th>
                      <th class="text-right py-3 px-4 font-medium text-gray-500">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    {report.topProducts.map((p, i) => (
                      <tr key={i} class="hover:bg-gray-50">
                        <td class="py-3 px-4">
                          <span class={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            i === 0 ? "bg-yellow-100 text-yellow-800" :
                            i === 1 ? "bg-gray-100 text-gray-700" :
                            i === 2 ? "bg-orange-100 text-orange-800" :
                            "bg-gray-50 text-gray-500"
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td class="py-3 px-4 font-medium text-gray-900">{p.productName}</td>
                        <td class="py-3 px-4 text-right text-gray-600">{p.totalQuantity}</td>
                        <td class="py-3 px-4 text-right font-medium text-gray-900">{formatVND(p.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && activeTab === "invoices" && (
        <div class="space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Thống kê hóa đơn</h3>
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <KPICard label="Tổng hóa đơn" value={String(summary.totalInvoices)} color="teal" />
              <KPICard label="Doanh thu hóa đơn" value={formatVND(summary.totalRevenue)} color="emerald" />
              <KPICard label="Hoàn tiền" value={formatVND(summary.totalRefunds)} color="red" />
            </div>
            <p class="text-sm text-gray-500">
              Để xem danh sách hóa đơn chi tiết, vui lòng vào{" "}
              <a href="/admin/orders" class="text-indigo-600 hover:underline">Quản lý đơn hàng</a>
              {" "}và xem hóa đơn trong từng đơn hàng.
            </p>
          </div>

          {/* Payment status summary */}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Trạng thái thanh toán</h3>
            <BarChart
              data={Object.entries(report.paymentStatusBreakdown).map(([k, v]) => ({
                label: PAYMENT_STATUS_LABELS[k] || k,
                value: v,
                color: k === "paid" ? "#22c55e" : k === "unpaid" ? "#ef4444" : k === "refunded" ? "#6b7280" : "#eab308",
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorClasses: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50",
    green: "border-green-200 bg-green-50",
    blue: "border-blue-200 bg-blue-50",
    red: "border-red-200 bg-red-50",
    orange: "border-orange-200 bg-orange-50",
    purple: "border-purple-200 bg-purple-50",
    teal: "border-teal-200 bg-teal-50",
  };
  const textClasses: Record<string, string> = {
    emerald: "text-emerald-800",
    green: "text-green-800",
    blue: "text-blue-800",
    red: "text-red-800",
    orange: "text-orange-800",
    purple: "text-purple-800",
    teal: "text-teal-800",
  };

  return (
    <div class={`rounded-xl shadow-sm border p-4 ${color ? colorClasses[color] || "border-gray-200" : "border-gray-200 bg-white"}`}>
      <p class="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p class={`text-xl font-bold mt-1 ${color ? textClasses[color] || "text-gray-900" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
