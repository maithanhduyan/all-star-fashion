// lib/services/order.service.ts — Order creation & management
import { query, queryOne, transaction, execute } from "../../db/client.ts";
import type { CreateOrderInput } from "../validation.ts";

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
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  items?: OrderItemResponse[];
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
  customerName: string;
  customerPhone: string;
  total: number;
  itemCount: number;
  createdAt: string;
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

// ── Get Order by ID ──

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
    status: string;
    subtotal: number;
    shipping_fee: number;
    total: number;
    created_at: string;
  }>(
    "SELECT * FROM orders WHERE id = $1",
    [id],
  );

  if (!row) return null;

  const items = await query<{
    id: string;
    product_id: string | null;
    product_name: string;
    product_image: string | null;
    price: number;
    size: string;
    color: string;
    quantity: number;
  }>(
    "SELECT * FROM order_items WHERE order_id = $1",
    [id],
  );

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
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    createdAt: row.created_at,
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
    total: number;
    created_at: string;
    item_count: string;
  }>(
    `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
            (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
     FROM orders o WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId],
  );

  return rows.map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    status: r.status,
    total: r.total,
    itemCount: parseInt(r.item_count),
    createdAt: r.created_at,
  }));
}

// ── Get All Orders (Admin) ──

export async function getAllOrders(options: {
  status?: string;
  page?: number;
  limit?: number;
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

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const countResult = await queryOne<{ count: string }>(
    `SELECT count(*) FROM orders o ${whereClause}`,
    params,
  );
  const total = parseInt(countResult?.count || "0");

  const rows = await query<{
    id: string;
    order_number: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    created_at: string;
    item_count: string;
  }>(
    `SELECT o.id, o.order_number, o.status, o.customer_name, o.customer_phone, o.total, o.created_at,
            (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
     FROM orders o ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...params, limit, offset],
  );

  return {
    data: rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      status: r.status,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      total: r.total,
      itemCount: parseInt(r.item_count),
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

// ── Update Order Status ──

export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<OrderResponse | null> {
  await execute(
    "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
    [status, id],
  );
  return getOrderById(id);
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
        "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'",
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
