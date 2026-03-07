// islands/AdminOrderManager.tsx — Full order management island
import { useEffect, useRef, useState } from "preact/hooks";

// ── Types ──

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  itemCount: number;
  carrierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface TimelineEntry {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  actorName: string;
  createdAt: string;
}

interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  trackingUrlTemplate: string | null;
  isActive: boolean;
}

interface InvoiceItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  paymentStatus: string;
  issuedAt: string;
  items: InvoiceItem[];
}

interface ReturnInfo {
  id: string;
  returnNumber: string;
  reason: string;
  status: string;
  refundAmount: number;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  district: string;
  note: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  carrier: ShippingCarrier | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  items: OrderItem[];
  timeline: TimelineEntry[];
  invoice: Invoice | null;
  returnInfo: ReturnInfo | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props {
  initialOrders: OrderListItem[];
  initialPagination: Pagination;
  initialCarriers: ShippingCarrier[];
}

// ── Constants ──

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
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  returning: "bg-orange-100 text-orange-800",
  returned: "bg-gray-100 text-gray-800",
};

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

// ── Status badge ──
function StatusBadge({ status, map, colorMap }: { status: string; map: Record<string, string>; colorMap: Record<string, string> }) {
  return (
    <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status] || "bg-gray-100 text-gray-800"}`}>
      {map[status] || status}
    </span>
  );
}

// ── Workflow Progress Stepper ──
function WorkflowStepper({ status, paymentStatus, hasInvoice }: { status: string; paymentStatus: string; hasInvoice: boolean }) {
  const steps = [
    { key: "pending", label: "Chờ xác nhận", icon: "📋" },
    { key: "confirmed", label: "Đã xác nhận", icon: "✅" },
    { key: "shipping", label: "Đang giao", icon: "🚚" },
    { key: "delivered", label: "Đã giao", icon: "📦" },
    { key: "paid", label: "Đã thanh toán", icon: "💰" },
    { key: "completed", label: "Hoàn thành", icon: "🎉" },
    { key: "invoiced", label: "Hóa đơn", icon: "🧾" },
  ];

  const statusOrder = ["pending", "confirmed", "shipping", "delivered", "completed"];
  const currentIdx = statusOrder.indexOf(status);

  function isStepComplete(stepKey: string): boolean {
    if (stepKey === "paid") return paymentStatus === "paid";
    if (stepKey === "invoiced") return hasInvoice;
    const stepIdx = statusOrder.indexOf(stepKey);
    return stepIdx >= 0 && stepIdx < currentIdx;
  }

  function isStepCurrent(stepKey: string): boolean {
    if (stepKey === "paid") return paymentStatus === "unpaid" && currentIdx >= 3;
    if (stepKey === "invoiced") return !hasInvoice && (status === "completed" || paymentStatus === "paid");
    return stepKey === status;
  }

  return (
    <div class="flex items-center justify-between overflow-x-auto gap-1">
      {steps.map((step, i) => {
        const complete = isStepComplete(step.key);
        const current = isStepCurrent(step.key);
        return (
          <div key={step.key} class="flex items-center flex-1 min-w-0">
            <div class="flex flex-col items-center text-center min-w-[60px]">
              <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                complete ? "bg-green-500 text-white" : current ? "bg-indigo-500 text-white ring-4 ring-indigo-100" : "bg-gray-200 text-gray-400"
              }`}>
                {complete ? "✓" : step.icon}
              </div>
              <span class={`text-[10px] mt-1 leading-tight ${complete ? "text-green-700 font-medium" : current ? "text-indigo-700 font-medium" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div class={`flex-1 h-0.5 mx-1 ${complete ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ──

export default function AdminOrderManager({ initialOrders, initialPagination, initialCarriers }: Props) {
  const [orders, setOrders] = useState<OrderListItem[]>(initialOrders);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [carriers] = useState<ShippingCarrier[]>(initialCarriers);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Quick stats
  const [stats, setStats] = useState<{ totalRevenue: number; orderCount: number; pendingCount: number; shippingCount: number } | null>(null);

  // Detail view
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Action form states
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [carrierForm, setCarrierForm] = useState({ carrierId: "", trackingNumber: "" });
  const [returnForm, setReturnForm] = useState({ reason: "", refundAmount: "" });
  const [returnAction, setReturnAction] = useState({ returnId: "", action: "", adminNote: "" });

  const searchTimeout = useRef<number | null>(null);

  // ── Compute quick stats from orders ──
  useEffect(() => {
    const totalRevenue = orders.reduce((sum: number, o: any) => {
      if (o.status !== "cancelled" && o.status !== "returned") return sum + o.total;
      return sum;
    }, 0);
    const pendingCount = orders.filter((o: any) => o.status === "pending").length;
    const shippingCount = orders.filter((o: any) => o.status === "shipping").length;
    setStats({ totalRevenue, orderCount: pagination.total, pendingCount, shippingCount });
  }, [orders, pagination]);

  // ── Fetch orders ──
  async function fetchOrders(
    page = 1,
    q = search,
    sort = sortBy,
    status = statusFilter,
    payStatus = paymentStatusFilter,
    from = dateFrom,
    to = dateTo,
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (q) params.set("q", q);
      if (sort) params.set("sort", sort);
      if (status) params.set("status", status);
      if (payStatus) params.set("paymentStatus", payStatus);
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.data);
      setPagination(data.pagination);
    } catch {
      setError("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchOrders(1, value, sortBy, statusFilter, paymentStatusFilter, dateFrom, dateTo);
    }, 400) as unknown as number;
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    fetchOrders(1, search, sortBy, value, paymentStatusFilter, dateFrom, dateTo);
  }

  function handlePaymentStatusFilter(value: string) {
    setPaymentStatusFilter(value);
    fetchOrders(1, search, sortBy, statusFilter, value, dateFrom, dateTo);
  }

  function handleSortChange(value: string) {
    setSortBy(value);
    fetchOrders(1, search, value, statusFilter, paymentStatusFilter, dateFrom, dateTo);
  }

  function handleDateFilter(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
    fetchOrders(1, search, sortBy, statusFilter, paymentStatusFilter, from, to);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setPaymentStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
    fetchOrders(1, "", "newest", "", "", "", "");
  }

  function goToPage(page: number) {
    fetchOrders(page);
  }

  // ── Export CSV ──
  async function handleExportCSV() {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("format", "csv");
      if (statusFilter) params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/orders?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("Xuất CSV thành công");
    } catch {
      setError("Lỗi xuất CSV");
    } finally {
      setExportLoading(false);
    }
  }

  // ── Print Invoice ──
  function handlePrintInvoice(invoice: Invoice, order: OrderDetail) {
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8" /><title>Hóa đơn ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-box h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
        .info-box p { margin: 4px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .text-right { text-align: right; }
        .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #333; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <h1>ALL STAR FASHION</h1>
        <p>HÓA ĐƠN BÁN HÀNG</p>
        <p>Số: ${invoice.invoiceNumber} | Đơn hàng: ${order.orderNumber}</p>
        <p>Ngày xuất: ${new Date(invoice.issuedAt).toLocaleDateString("vi-VN")}</p>
      </div>
      <div class="info-grid">
        <div class="info-box">
          <h3>Khách hàng</h3>
          <p><strong>${invoice.customerName}</strong></p>
          <p>${invoice.customerEmail || ""}</p>
          <p>${invoice.customerPhone || ""}</p>
        </div>
        <div class="info-box">
          <h3>Giao hàng</h3>
          <p>${order.shippingAddress}</p>
          <p>${order.district}, ${order.city}</p>
          <p>ĐVVC: ${order.carrier?.name || "Chưa gán"}</p>
          ${order.trackingNumber ? `<p>Mã vận đơn: ${order.trackingNumber}</p>` : ""}
        </div>
      </div>
      <table>
        <thead><tr>
          <th>Sản phẩm</th><th class="text-right">SL</th>
          <th class="text-right">Đơn giá</th><th class="text-right">Thành tiền</th>
        </tr></thead>
        <tbody>
          ${invoice.items.map((item: InvoiceItem) => `
            <tr>
              <td>${item.productName}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatVND(item.unitPrice)}</td>
              <td class="text-right">${formatVND(item.total)}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr><td colspan="3" class="text-right">Tạm tính:</td><td class="text-right">${formatVND(invoice.subtotal)}</td></tr>
          <tr><td colspan="3" class="text-right">Phí ship:</td><td class="text-right">${formatVND(invoice.shippingFee)}</td></tr>
          ${invoice.tax ? `<tr><td colspan="3" class="text-right">Thuế:</td><td class="text-right">${formatVND(invoice.tax)}</td></tr>` : ""}
          <tr class="total-row"><td colspan="3" class="text-right">TỔNG CỘNG:</td><td class="text-right">${formatVND(invoice.total)}</td></tr>
        </tfoot>
      </table>
      <div class="info-grid">
        <div class="info-box">
          <h3>Phương thức thanh toán</h3>
          <p>${order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : order.paymentMethod === "bank_transfer" ? "Chuyển khoản" : order.paymentMethod}</p>
          <p>Trạng thái: ${PAYMENT_LABELS[invoice.paymentStatus] || invoice.paymentStatus}</p>
        </div>
      </div>
      <div class="footer">
        <p>Cảm ơn quý khách đã mua hàng tại All Star Fashion!</p>
        <p>Hóa đơn được tạo tự động bởi hệ thống.</p>
      </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }

  // ── Fetch order detail ──
  async function openOrderDetail(orderId: string) {
    setDetailLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedOrder(data.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải chi tiết đơn hàng");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedOrder(null);
  }

  // ── Clear messages after timeout ──
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ── Helper: API call with refresh ──
  async function apiAction(url: string, method: string, body?: unknown): Promise<unknown> {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } finally {
      setActionLoading(false);
    }
  }

  // ── Update order status ──
  async function handleStatusChange(status: string, note?: string) {
    if (!selectedOrder) return;
    try {
      const data = await apiAction(`/api/admin/orders/${selectedOrder.id}`, "PATCH", { status, note }) as { order: OrderDetail };
      setSelectedOrder(data.order);
      setSuccess(`Đã cập nhật trạng thái: ${STATUS_LABELS[status]}`);
      setShowStatusModal(false);
      fetchOrders(pagination.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi cập nhật trạng thái");
    }
  }

  // ── Cancel order ──
  async function handleCancel() {
    if (!selectedOrder || !cancelReason.trim()) return;
    try {
      const data = await apiAction(`/api/admin/orders/${selectedOrder.id}`, "PATCH", {
        status: "cancelled",
        note: cancelReason,
      }) as { order: OrderDetail };
      setSelectedOrder(data.order);
      setSuccess("Đã hủy đơn hàng");
      setShowCancelModal(false);
      setCancelReason("");
      fetchOrders(pagination.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi hủy đơn hàng");
    }
  }

  // ── Assign carrier ──
  async function handleAssignCarrier() {
    if (!selectedOrder || !carrierForm.carrierId) return;
    try {
      const data = await apiAction(`/api/admin/orders/${selectedOrder.id}`, "PATCH", {
        action: "assign_carrier",
        carrierId: carrierForm.carrierId,
        trackingNumber: carrierForm.trackingNumber || undefined,
      }) as { order: OrderDetail };
      setSelectedOrder(data.order);
      setSuccess("Đã gán đơn vị vận chuyển");
      setShowCarrierModal(false);
      setCarrierForm({ carrierId: "", trackingNumber: "" });
      fetchOrders(pagination.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi gán đơn vị vận chuyển");
    }
  }

  // ── Mark as paid ──
  async function handleMarkPaid() {
    if (!selectedOrder) return;
    try {
      const data = await apiAction(`/api/admin/orders/${selectedOrder.id}`, "PATCH", {
        action: "mark_paid",
      }) as { order: OrderDetail };
      setSelectedOrder(data.order);
      setSuccess("Đã xác nhận thanh toán");
      fetchOrders(pagination.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi xác nhận thanh toán");
    }
  }

  // ── Create invoice ──
  async function handleCreateInvoice() {
    if (!selectedOrder) return;
    try {
      await apiAction(`/api/admin/orders/${selectedOrder.id}/invoice`, "POST");
      // Refresh order detail to get invoice data
      await openOrderDetail(selectedOrder.id);
      setSuccess("Đã xuất hóa đơn thành công");
      setShowInvoiceModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi xuất hóa đơn");
    }
  }

  // ── Create return ──
  async function handleCreateReturn() {
    if (!selectedOrder || !returnForm.reason.trim()) return;
    try {
      await apiAction(`/api/admin/orders/${selectedOrder.id}/return`, "POST", {
        reason: returnForm.reason,
        refundAmount: returnForm.refundAmount ? Number(returnForm.refundAmount) : undefined,
      });
      await openOrderDetail(selectedOrder.id);
      setSuccess("Đã tạo yêu cầu trả hàng");
      setShowReturnModal(false);
      setReturnForm({ reason: "", refundAmount: "" });
      fetchOrders(pagination.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tạo yêu cầu trả hàng");
    }
  }

  // ── Handle return actions (approve/complete/reject) ──
  async function handleReturnAction(returnId: string, action: string, adminNote?: string) {
    if (!selectedOrder) return;
    try {
      await apiAction(`/api/admin/orders/${selectedOrder.id}/return`, "PATCH", {
        returnId,
        action,
        adminNote,
      });
      await openOrderDetail(selectedOrder.id);
      setSuccess(
        action === "approve" ? "Đã duyệt yêu cầu trả hàng"
          : action === "complete" ? "Đã hoàn tất trả hàng"
          : "Đã từ chối yêu cầu trả hàng",
      );
      fetchOrders(pagination.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi xử lý trả hàng");
    }
  }

  // ── Available status transitions ──
  function getAvailableActions(status: string): string[] {
    const map: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipping", "cancelled"],
      shipping: ["delivered", "returning"],
      delivered: ["completed", "returning"],
    };
    return map[status] || [];
  }

  // ────────────────── RENDER ──────────────────

  // Order detail view
  if (selectedOrder) {
    return (
      <div class="space-y-6">
        {/* Messages */}
        {error && <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
        {success && <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

        {/* Back button + header */}
        <div class="flex items-center justify-between">
          <button
            onClick={closeDetail}
            class="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <div class="flex items-center gap-3">
            <StatusBadge status={selectedOrder.status} map={STATUS_LABELS} colorMap={STATUS_COLORS} />
            <StatusBadge status={selectedOrder.paymentStatus} map={PAYMENT_LABELS} colorMap={PAYMENT_COLORS} />
          </div>
        </div>

        {/* Order header info */}
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-gray-900">Đơn hàng #{selectedOrder.orderNumber}</h2>
              <p class="text-sm text-gray-500 mt-1">Ngày tạo: {formatDate(selectedOrder.createdAt)}</p>
              {selectedOrder.updatedAt && (
                <p class="text-sm text-gray-500">Cập nhật: {formatDate(selectedOrder.updatedAt)}</p>
              )}
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-gray-900">{formatVND(selectedOrder.total)}</p>
              <p class="text-sm text-gray-500">Tạm tính: {formatVND(selectedOrder.subtotal)} + Ship: {formatVND(selectedOrder.shippingFee)}</p>
            </div>
          </div>
        </div>

        {/* Workflow Progress Stepper */}
        {!["cancelled", "returned", "returning"].includes(selectedOrder.status) && (
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Tiến trình đơn hàng</h3>
            <WorkflowStepper status={selectedOrder.status} paymentStatus={selectedOrder.paymentStatus} hasInvoice={!!selectedOrder.invoice} />
          </div>
        )}

        {/* Action buttons */}
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Thao tác</h3>
          <div class="flex flex-wrap gap-2">
            {getAvailableActions(selectedOrder.status).map((nextStatus) => (
              nextStatus === "cancelled" ? (
                <button
                  key={nextStatus}
                  onClick={() => setShowCancelModal(true)}
                  disabled={actionLoading}
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  Hủy đơn hàng
                </button>
              ) : nextStatus === "returning" ? (
                <button
                  key={nextStatus}
                  onClick={() => setShowReturnModal(true)}
                  disabled={actionLoading}
                  class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
                >
                  Yêu cầu trả hàng
                </button>
              ) : (
                <button
                  key={nextStatus}
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={actionLoading}
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                >
                  {STATUS_LABELS[nextStatus]}
                </button>
              )
            ))}

            {/* Assign carrier - available for confirmed/shipping */}
            {["confirmed", "shipping"].includes(selectedOrder.status) && (
              <button
                onClick={() => {
                  setCarrierForm({
                    carrierId: selectedOrder.carrier?.id || "",
                    trackingNumber: selectedOrder.trackingNumber || "",
                  });
                  setShowCarrierModal(true);
                }}
                disabled={actionLoading}
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
              >
                {selectedOrder.carrier ? "Đổi vận chuyển" : "Gán vận chuyển"}
              </button>
            )}

            {/* Mark paid */}
            {selectedOrder.paymentStatus === "unpaid" && !["cancelled", "returned"].includes(selectedOrder.status) && (
              <button
                onClick={handleMarkPaid}
                disabled={actionLoading}
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                Xác nhận thanh toán
              </button>
            )}

            {/* Create invoice */}
            {!selectedOrder.invoice && !["pending", "cancelled"].includes(selectedOrder.status) && (
              <button
                onClick={() => setShowInvoiceModal(true)}
                disabled={actionLoading}
                class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
              >
                Xuất hóa đơn
              </button>
            )}
          </div>
        </div>

        {/* Two-column layout: Customer + Shipping */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer info */}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Thông tin khách hàng</h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500">Họ tên:</dt>
                <dd class="font-medium text-gray-900">{selectedOrder.customerName}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Email:</dt>
                <dd class="text-gray-900">{selectedOrder.customerEmail}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">SĐT:</dt>
                <dd class="text-gray-900">{selectedOrder.customerPhone}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Địa chỉ:</dt>
                <dd class="text-gray-900 text-right max-w-[200px]">{selectedOrder.shippingAddress}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Quận/Huyện:</dt>
                <dd class="text-gray-900">{selectedOrder.district}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Thành phố:</dt>
                <dd class="text-gray-900">{selectedOrder.city}</dd>
              </div>
              {selectedOrder.note && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Ghi chú:</dt>
                  <dd class="text-gray-900 text-right max-w-[200px]">{selectedOrder.note}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Shipping info */}
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Vận chuyển & Thanh toán</h3>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500">ĐVVC:</dt>
                <dd class="font-medium text-gray-900">{selectedOrder.carrier?.name || "Chưa gán"}</dd>
              </div>
              {selectedOrder.trackingNumber && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Mã vận đơn:</dt>
                  <dd class="text-gray-900 font-mono">{selectedOrder.trackingNumber}</dd>
                </div>
              )}
              <div class="flex justify-between">
                <dt class="text-gray-500">Phương thức TT:</dt>
                <dd class="text-gray-900">{selectedOrder.paymentMethod === "cod" ? "COD" : selectedOrder.paymentMethod}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Thanh toán:</dt>
                <dd><StatusBadge status={selectedOrder.paymentStatus} map={PAYMENT_LABELS} colorMap={PAYMENT_COLORS} /></dd>
              </div>
              {selectedOrder.shippedAt && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Gửi hàng:</dt>
                  <dd class="text-gray-900">{formatDate(selectedOrder.shippedAt)}</dd>
                </div>
              )}
              {selectedOrder.deliveredAt && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Giao hàng:</dt>
                  <dd class="text-gray-900">{formatDate(selectedOrder.deliveredAt)}</dd>
                </div>
              )}
              {selectedOrder.paidAt && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Thanh toán lúc:</dt>
                  <dd class="text-gray-900">{formatDate(selectedOrder.paidAt)}</dd>
                </div>
              )}
              {selectedOrder.cancelledAt && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Hủy lúc:</dt>
                  <dd class="text-red-600">{formatDate(selectedOrder.cancelledAt)}</dd>
                </div>
              )}
              {selectedOrder.cancelReason && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Lý do hủy:</dt>
                  <dd class="text-red-600 text-right max-w-[200px]">{selectedOrder.cancelReason}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Order items */}
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Sản phẩm ({selectedOrder.items.length})</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-2 pr-4 font-medium text-gray-500">Sản phẩm</th>
                  <th class="text-center py-2 px-4 font-medium text-gray-500">Size</th>
                  <th class="text-center py-2 px-4 font-medium text-gray-500">Màu</th>
                  <th class="text-center py-2 px-4 font-medium text-gray-500">SL</th>
                  <th class="text-right py-2 px-4 font-medium text-gray-500">Đơn giá</th>
                  <th class="text-right py-2 pl-4 font-medium text-gray-500">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id} class="border-b border-gray-100">
                    <td class="py-3 pr-4">
                      <div class="flex items-center gap-3">
                        {item.productImage && (
                          <img src={item.productImage} alt="" class="w-10 h-10 rounded object-cover" />
                        )}
                        <span class="font-medium text-gray-900">{item.productName}</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-center text-gray-600">{item.size}</td>
                    <td class="py-3 px-4 text-center text-gray-600">{item.color}</td>
                    <td class="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                    <td class="py-3 px-4 text-right text-gray-600">{formatVND(item.price)}</td>
                    <td class="py-3 pl-4 text-right font-medium text-gray-900">{formatVND(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr class="border-t border-gray-200">
                  <td colSpan={5} class="py-2 text-right text-sm text-gray-500">Tạm tính:</td>
                  <td class="py-2 pl-4 text-right font-medium">{formatVND(selectedOrder.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={5} class="py-1 text-right text-sm text-gray-500">Phí vận chuyển:</td>
                  <td class="py-1 pl-4 text-right font-medium">{formatVND(selectedOrder.shippingFee)}</td>
                </tr>
                <tr class="border-t border-gray-300">
                  <td colSpan={5} class="py-2 text-right text-sm font-semibold text-gray-700">Tổng cộng:</td>
                  <td class="py-2 pl-4 text-right font-bold text-lg text-gray-900">{formatVND(selectedOrder.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Invoice section */}
        {selectedOrder.invoice && (
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Hóa đơn #{selectedOrder.invoice.invoiceNumber}
              </h3>
              <button
                onClick={() => handlePrintInvoice(selectedOrder.invoice!, selectedOrder)}
                class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                In hóa đơn
              </button>
            </div>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
              <div class="flex justify-between">
                <dt class="text-gray-500">Ngày xuất:</dt>
                <dd class="text-gray-900">{formatDate(selectedOrder.invoice.issuedAt)}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Thanh toán:</dt>
                <dd><StatusBadge status={selectedOrder.invoice.paymentStatus} map={PAYMENT_LABELS} colorMap={PAYMENT_COLORS} /></dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Tổng tiền:</dt>
                <dd class="font-bold text-gray-900">{formatVND(selectedOrder.invoice.total)}</dd>
              </div>
            </dl>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-2 font-medium text-gray-500">Sản phẩm</th>
                    <th class="text-center py-2 font-medium text-gray-500">SL</th>
                    <th class="text-right py-2 font-medium text-gray-500">Đơn giá</th>
                    <th class="text-right py-2 font-medium text-gray-500">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.invoice.items.map((item, i) => (
                    <tr key={i} class="border-b border-gray-100">
                      <td class="py-2 text-gray-900">{item.productName}</td>
                      <td class="py-2 text-center text-gray-600">{item.quantity}</td>
                      <td class="py-2 text-right text-gray-600">{formatVND(item.unitPrice)}</td>
                      <td class="py-2 text-right font-medium">{formatVND(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Return section */}
        {selectedOrder.returnInfo && (
          <div class="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
            <h3 class="text-sm font-semibold text-orange-700 uppercase tracking-wide mb-4">
              Yêu cầu trả hàng #{selectedOrder.returnInfo.returnNumber}
            </h3>
            <dl class="space-y-2 text-sm mb-4">
              <div class="flex justify-between">
                <dt class="text-gray-500">Trạng thái:</dt>
                <dd>
                  <span class={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedOrder.returnInfo.status === "requested" ? "bg-yellow-100 text-yellow-800"
                    : selectedOrder.returnInfo.status === "approved" ? "bg-blue-100 text-blue-800"
                    : selectedOrder.returnInfo.status === "completed" ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                  }`}>
                    {selectedOrder.returnInfo.status === "requested" ? "Chờ duyệt"
                      : selectedOrder.returnInfo.status === "approved" ? "Đã duyệt"
                      : selectedOrder.returnInfo.status === "completed" ? "Hoàn tất"
                      : "Từ chối"}
                  </span>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Lý do:</dt>
                <dd class="text-gray-900 text-right max-w-[300px]">{selectedOrder.returnInfo.reason}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Số tiền hoàn:</dt>
                <dd class="font-bold text-gray-900">{formatVND(selectedOrder.returnInfo.refundAmount)}</dd>
              </div>
              {selectedOrder.returnInfo.adminNote && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Ghi chú admin:</dt>
                  <dd class="text-gray-900 text-right max-w-[300px]">{selectedOrder.returnInfo.adminNote}</dd>
                </div>
              )}
              <div class="flex justify-between">
                <dt class="text-gray-500">Ngày tạo:</dt>
                <dd class="text-gray-900">{formatDate(selectedOrder.returnInfo.createdAt)}</dd>
              </div>
              {selectedOrder.returnInfo.resolvedAt && (
                <div class="flex justify-between">
                  <dt class="text-gray-500">Ngày xử lý:</dt>
                  <dd class="text-gray-900">{formatDate(selectedOrder.returnInfo.resolvedAt)}</dd>
                </div>
              )}
            </dl>

            {/* Return action buttons */}
            {selectedOrder.returnInfo.status === "requested" && (
              <div class="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    const note = prompt("Ghi chú (không bắt buộc):");
                    handleReturnAction(selectedOrder.returnInfo!.id, "approve", note || undefined);
                  }}
                  disabled={actionLoading}
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  Duyệt
                </button>
                <button
                  onClick={() => {
                    const note = prompt("Lý do từ chối:");
                    if (note) handleReturnAction(selectedOrder.returnInfo!.id, "reject", note);
                  }}
                  disabled={actionLoading}
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  Từ chối
                </button>
              </div>
            )}
            {selectedOrder.returnInfo.status === "approved" && (
              <div class="mt-4">
                <button
                  onClick={() => handleReturnAction(selectedOrder.returnInfo!.id, "complete")}
                  disabled={actionLoading}
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  Hoàn tất trả hàng & Hoàn tiền
                </button>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {selectedOrder.timeline.length > 0 && (
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Lịch sử đơn hàng</h3>
            <div class="space-y-4">
              {selectedOrder.timeline.map((entry) => (
                <div key={entry.id} class="flex gap-4">
                  <div class="flex flex-col items-center">
                    <div class="w-3 h-3 bg-indigo-500 rounded-full mt-1"></div>
                    <div class="w-px flex-1 bg-gray-200"></div>
                  </div>
                  <div class="pb-4">
                    <div class="flex items-center gap-2">
                      {entry.toStatus && (
                        <StatusBadge status={entry.toStatus} map={STATUS_LABELS} colorMap={STATUS_COLORS} />
                      )}
                      <span class="text-xs text-gray-400">{formatDate(entry.createdAt)}</span>
                    </div>
                    {entry.note && <p class="text-sm text-gray-600 mt-1">{entry.note}</p>}
                    <p class="text-xs text-gray-400 mt-0.5">bởi {entry.actorName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MODALS ── */}

        {/* Cancel modal */}
        {showCancelModal && (
          <Modal title="Hủy đơn hàng" onClose={() => setShowCancelModal(false)}>
            <div class="space-y-4">
              <p class="text-sm text-gray-600">Bạn có chắc muốn hủy đơn hàng #{selectedOrder.orderNumber}?</p>
              <textarea
                value={cancelReason}
                onInput={(e) => setCancelReason((e.target as HTMLTextAreaElement).value)}
                placeholder="Lý do hủy đơn (bắt buộc)"
                rows={3}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <div class="flex justify-end gap-2">
                <button onClick={() => setShowCancelModal(false)} class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Đóng
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason.trim() || actionLoading}
                  class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? "Đang xử lý..." : "Xác nhận hủy"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Carrier modal */}
        {showCarrierModal && (
          <Modal title="Gán đơn vị vận chuyển" onClose={() => setShowCarrierModal(false)}>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Đơn vị vận chuyển</label>
                <select
                  value={carrierForm.carrierId}
                  onChange={(e) => setCarrierForm({ ...carrierForm, carrierId: (e.target as HTMLSelectElement).value })}
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn ĐVVC --</option>
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mã vận đơn</label>
                <input
                  type="text"
                  value={carrierForm.trackingNumber}
                  onInput={(e) => setCarrierForm({ ...carrierForm, trackingNumber: (e.target as HTMLInputElement).value })}
                  placeholder="VD: GHTK123456789"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div class="flex justify-end gap-2">
                <button onClick={() => setShowCarrierModal(false)} class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Đóng
                </button>
                <button
                  onClick={handleAssignCarrier}
                  disabled={!carrierForm.carrierId || actionLoading}
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionLoading ? "Đang xử lý..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Return modal */}
        {showReturnModal && (
          <Modal title="Tạo yêu cầu trả hàng" onClose={() => setShowReturnModal(false)}>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Lý do trả hàng</label>
                <textarea
                  value={returnForm.reason}
                  onInput={(e) => setReturnForm({ ...returnForm, reason: (e.target as HTMLTextAreaElement).value })}
                  placeholder="Nhập lý do trả hàng"
                  rows={3}
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Số tiền hoàn (để trống = toàn bộ)</label>
                <input
                  type="number"
                  value={returnForm.refundAmount}
                  onInput={(e) => setReturnForm({ ...returnForm, refundAmount: (e.target as HTMLInputElement).value })}
                  placeholder={String(selectedOrder.total)}
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div class="flex justify-end gap-2">
                <button onClick={() => setShowReturnModal(false)} class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Đóng
                </button>
                <button
                  onClick={handleCreateReturn}
                  disabled={!returnForm.reason.trim() || actionLoading}
                  class="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
                >
                  {actionLoading ? "Đang xử lý..." : "Tạo yêu cầu"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Invoice confirm modal */}
        {showInvoiceModal && (
          <Modal title="Xuất hóa đơn" onClose={() => setShowInvoiceModal(false)}>
            <div class="space-y-4">
              <p class="text-sm text-gray-600">
                Xuất hóa đơn cho đơn hàng #{selectedOrder.orderNumber}?
              </p>
              <dl class="text-sm space-y-1 bg-gray-50 rounded-lg p-3">
                <div class="flex justify-between"><dt class="text-gray-500">Khách hàng:</dt><dd>{selectedOrder.customerName}</dd></div>
                <div class="flex justify-between"><dt class="text-gray-500">Tổng tiền:</dt><dd class="font-bold">{formatVND(selectedOrder.total)}</dd></div>
              </dl>
              <div class="flex justify-end gap-2">
                <button onClick={() => setShowInvoiceModal(false)} class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Đóng
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={actionLoading}
                  class="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
                >
                  {actionLoading ? "Đang xử lý..." : "Xuất hóa đơn"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ORDER LIST VIEW
  // ══════════════════════════════════════════════════════════

  return (
    <div class="space-y-6">
      {/* Messages */}
      {error && <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      {/* Quick Stats Cards */}
      {stats && (
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Tổng đơn hàng</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{stats.orderCount}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Doanh thu</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1">{formatVND(stats.totalRevenue)}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-yellow-200 p-4 bg-yellow-50">
            <p class="text-xs text-yellow-700 uppercase tracking-wide">Chờ xác nhận</p>
            <p class="text-2xl font-bold text-yellow-800 mt-1">{stats.pendingCount}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm border border-purple-200 p-4 bg-purple-50">
            <p class="text-xs text-purple-700 uppercase tracking-wide">Đang giao</p>
            <p class="text-2xl font-bold text-purple-800 mt-1">{stats.shippingCount}</p>
          </div>
        </div>
      )}

      {/* Search, Filter, Sort */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div class="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div class="flex-1">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onInput={(e) => handleSearch((e.target as HTMLInputElement).value)}
                placeholder="Tìm mã đơn, tên, SĐT, email..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilter((e.target as HTMLSelectElement).value)}
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Payment Status filter */}
          <select
            value={paymentStatusFilter}
            onChange={(e) => handlePaymentStatusFilter((e.target as HTMLSelectElement).value)}
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả TT thanh toán</option>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange((e.target as HTMLSelectElement).value)}
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="total_desc">Giá trị cao → thấp</option>
            <option value="total_asc">Giá trị thấp → cao</option>
          </select>

          {/* Toggle advanced filters */}
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

        {/* Advanced filters: Date range + actions */}
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
              {/* Quick date presets */}
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
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    handleDateFilter(weekAgo.toISOString().split("T")[0], today.toISOString().split("T")[0]);
                  }}
                  class="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  7 ngày
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today.getFullYear(), today.getMonth(), 1);
                    handleDateFilter(monthAgo.toISOString().split("T")[0], today.toISOString().split("T")[0]);
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

      {/* Status tabs + actions */}
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilter("")}
            class={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === "" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tất cả ({pagination.total})
          </button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleStatusFilter(key)}
            class={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === key ? "bg-indigo-600 text-white" : `${STATUS_COLORS[key]} hover:opacity-80`
            }`}
          >
            {label}
          </button>
        ))}
        </div>

        {/* Action buttons */}
        <div class="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exportLoading}
            class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exportLoading ? "Đang xuất..." : "Xuất CSV"}
          </button>
          <a
            href="/admin/reports"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-medium text-indigo-700 transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Báo cáo
          </a>
        </div>
      </div>

      {/* Orders table */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && (
          <div class="text-center py-8 text-gray-500">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
            <p class="mt-2 text-sm">Đang tải...</p>
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mt-3 text-sm">Không có đơn hàng nào</p>
          </div>
        )}
        {!loading && orders.length > 0 && (
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left py-3 px-4 font-medium text-gray-500">Mã đơn</th>
                  <th class="text-left py-3 px-4 font-medium text-gray-500">Khách hàng</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-500">Trạng thái</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-500">Thanh toán</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-500">ĐVVC</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-500">SP</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Tổng tiền</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-500">Ngày tạo</th>
                  <th class="text-center py-3 px-4 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} class="hover:bg-gray-50 cursor-pointer" onClick={() => openOrderDetail(order.id)}>
                    <td class="py-3 px-4">
                      <span class="font-mono font-medium text-indigo-600">{order.orderNumber}</span>
                    </td>
                    <td class="py-3 px-4">
                      <div>
                        <p class="font-medium text-gray-900">{order.customerName}</p>
                        <p class="text-xs text-gray-500">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <StatusBadge status={order.status} map={STATUS_LABELS} colorMap={STATUS_COLORS} />
                    </td>
                    <td class="py-3 px-4 text-center">
                      <StatusBadge status={order.paymentStatus} map={PAYMENT_LABELS} colorMap={PAYMENT_COLORS} />
                    </td>
                    <td class="py-3 px-4 text-center text-xs text-gray-500">
                      {order.carrierName || "-"}
                    </td>
                    <td class="py-3 px-4 text-center text-gray-600">{order.itemCount}</td>
                    <td class="py-3 px-4 text-right font-medium text-gray-900">{formatVND(order.total)}</td>
                    <td class="py-3 px-4 text-right text-gray-500 text-xs">{formatDateShort(order.createdAt)}</td>
                    <td class="py-3 px-4 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); openOrderDetail(order.id); }}
                        class="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Chi tiết
                      </button>
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
            Hiển thị {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} đơn hàng
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

      {/* Detail loading overlay */}
      {detailLoading && (
        <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div class="bg-white rounded-xl p-8 shadow-2xl">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
            <p class="mt-3 text-sm text-gray-600">Đang tải chi tiết...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal Component ──

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: preact.ComponentChildren }) {
  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        class="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
