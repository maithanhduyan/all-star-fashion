import { useState } from "preact/hooks";

interface Props {
  orderId: string;
  currentStatus: string;
}

const STATUS_FLOW: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Xác nhận",
  shipping: "Giao hàng",
  delivered: "Đã giao",
  cancelled: "Hủy đơn",
};

export default function AdminOrderActions({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const nextStatuses = STATUS_FLOW[status] || [];

  const handleUpdate = async (newStatus: string) => {
    if (loading) return;
    if (newStatus === "cancelled" && !confirm("Xác nhận hủy đơn hàng này?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
      } else {
        const data = await res.json();
        alert(data.error || "Cập nhật thất bại");
      }
    } catch {
      alert("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  if (nextStatuses.length === 0) {
    return <span class="text-xs text-brand-gray">—</span>;
  }

  return (
    <div class="flex gap-1.5">
      {nextStatuses.map((ns) => (
        <button
          key={ns}
          onClick={() => handleUpdate(ns)}
          disabled={loading}
          class={`text-xs px-2 py-1 border transition-colors ${
            ns === "cancelled"
              ? "border-red-300 text-red-600 hover:bg-red-50"
              : "border-brand-light-gray hover:border-brand-black hover:bg-brand-black hover:text-white"
          } ${loading ? "opacity-50 cursor-wait" : ""}`}
        >
          {STATUS_LABELS[ns] || ns}
        </button>
      ))}
    </div>
  );
}
