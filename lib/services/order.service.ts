// lib/services/order.service.ts — Order creation & management
import { query, queryOne, transaction, execute } from "../../db/client.ts";
import type { CreateOrderInput } from "../validation.ts";

// ── Types ──

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  district: string;
  note: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  carrier: ShippingCarrier | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemResponse[];
  timeline?: OrderTimelineEntry[];
  invoice?: InvoiceResponse | null;
  returnInfo?: OrderReturnResponse | null;
}

export interface OrderItemResponse {
  id: string;
  productId: string | null;
  productName: string;
  productImage: string | null;
  price: number;
  size: string;
  color: string;
  quantity: number;
}

export interface OrderListItem {
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

export interface ShippingCarrier {
  id: string;
  name: string;
  code: string;
  trackingUrlTemplate: string | null;
  isActive: boolean;
}

export interface OrderTimelineEntry {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  note: string | null;
  issuedAt: string;
  paidAt: string | null;
  items?: InvoiceItemResponse[];
}

export interface InvoiceItemResponse {
  id: string;
  productName: string;
  productImage: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderReturnResponse {
  id: string;
  returnNumber: string;
  reason: string;
  status: string;
  refundAmount: number;
  refundMethod: string | null;
  adminNote: string | null;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
}

// ── Generate Order Number ──

async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const yearMonth =
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `AS-${yearMonth}-`;

  // Get the latest order number for this month
  const result = await queryOne<{ order_number: string }>(
    `SELECT order_number FROM orders
     WHERE order_number LIKE $1
     ORDER BY order_number DESC LIMIT 1`,
    [`${prefix}%`],
  );

  let seq = 1;
  if (result) {
    const lastSeq = parseInt(result.order_number.split("-").pop() || "0");
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// ── Create Order ──

export async function createOrder(
  input: CreateOrderInput,
  userId: string | null,
): Promise<OrderResponse> {
  return await transaction(async (tx) => {
    // 1. Validate each item against DB and get real prices
    let subtotal = 0;
    const validatedItems: {
      productId: string;
      productName: string;
      productImage: string | null;
      price: number;
      size: string;
      color: string;
      quantity: number;
    }[] = [];

    for (const item of input.items) {
      // Get product from DB
      const product = await tx.queryOne<{
        id: string;
        name: string;
        price: number;
        in_stock: boolean;
      }>(
        "SELECT id, name, price, in_stock FROM products WHERE id = $1",
        [item.productId],
      );

      if (!product) {
        throw new OrderError(
          `Sản phẩm không tồn tại: ${item.productId}`,
          "PRODUCT_NOT_FOUND",
          400,
        );
      }

      if (!product.in_stock) {
        throw new OrderError(
          `Sản phẩm đã hết hàng: ${product.name}`,
          "OUT_OF_STOCK",
          400,
        );
      }

      // Validate size exists
      const sizeExists = await tx.queryOne<{ size: string }>(
        "SELECT size FROM product_sizes WHERE product_id = $1 AND size = $2",
        [item.productId, item.size],
      );
      if (!sizeExists) {
        throw new OrderError(
          `Size "${item.size}" không có sẵn cho ${product.name}`,
          "INVALID_SIZE",
          400,
        );
      }

      // Validate color exists
      const colorExists = await tx.queryOne<{ name: string }>(
        "SELECT name FROM product_colors WHERE product_id = $1 AND name = $2",
        [item.productId, item.color],
      );
      if (!colorExists) {
        throw new OrderError(
          `Màu "${item.color}" không có sẵn cho ${product.name}`,
          "INVALID_COLOR",
          400,
        );
      }

      // Get first image
      const image = await tx.queryOne<{ url: string }>(
        "SELECT url FROM product_images WHERE product_id = $1 ORDER BY sort_order LIMIT 1",
        [item.productId],
      );

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        productImage: image?.url ?? null,
        price: product.price, // Price from DB, NOT from client!
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });

      subtotal += product.price * item.quantity;
    }

    // 2. Calculate shipping
    const freeThreshold = parseInt(
      Deno.env.get("FREE_SHIPPING_THRESHOLD") || "1000000",
    );
    const defaultShippingFee = parseInt(
      Deno.env.get("DEFAULT_SHIPPING_FEE") || "30000",
    );
    const shippingFee = subtotal >= freeThreshold ? 0 : defaultShippingFee;
    const total = subtotal + shippingFee;

    // 3. Generate order number
    const orderNumber = await generateOrderNumber();

    // 4. Insert order
    const order = await tx.queryOne<{
      id: string;
      order_number: string;
      status: string;
      created_at: string;
    }>(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, city, district, note, payment_method,
        subtotal, shipping_fee, total
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id, order_number, status, created_at`,
      [
        orderNumber,
        userId,
        input.customerName,
        input.customerEmail,
        input.customerPhone,
        input.shippingAddress,
        input.city,
        input.district,
        input.note || "",
        input.paymentMethod,
        subtotal,
        shippingFee,
        total,
      ],
    );

    if (!order) throw new Error("Failed to create order");

    // 5. Insert order items
    for (const item of validatedItems) {
      await tx.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, size, color, quantity)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          order.id,
          item.productId,
          item.productName,
          item.productImage,
          item.price,
          item.size,
          item.color,
          item.quantity,
        ],
      );
    }

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      shippingAddress: input.shippingAddress,
      city: input.city,
      district: input.district,
      note: input.note || "",
      paymentMethod: input.paymentMethod,
      subtotal,
      shippingFee,
      total,
      createdAt: order.created_at,
    };
  });
}

// ── Get Order by ID (enriched) ──

export async function getOrderById(
  id: string,
): Promise<OrderResponse | null> {
  const row = await queryOne<{
    id: string;
    order_number: string;
    user_id: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    city: string;
    district: string;
    note: string;
    payment_method: string;
    payment_status: string;
    status: string;
    subtotal: number;
    shipping_fee: number;
    total: number;
    carrier_id: string | null;
    tracking_number: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
    cancel_reason: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
  }>(
    "SELECT * FROM orders WHERE id = $1",
    [id],
  );

  if (!row) return null;

  const [items, timelineRows, carrierRows, invoiceRow, returnRow] = await Promise.all([
    query<{
      id: string;
      product_id: string | null;
      product_name: string;
      product_image: string | null;
      price: number;
      size: string;
      color: string;
      quantity: number;
    }>("SELECT * FROM order_items WHERE order_id = $1", [id]),

    query<{
      id: string;
      action: string;
      from_status: string | null;
      to_status: string | null;
      note: string | null;
      actor_name: string | null;
      created_at: string;
    }>("SELECT * FROM order_timeline WHERE order_id = $1 ORDER BY created_at ASC", [id]),

    row.carrier_id
      ? query<{
          id: string;
          name: string;
          code: string;
          tracking_url_template: string | null;
          is_active: boolean;
        }>("SELECT * FROM shipping_carriers WHERE id = $1", [row.carrier_id])
      : Promise.resolve([]),

    queryOne<{
      id: string;
      invoice_number: string;
      customer_name: string;
      customer_email: string | null;
      customer_phone: string | null;
      customer_address: string | null;
      subtotal: number;
      shipping_fee: number;
      discount: number;
      tax: number;
      total: number;
      payment_method: string;
      payment_status: string;
      note: string | null;
      issued_at: string;
      paid_at: string | null;
    }>("SELECT * FROM invoices WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1", [id]),

    queryOne<{
      id: string;
      return_number: string;
      reason: string;
      status: string;
      refund_amount: number;
      refund_method: string | null;
      admin_note: string | null;
      requested_at: string;
      approved_at: string | null;
      completed_at: string | null;
    }>("SELECT * FROM order_returns WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1", [id]),
  ]);

  const carrier = carrierRows[0]
    ? {
        id: carrierRows[0].id,
        name: carrierRows[0].name,
        code: carrierRows[0].code,
        trackingUrlTemplate: carrierRows[0].tracking_url_template,
        isActive: carrierRows[0].is_active,
      }
    : null;

  let invoice: InvoiceResponse | null = null;
  if (invoiceRow) {
    const invoiceItems = await query<{
      id: string;
      product_name: string;
      product_image: string | null;
      size: string | null;
      color: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>("SELECT * FROM invoice_items WHERE invoice_id = $1", [invoiceRow.id]);

    invoice = {
      id: invoiceRow.id,
      invoiceNumber: invoiceRow.invoice_number,
      orderId: id,
      customerName: invoiceRow.customer_name,
      customerEmail: invoiceRow.customer_email,
      customerPhone: invoiceRow.customer_phone,
      customerAddress: invoiceRow.customer_address,
      subtotal: invoiceRow.subtotal,
      shippingFee: invoiceRow.shipping_fee,
      discount: invoiceRow.discount,
      tax: invoiceRow.tax,
      total: invoiceRow.total,
      paymentMethod: invoiceRow.payment_method,
      paymentStatus: invoiceRow.payment_status,
      note: invoiceRow.note,
      issuedAt: invoiceRow.issued_at,
      paidAt: invoiceRow.paid_at,
      items: invoiceItems.map((i) => ({
        id: i.id,
        productName: i.product_name,
        productImage: i.product_image,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        totalPrice: i.total_price,
      })),
    };
  }

  const returnInfo: OrderReturnResponse | null = returnRow
    ? {
        id: returnRow.id,
        returnNumber: returnRow.return_number,
        reason: returnRow.reason,
        status: returnRow.status,
        refundAmount: returnRow.refund_amount,
        refundMethod: returnRow.refund_method,
        adminNote: returnRow.admin_note,
        requestedAt: returnRow.requested_at,
        approvedAt: returnRow.approved_at,
        completedAt: returnRow.completed_at,
      }
    : null;

  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    city: row.city,
    district: row.district,
    note: row.note,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    carrier,
    trackingNumber: row.tracking_number,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      productName: i.product_name,
      productImage: i.product_image,
      price: i.price,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
    })),
    timeline: timelineRows.map((t) => ({
      id: t.id,
      action: t.action,
      fromStatus: t.from_status,
      toStatus: t.to_status,
      note: t.note,
      actorName: t.actor_name,
      createdAt: t.created_at,
    })),
    invoice,
    returnInfo,
  };
}

// ── Get Orders by User ──

export async function getOrdersByUserId(
  userId: string,
): Promise<OrderListItem[]> {
  const rows = await query<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total: number;
    created_at: string;
    item_count: string;
  }>(
    `SELECT o.id, o.order_number, o.status, o.payment_status,
            o.customer_name, o.customer_email, o.customer_phone, o.total, o.created_at,
            (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
     FROM orders o WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId],
  );

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    status: r.status,
    paymentStatus: r.payment_status,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    total: r.total,
    itemCount: parseInt(r.item_count),
    carrierName: null,
    trackingNumber: null,
    createdAt: r.created_at,
  }));
}

// ── Get All Orders (Admin) ──

export async function getAllOrders(options: {
  status?: string;
  paymentStatus?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ data: OrderListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (options.status) {
    conditions.push(`o.status = $${paramIdx}`);
    params.push(options.status);
    paramIdx++;
  }

  if (options.paymentStatus) {
    conditions.push(`o.payment_status = $${paramIdx}`);
    params.push(options.paymentStatus);
    paramIdx++;
  }

  if (options.q) {
    conditions.push(
      `(o.order_number ILIKE $${paramIdx} OR o.customer_name ILIKE $${paramIdx} OR o.customer_phone ILIKE $${paramIdx} OR o.customer_email ILIKE $${paramIdx})`,
    );
    params.push(`%${options.q}%`);
    paramIdx++;
  }

  if (options.dateFrom) {
    conditions.push(`o.created_at >= $${paramIdx}::timestamptz`);
    params.push(options.dateFrom);
    paramIdx++;
  }

  if (options.dateTo) {
    conditions.push(`o.created_at <= ($${paramIdx}::date + interval '1 day')`);
    params.push(options.dateTo);
    paramIdx++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  // Sort
  let orderBy: string;
  switch (options.sort) {
    case "oldest":
      orderBy = "o.created_at ASC";
      break;
    case "total_asc":
      orderBy = "o.total ASC";
      break;
    case "total_desc":
      orderBy = "o.total DESC";
      break;
    default:
      orderBy = "o.created_at DESC";
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT count(*) FROM orders o ${whereClause}`,
    params,
  );
  const total = parseInt(countResult?.count || "0");

  const rows = await query<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total: number;
    created_at: string;
    item_count: string;
    carrier_name: string | null;
    tracking_number: string | null;
  }>(
    `SELECT o.id, o.order_number, o.status, o.payment_status,
            o.customer_name, o.customer_email, o.customer_phone, o.total, o.created_at,
            o.tracking_number,
            sc.name as carrier_name,
            (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
     FROM orders o
     LEFT JOIN shipping_carriers sc ON sc.id = o.carrier_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset],
  );

  return {
    data: rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      status: r.status,
      paymentStatus: r.payment_status,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      total: r.total,
      itemCount: parseInt(r.item_count),
      carrierName: r.carrier_name,
      trackingNumber: r.tracking_number,
      createdAt: r.created_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Update Order Status (enhanced with timeline) ──

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["delivered", "returning"],
  delivered: ["completed", "returning"],
  completed: [],
  cancelled: [],
  returning: ["returned", "delivered"],
  returned: [],
};

export async function updateOrderStatus(
  id: string,
  status: string,
  options?: { note?: string; actorId?: string; actorName?: string },
): Promise<OrderResponse | null> {
  const current = await queryOne<{ status: string }>(
    "SELECT status FROM orders WHERE id = $1",
    [id],
  );
  if (!current) return null;

  const allowed = VALID_TRANSITIONS[current.status] || [];
  if (!allowed.includes(status)) {
    throw new OrderError(
      `Không thể chuyển trạng thái từ '${current.status}' sang '${status}'`,
      "INVALID_STATUS_TRANSITION",
      400,
    );
  }

  // Build timestamp updates
  const setClauses = ["status = $1", "updated_at = NOW()"];
  const params: unknown[] = [status, id];
  let paramIdx = 3;
  if (status === "shipping") {
    setClauses.push(`shipped_at = NOW()`);
  } else if (status === "delivered") {
    setClauses.push(`delivered_at = NOW()`);
  } else if (status === "cancelled") {
    setClauses.push(`cancelled_at = NOW()`);
    if (options?.note) {
      setClauses.push(`cancel_reason = $${paramIdx}`);
      params.push(options.note);
      paramIdx++;
    }
  }

  await execute(
    `UPDATE orders SET ${setClauses.join(", ")} WHERE id = $2`,
    params,
  );

  // Add timeline entry
  await addTimelineEntry(id, `status_${status}`, current.status, status, options?.note || null, options?.actorId || null, options?.actorName || "Hệ thống");

  // ── Auto-workflows ──

  // COD auto-payment: When delivered, auto-mark COD orders as paid
  if (status === "delivered") {
    const orderInfo = await queryOne<{ payment_method: string; payment_status: string }>(
      "SELECT payment_method, payment_status FROM orders WHERE id = $1",
      [id],
    );
    if (orderInfo?.payment_method === "cod" && orderInfo.payment_status === "unpaid") {
      await execute(
        `UPDATE orders SET payment_status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id],
      );
      await addTimelineEntry(id, "payment_received", null, null, "Tự động xác nhận thanh toán COD khi giao hàng", null, "Hệ thống");
    }
  }

  // Auto-invoice: When completed, auto-generate invoice if not exists
  if (status === "completed") {
    const existingInvoice = await queryOne<{ id: string }>("SELECT id FROM invoices WHERE order_id = $1", [id]);
    if (!existingInvoice) {
      try {
        await createInvoice(id, options?.actorId, options?.actorName || "Hệ thống");
      } catch {
        // Invoice creation failure should not block status update
        console.error("Auto-invoice creation failed for order:", id);
      }
    }
  }

  return getOrderById(id);
}

// ── Cancel Order ──

export async function cancelOrder(
  id: string,
  reason: string,
  actorId?: string,
  actorName?: string,
): Promise<OrderResponse | null> {
  return updateOrderStatus(id, "cancelled", {
    note: reason,
    actorId,
    actorName,
  });
}

// ── Assign Shipping Carrier ──

export async function assignCarrier(
  orderId: string,
  carrierId: string,
  trackingNumber?: string,
  actorId?: string,
  actorName?: string,
): Promise<OrderResponse | null> {
  const carrier = await queryOne<{ name: string }>(
    "SELECT name FROM shipping_carriers WHERE id = $1 AND is_active = true",
    [carrierId],
  );
  if (!carrier) {
    throw new OrderError("Đơn vị vận chuyển không hợp lệ", "INVALID_CARRIER", 400);
  }

  await execute(
    `UPDATE orders SET carrier_id = $1, tracking_number = $2, updated_at = NOW() WHERE id = $3`,
    [carrierId, trackingNumber || null, orderId],
  );

  await addTimelineEntry(
    orderId,
    "carrier_assigned",
    null,
    null,
    `Gán đơn vị vận chuyển: ${carrier.name}${trackingNumber ? ` (${trackingNumber})` : ""}`,
    actorId || null,
    actorName || "Hệ thống",
  );

  return getOrderById(orderId);
}

// ── Mark Order as Paid ──

export async function markOrderPaid(
  orderId: string,
  actorId?: string,
  actorName?: string,
): Promise<OrderResponse | null> {
  await execute(
    `UPDATE orders SET payment_status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [orderId],
  );

  // Sync invoice payment status
  await execute(
    `UPDATE invoices SET payment_status = 'paid', paid_at = NOW() WHERE order_id = $1 AND payment_status = 'unpaid'`,
    [orderId],
  );

  await addTimelineEntry(orderId, "payment_received", null, null, "Đã nhận thanh toán", actorId || null, actorName || "Hệ thống");

  // Auto-complete: If order is "delivered" + now paid → auto-complete
  const order = await queryOne<{ status: string }>("SELECT status FROM orders WHERE id = $1", [orderId]);
  if (order?.status === "delivered") {
    await execute(
      `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [orderId],
    );
    await addTimelineEntry(orderId, "status_completed", "delivered", "completed", "Tự động hoàn thành: đã giao + đã thanh toán", null, "Hệ thống");

    // Auto-invoice on completion
    const existingInvoice = await queryOne<{ id: string }>("SELECT id FROM invoices WHERE order_id = $1", [orderId]);
    if (!existingInvoice) {
      try {
        await createInvoice(orderId, actorId, actorName || "Hệ thống");
      } catch {
        console.error("Auto-invoice creation failed for order:", orderId);
      }
    }
  }

  return getOrderById(orderId);
}

// ── Add Timeline Entry ──

export async function addTimelineEntry(
  orderId: string,
  action: string,
  fromStatus: string | null,
  toStatus: string | null,
  note: string | null,
  actorId: string | null,
  actorName: string,
): Promise<void> {
  await execute(
    `INSERT INTO order_timeline (order_id, action, from_status, to_status, note, actor_id, actor_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [orderId, action, fromStatus, toStatus, note, actorId, actorName],
  );
}

// ── Get Shipping Carriers ──

export async function getShippingCarriers(onlyActive = true): Promise<ShippingCarrier[]> {
  const whereClause = onlyActive ? "WHERE is_active = true" : "";
  const rows = await query<{
    id: string;
    name: string;
    code: string;
    tracking_url_template: string | null;
    is_active: boolean;
  }>(`SELECT id, name, code, tracking_url_template, is_active FROM shipping_carriers ${whereClause} ORDER BY name`);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    trackingUrlTemplate: r.tracking_url_template,
    isActive: r.is_active,
  }));
}

// ── Generate Invoice Number ──

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const prefix = `INV${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const latest = await queryOne<{ invoice_number: string }>(
    `SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY invoice_number DESC LIMIT 1`,
    [`${prefix}%`],
  );
  if (!latest) return `${prefix}0001`;
  const seq = parseInt(latest.invoice_number.replace(prefix, "")) + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// ── Create Invoice ──

export async function createInvoice(
  orderId: string,
  actorId?: string,
  actorName?: string,
): Promise<InvoiceResponse> {
  // Check no existing invoice
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM invoices WHERE order_id = $1",
    [orderId],
  );
  if (existing) {
    throw new OrderError("Đơn hàng đã có hóa đơn", "INVOICE_EXISTS", 400);
  }

  // Get order
  const order = await queryOne<{
    id: string;
    order_number: string;
    status: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    subtotal: number;
    shipping_fee: number;
    total: number;
    payment_method: string;
    payment_status: string;
  }>("SELECT id, order_number, status, customer_name, customer_email, customer_phone, shipping_address, subtotal, shipping_fee, total, payment_method, payment_status FROM orders WHERE id = $1", [orderId]);

  if (!order) {
    throw new OrderError("Đơn hàng không tồn tại", "ORDER_NOT_FOUND", 404);
  }

  // Only allow invoice for confirmed+ orders (not pending/cancelled)
  if (["pending", "cancelled"].includes(order.status)) {
    throw new OrderError("Không thể xuất hóa đơn cho đơn hàng ở trạng thái này", "INVALID_ORDER_STATUS", 400);
  }

  const items = await query<{
    product_name: string;
    quantity: number;
    price: number;
  }>("SELECT product_name, quantity, price FROM order_items WHERE order_id = $1", [orderId]);

  const invoiceNumber = await generateInvoiceNumber();

  return await transaction(async (tx) => {
    const inv = await tx.queryOne<{ id: string; created_at: string }>(
      `INSERT INTO invoices (order_id, invoice_number, customer_name, customer_email, customer_phone, customer_address, subtotal, shipping_fee, tax, total, payment_method, payment_status, issued_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, NOW())
       RETURNING id, created_at`,
      [
        orderId,
        invoiceNumber,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.shipping_address,
        order.subtotal,
        order.shipping_fee,
        order.total,
        order.payment_method || 'cod',
        order.payment_status,
      ],
    );

    if (!inv) throw new OrderError("Lỗi tạo hóa đơn", "INVOICE_CREATE_ERROR", 500);

    // Insert invoice items
    for (const item of items) {
      await tx.execute(
        `INSERT INTO invoice_items (invoice_id, product_name, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [inv.id, item.product_name, item.quantity, item.price, item.quantity * item.price],
      );
    }

    // Timeline entry
    await addTimelineEntry(orderId, "invoice_created", null, null, `Xuất hóa đơn ${invoiceNumber}`, actorId || null, actorName || "Hệ thống");

    return {
      id: inv.id,
      invoiceNumber,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      shippingAddress: order.shipping_address,
      subtotal: order.subtotal,
      shippingFee: order.shipping_fee,
      tax: 0,
      total: order.total,
      paymentStatus: order.payment_status,
      issuedAt: inv.created_at,
      items: items.map((i) => ({
        productName: i.product_name,
        quantity: i.quantity,
        unitPrice: i.price,
        total: i.quantity * i.price,
      })),
    };
  });
}

// ── Generate Return Number ──

async function generateReturnNumber(): Promise<string> {
  const now = new Date();
  const prefix = `RET${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const latest = await queryOne<{ return_number: string }>(
    `SELECT return_number FROM order_returns WHERE return_number LIKE $1 ORDER BY return_number DESC LIMIT 1`,
    [`${prefix}%`],
  );
  if (!latest) return `${prefix}0001`;
  const seq = parseInt(latest.return_number.replace(prefix, "")) + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// ── Create Return Request ──

export async function createReturn(
  orderId: string,
  reason: string,
  refundAmount?: number,
  actorId?: string,
  actorName?: string,
): Promise<OrderReturnResponse> {
  const order = await queryOne<{ id: string; status: string; total: number }>(
    "SELECT id, status, total FROM orders WHERE id = $1",
    [orderId],
  );
  if (!order) throw new OrderError("Đơn hàng không tồn tại", "ORDER_NOT_FOUND", 404);

  if (!["delivered", "completed", "shipping"].includes(order.status)) {
    throw new OrderError("Không thể tạo yêu cầu trả hàng cho đơn hàng ở trạng thái này", "INVALID_ORDER_STATUS", 400);
  }

  // Check existing pending/approved return
  const existingReturn = await queryOne<{ id: string }>(
    "SELECT id FROM order_returns WHERE order_id = $1 AND status IN ('requested', 'approved')",
    [orderId],
  );
  if (existingReturn) {
    throw new OrderError("Đơn hàng đã có yêu cầu trả hàng đang xử lý", "RETURN_EXISTS", 400);
  }

  const returnNumber = await generateReturnNumber();
  const amount = refundAmount ?? order.total;

  const row = await queryOne<{ id: string; created_at: string }>(
    `INSERT INTO order_returns (order_id, return_number, reason, refund_amount)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [orderId, returnNumber, reason, amount],
  );

  if (!row) throw new OrderError("Lỗi tạo yêu cầu trả hàng", "RETURN_CREATE_ERROR", 500);

  // Update order status to returning
  await execute("UPDATE orders SET status = 'returning', updated_at = NOW() WHERE id = $1", [orderId]);
  await addTimelineEntry(orderId, "return_requested", null, null, `Yêu cầu trả hàng: ${reason}`, actorId || null, actorName || "Hệ thống");

  return {
    id: row.id,
    returnNumber,
    reason,
    status: "requested",
    refundAmount: amount,
    refundMethod: null,
    adminNote: null,
    requestedAt: row.created_at,
    approvedAt: null,
    completedAt: null,
  };
}

// ── Approve Return ──

export async function approveReturn(
  returnId: string,
  adminNote?: string,
  actorId?: string,
  actorName?: string,
): Promise<OrderReturnResponse> {
  const ret = await queryOne<{ id: string; order_id: string; return_number: string; reason: string; refund_amount: number; status: string; created_at: string }>(
    "SELECT id, order_id, return_number, reason, refund_amount, status, created_at FROM order_returns WHERE id = $1",
    [returnId],
  );
  if (!ret) throw new OrderError("Yêu cầu trả hàng không tồn tại", "RETURN_NOT_FOUND", 404);
  if (ret.status !== "requested") throw new OrderError("Yêu cầu trả hàng không ở trạng thái chờ duyệt", "INVALID_RETURN_STATUS", 400);

  await execute(
    `UPDATE order_returns SET status = 'approved', admin_note = $1, approved_at = NOW() WHERE id = $2`,
    [adminNote || null, returnId],
  );

  await addTimelineEntry(ret.order_id, "return_approved", null, null, adminNote || "Duyệt yêu cầu trả hàng", actorId || null, actorName || "Admin");

  return {
    id: ret.id,
    returnNumber: ret.return_number,
    reason: ret.reason,
    status: "approved",
    refundAmount: ret.refund_amount,
    refundMethod: null,
    adminNote: adminNote || null,
    requestedAt: ret.created_at,
    approvedAt: new Date().toISOString(),
    completedAt: null,
  };
}

// ── Complete Return (mark as returned + refund) ──

export async function completeReturn(
  returnId: string,
  actorId?: string,
  actorName?: string,
): Promise<OrderReturnResponse> {
  const ret = await queryOne<{ id: string; order_id: string; return_number: string; reason: string; refund_amount: number; status: string; admin_note: string | null; created_at: string }>(
    "SELECT id, order_id, return_number, reason, refund_amount, status, admin_note, created_at FROM order_returns WHERE id = $1",
    [returnId],
  );
  if (!ret) throw new OrderError("Yêu cầu trả hàng không tồn tại", "RETURN_NOT_FOUND", 404);
  if (ret.status !== "approved") throw new OrderError("Yêu cầu trả hàng chưa được duyệt", "INVALID_RETURN_STATUS", 400);

  const now = new Date().toISOString();
  await execute(
    `UPDATE order_returns SET status = 'completed', completed_at = NOW() WHERE id = $1`,
    [returnId],
  );

  // Update order status + payment status
  await execute(
    `UPDATE orders SET status = 'returned', payment_status = 'refunded', updated_at = NOW() WHERE id = $1`,
    [ret.order_id],
  );

  // Sync invoice payment status to refunded
  await execute(
    `UPDATE invoices SET payment_status = 'refunded' WHERE order_id = $1`,
    [ret.order_id],
  );

  await addTimelineEntry(ret.order_id, "return_completed", "returning", "returned", `Hoàn tất trả hàng, hoàn tiền ${ret.refund_amount.toLocaleString()}đ`, actorId || null, actorName || "Admin");

  return {
    id: ret.id,
    returnNumber: ret.return_number,
    reason: ret.reason,
    status: "completed",
    refundAmount: ret.refund_amount,
    refundMethod: null,
    adminNote: ret.admin_note,
    requestedAt: ret.created_at,
    approvedAt: null,
    completedAt: now,
  };
}

// ── Reject Return ──

export async function rejectReturn(
  returnId: string,
  adminNote: string,
  actorId?: string,
  actorName?: string,
): Promise<OrderReturnResponse> {
  const ret = await queryOne<{ id: string; order_id: string; return_number: string; reason: string; refund_amount: number; status: string; created_at: string }>(
    "SELECT id, order_id, return_number, reason, refund_amount, status, created_at FROM order_returns WHERE id = $1",
    [returnId],
  );
  if (!ret) throw new OrderError("Yêu cầu trả hàng không tồn tại", "RETURN_NOT_FOUND", 404);
  if (ret.status !== "requested") throw new OrderError("Yêu cầu trả hàng không ở trạng thái chờ duyệt", "INVALID_RETURN_STATUS", 400);

  await execute(
    `UPDATE order_returns SET status = 'rejected', admin_note = $1, completed_at = NOW() WHERE id = $2`,
    [adminNote, returnId],
  );

  // Revert order status to delivered (or previous)
  const order = await queryOne<{ status: string }>("SELECT status FROM orders WHERE id = $1", [ret.order_id]);
  if (order?.status === "returning") {
    await execute("UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = $1", [ret.order_id]);
  }

  await addTimelineEntry(ret.order_id, "return_rejected", null, null, adminNote, actorId || null, actorName || "Admin");

  return {
    id: ret.id,
    returnNumber: ret.return_number,
    reason: ret.reason,
    status: "rejected",
    refundAmount: ret.refund_amount,
    refundMethod: null,
    adminNote: adminNote,
    requestedAt: ret.created_at,
    approvedAt: null,
    completedAt: new Date().toISOString(),
  };
}

// ── Get Order Owner ──

export async function getOrderOwner(
  orderId: string,
): Promise<string | null> {
  const row = await queryOne<{ user_id: string | null }>(
    "SELECT user_id FROM orders WHERE id = $1",
    [orderId],
  );
  return row?.user_id ?? null;
}

// ── Admin Dashboard Stats ──

export async function getDashboardStats(): Promise<{
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrders: number;
}> {
  const [totalResult, pendingResult, revenueResult, todayResult] =
    await Promise.all([
      queryOne<{ count: string }>("SELECT count(*) FROM orders"),
      queryOne<{ count: string }>(
        "SELECT count(*) FROM orders WHERE status = 'pending'",
      ),
      queryOne<{ total: string }>(
        "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status NOT IN ('cancelled', 'returned')",
      ),
      queryOne<{ count: string }>(
        "SELECT count(*) FROM orders WHERE created_at >= CURRENT_DATE",
      ),
    ]);

  return {
    totalOrders: parseInt(totalResult?.count || "0"),
    pendingOrders: parseInt(pendingResult?.count || "0"),
    totalRevenue: parseInt(revenueResult?.total || "0"),
    todayOrders: parseInt(todayResult?.count || "0"),
  };
}

// ── Business Reports ──

export interface RevenueByPeriod {
  period: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  refunds: number;
  netRevenue: number;
  avgOrderValue: number;
}

export interface TopProduct {
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface BusinessReportData {
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

export async function getBusinessReport(
  dateFrom?: string,
  dateTo?: string,
): Promise<BusinessReportData> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (dateFrom) {
    conditions.push(`o.created_at >= $${paramIdx}::timestamptz`);
    params.push(dateFrom);
    paramIdx++;
  }
  if (dateTo) {
    conditions.push(`o.created_at <= ($${paramIdx}::date + interval '1 day')`);
    params.push(dateTo);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const andClause = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  // Summary stats
  const [
    totalResult,
    completedResult,
    cancelledResult,
    returnedResult,
    revenueResult,
    refundResult,
    itemsSoldResult,
    invoicesResult,
    shippingResult,
  ] = await Promise.all([
    queryOne<{ count: string }>(`SELECT count(*) FROM orders o ${whereClause}`, params),
    queryOne<{ count: string }>(`SELECT count(*) FROM orders o ${whereClause ? whereClause + " AND" : "WHERE"} o.status IN ('completed', 'delivered')`, params),
    queryOne<{ count: string }>(`SELECT count(*) FROM orders o ${whereClause ? whereClause + " AND" : "WHERE"} o.status = 'cancelled'`, params),
    queryOne<{ count: string }>(`SELECT count(*) FROM orders o ${whereClause ? whereClause + " AND" : "WHERE"} o.status = 'returned'`, params),
    queryOne<{ total: string }>(`SELECT COALESCE(SUM(o.total), 0) as total FROM orders o ${whereClause ? whereClause + " AND" : "WHERE"} o.status NOT IN ('cancelled', 'returned')`, params),
    queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(r.refund_amount), 0) as total FROM order_returns r
       JOIN orders o ON o.id = r.order_id
       WHERE r.status = 'completed' ${andClause}`,
      params,
    ),
    queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(oi.quantity), 0) as total FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       ${whereClause ? whereClause + " AND" : "WHERE"} o.status NOT IN ('cancelled', 'returned')`,
      params,
    ),
    queryOne<{ count: string }>(
      `SELECT count(*) FROM invoices inv
       JOIN orders o ON o.id = inv.order_id
       ${whereClause}`,
      params,
    ),
    queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(o.shipping_fee), 0) as total FROM orders o ${whereClause ? whereClause + " AND" : "WHERE"} o.status NOT IN ('cancelled', 'returned')`,
      params,
    ),
  ]);

  const totalOrders = parseInt(totalResult?.count || "0");
  const completedOrders = parseInt(completedResult?.count || "0");
  const revenue = parseInt(revenueResult?.total || "0");
  const refunds = parseInt(refundResult?.total || "0");

  const summary = {
    totalOrders,
    completedOrders,
    cancelledOrders: parseInt(cancelledResult?.count || "0"),
    returnedOrders: parseInt(returnedResult?.count || "0"),
    totalRevenue: revenue,
    totalRefunds: refunds,
    netRevenue: revenue - refunds,
    avgOrderValue: totalOrders > 0 ? Math.round(revenue / totalOrders) : 0,
    totalItemsSold: parseInt(itemsSoldResult?.total || "0"),
    totalInvoices: parseInt(invoicesResult?.count || "0"),
    totalShippingFees: parseInt(shippingResult?.total || "0"),
  };

  // Revenue by month
  const monthlyRows = await query<{
    period: string;
    total_orders: string;
    completed_orders: string;
    cancelled_orders: string;
    revenue: string;
    avg_value: string;
  }>(
    `SELECT
       TO_CHAR(o.created_at, 'YYYY-MM') as period,
       COUNT(*) as total_orders,
       COUNT(*) FILTER (WHERE o.status IN ('completed', 'delivered')) as completed_orders,
       COUNT(*) FILTER (WHERE o.status = 'cancelled') as cancelled_orders,
       COALESCE(SUM(o.total) FILTER (WHERE o.status NOT IN ('cancelled', 'returned')), 0) as revenue,
       COALESCE(AVG(o.total) FILTER (WHERE o.status NOT IN ('cancelled', 'returned')), 0) as avg_value
     FROM orders o
     ${whereClause}
     GROUP BY period
     ORDER BY period DESC
     LIMIT 12`,
    params,
  );

  const revenueByMonth: RevenueByPeriod[] = monthlyRows.map((r) => ({
    period: r.period,
    totalOrders: parseInt(r.total_orders),
    completedOrders: parseInt(r.completed_orders),
    cancelledOrders: parseInt(r.cancelled_orders),
    revenue: parseInt(r.revenue),
    refunds: 0,
    netRevenue: parseInt(r.revenue),
    avgOrderValue: Math.round(parseFloat(r.avg_value)),
  }));

  // Revenue by day (last 30 days)
  const dailyRows = await query<{
    period: string;
    total_orders: string;
    completed_orders: string;
    cancelled_orders: string;
    revenue: string;
    avg_value: string;
  }>(
    `SELECT
       TO_CHAR(o.created_at, 'YYYY-MM-DD') as period,
       COUNT(*) as total_orders,
       COUNT(*) FILTER (WHERE o.status IN ('completed', 'delivered')) as completed_orders,
       COUNT(*) FILTER (WHERE o.status = 'cancelled') as cancelled_orders,
       COALESCE(SUM(o.total) FILTER (WHERE o.status NOT IN ('cancelled', 'returned')), 0) as revenue,
       COALESCE(AVG(o.total) FILTER (WHERE o.status NOT IN ('cancelled', 'returned')), 0) as avg_value
     FROM orders o
     ${whereClause ? whereClause + " AND" : "WHERE"} o.created_at >= CURRENT_DATE - interval '30 days'
     GROUP BY period
     ORDER BY period DESC`,
    params,
  );

  const revenueByDay: RevenueByPeriod[] = dailyRows.map((r) => ({
    period: r.period,
    totalOrders: parseInt(r.total_orders),
    completedOrders: parseInt(r.completed_orders),
    cancelledOrders: parseInt(r.cancelled_orders),
    revenue: parseInt(r.revenue),
    refunds: 0,
    netRevenue: parseInt(r.revenue),
    avgOrderValue: Math.round(parseFloat(r.avg_value)),
  }));

  // Top products
  const topProductRows = await query<{
    product_name: string;
    total_quantity: string;
    total_revenue: string;
  }>(
    `SELECT oi.product_name, SUM(oi.quantity) as total_quantity, SUM(oi.price * oi.quantity) as total_revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     ${whereClause ? whereClause + " AND" : "WHERE"} o.status NOT IN ('cancelled', 'returned')
     GROUP BY oi.product_name
     ORDER BY total_revenue DESC
     LIMIT 10`,
    params,
  );

  const topProducts: TopProduct[] = topProductRows.map((r) => ({
    productName: r.product_name,
    totalQuantity: parseInt(r.total_quantity),
    totalRevenue: parseInt(r.total_revenue),
  }));

  // Status breakdown
  const statusRows = await query<{ status: string; count: string }>(
    `SELECT o.status, COUNT(*) as count FROM orders o ${whereClause} GROUP BY o.status`,
    params,
  );
  const statusBreakdown: Record<string, number> = {};
  for (const r of statusRows) statusBreakdown[r.status] = parseInt(r.count);

  // Payment method breakdown
  const pmRows = await query<{ payment_method: string; count: string }>(
    `SELECT o.payment_method, COUNT(*) as count FROM orders o ${whereClause} GROUP BY o.payment_method`,
    params,
  );
  const paymentMethodBreakdown: Record<string, number> = {};
  for (const r of pmRows) paymentMethodBreakdown[r.payment_method] = parseInt(r.count);

  // Payment status breakdown
  const psRows = await query<{ payment_status: string; count: string }>(
    `SELECT o.payment_status, COUNT(*) as count FROM orders o ${whereClause} GROUP BY o.payment_status`,
    params,
  );
  const paymentStatusBreakdown: Record<string, number> = {};
  for (const r of psRows) paymentStatusBreakdown[r.payment_status] = parseInt(r.count);

  // Carrier breakdown
  const carrierRows = await query<{ carrier_name: string; count: string }>(
    `SELECT COALESCE(sc.name, 'Chưa gán') as carrier_name, COUNT(*) as count
     FROM orders o LEFT JOIN shipping_carriers sc ON sc.id = o.carrier_id
     ${whereClause}
     GROUP BY carrier_name`,
    params,
  );
  const carrierBreakdown: Record<string, number> = {};
  for (const r of carrierRows) carrierBreakdown[r.carrier_name] = parseInt(r.count);

  // City breakdown
  const cityRows = await query<{ city: string; count: string }>(
    `SELECT o.city, COUNT(*) as count FROM orders o ${whereClause} GROUP BY o.city ORDER BY count DESC LIMIT 10`,
    params,
  );
  const cityBreakdown: Record<string, number> = {};
  for (const r of cityRows) cityBreakdown[r.city] = parseInt(r.count);

  return {
    summary,
    revenueByMonth,
    revenueByDay,
    topProducts,
    statusBreakdown,
    paymentMethodBreakdown,
    paymentStatusBreakdown,
    carrierBreakdown,
    cityBreakdown,
  };
}

// ── Get All Invoices (for accounting) ──

export interface InvoiceListItem {
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

export async function getAllInvoices(options: {
  page?: number;
  limit?: number;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
}): Promise<{ data: InvoiceListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (options.paymentStatus) {
    conditions.push(`inv.payment_status = $${paramIdx}`);
    params.push(options.paymentStatus);
    paramIdx++;
  }
  if (options.dateFrom) {
    conditions.push(`inv.issued_at >= $${paramIdx}::timestamptz`);
    params.push(options.dateFrom);
    paramIdx++;
  }
  if (options.dateTo) {
    conditions.push(`inv.issued_at <= ($${paramIdx}::date + interval '1 day')`);
    params.push(options.dateTo);
    paramIdx++;
  }
  if (options.q) {
    conditions.push(`(inv.invoice_number ILIKE $${paramIdx} OR inv.customer_name ILIKE $${paramIdx} OR o.order_number ILIKE $${paramIdx})`);
    params.push(`%${options.q}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await queryOne<{ count: string }>(
    `SELECT count(*) FROM invoices inv JOIN orders o ON o.id = inv.order_id ${whereClause}`,
    params,
  );
  const total = parseInt(countResult?.count || "0");

  const rows = await query<{
    id: string;
    invoice_number: string;
    order_number: string;
    customer_name: string;
    total: number;
    payment_status: string;
    payment_method: string;
    issued_at: string;
    paid_at: string | null;
  }>(
    `SELECT inv.id, inv.invoice_number, o.order_number, inv.customer_name,
            inv.total, inv.payment_status, inv.payment_method, inv.issued_at, inv.paid_at
     FROM invoices inv
     JOIN orders o ON o.id = inv.order_id
     ${whereClause}
     ORDER BY inv.issued_at DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset],
  );

  return {
    data: rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      orderNumber: r.order_number,
      customerName: r.customer_name,
      total: r.total,
      paymentStatus: r.payment_status,
      paymentMethod: r.payment_method,
      issuedAt: r.issued_at,
      paidAt: r.paid_at,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ── Export orders as CSV data ──

export async function exportOrdersCSV(options: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<string> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (options.status) {
    conditions.push(`o.status = $${paramIdx}`);
    params.push(options.status);
    paramIdx++;
  }
  if (options.dateFrom) {
    conditions.push(`o.created_at >= $${paramIdx}::timestamptz`);
    params.push(options.dateFrom);
    paramIdx++;
  }
  if (options.dateTo) {
    conditions.push(`o.created_at <= ($${paramIdx}::date + interval '1 day')`);
    params.push(options.dateTo);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await query<{
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    city: string;
    district: string;
    status: string;
    payment_status: string;
    payment_method: string;
    subtotal: number;
    shipping_fee: number;
    total: number;
    carrier_name: string | null;
    tracking_number: string | null;
    created_at: string;
  }>(
    `SELECT o.order_number, o.customer_name, o.customer_email, o.customer_phone,
            o.shipping_address, o.city, o.district, o.status, o.payment_status,
            o.payment_method, o.subtotal, o.shipping_fee, o.total,
            sc.name as carrier_name, o.tracking_number, o.created_at
     FROM orders o
     LEFT JOIN shipping_carriers sc ON sc.id = o.carrier_id
     ${whereClause}
     ORDER BY o.created_at DESC`,
    params,
  );

  const header = "Mã đơn,Khách hàng,Email,SĐT,Địa chỉ,Quận/Huyện,Thành phố,Trạng thái,Thanh toán,Phương thức TT,Tạm tính,Phí ship,Tổng cộng,ĐVVC,Mã vận đơn,Ngày tạo";
  const lines = rows.map((r) =>
    [
      r.order_number,
      `"${r.customer_name}"`,
      r.customer_email,
      r.customer_phone,
      `"${r.shipping_address}"`,
      `"${r.district}"`,
      `"${r.city}"`,
      r.status,
      r.payment_status,
      r.payment_method,
      r.subtotal,
      r.shipping_fee,
      r.total,
      r.carrier_name || "",
      r.tracking_number || "",
      r.created_at,
    ].join(","),
  );

  return "\uFEFF" + [header, ...lines].join("\n");
}

// ── Order Error ──

export class OrderError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
