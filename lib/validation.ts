// lib/validation.ts — Zod validation schemas
import { z } from "zod";

// ── Auth ──

export const RegisterSchema = z.object({
  email: z.string().email("Email không hợp lệ").max(255).transform((s) =>
    s.toLowerCase().trim()
  ),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(100),
  name: z.string().min(1, "Tên không được trống").max(100).transform((s) =>
    s.trim()
  ),
  phone: z.string().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ")
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().max(255).transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1),
});

// ── Orders ──

export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid("Product ID không hợp lệ"),
  size: z.string().min(1, "Vui lòng chọn size"),
  color: z.string().min(1, "Vui lòng chọn màu"),
  quantity: z.number().int().min(1).max(5, "Tối đa 5 sản phẩm mỗi loại"),
});

export const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).min(1, "Giỏ hàng trống").max(20),
  customerName: z.string().min(1, "Vui lòng nhập họ tên").max(100).transform(
    (s) => s.trim(),
  ),
  customerEmail: z.string().email("Email không hợp lệ").max(255),
  customerPhone: z.string().regex(
    /^0\d{9,10}$/,
    "Số điện thoại không hợp lệ",
  ),
  shippingAddress: z.string().min(1, "Vui lòng nhập địa chỉ").max(500)
    .transform((s) => s.trim()),
  city: z.string().min(1, "Vui lòng nhập thành phố").max(100).transform((s) =>
    s.trim()
  ),
  district: z.string().min(1, "Vui lòng nhập quận/huyện").max(100).transform(
    (s) => s.trim(),
  ),
  note: z.string().max(500).optional().default(""),
  paymentMethod: z.enum(["cod"]),
});

// ── Reviews ──

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default(""),
});

// ── Admin ──

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "shipping",
    "delivered",
    "completed",
    "cancelled",
    "returning",
    "returned",
  ]),
  note: z.string().max(500).optional(),
});

export const AssignCarrierSchema = z.object({
  carrierId: z.string().uuid("Carrier ID không hợp lệ"),
  trackingNumber: z.string().max(100).optional(),
});

export const CreateReturnSchema = z.object({
  reason: z.string().min(1, "Vui lòng nhập lý do").max(500),
  refundAmount: z.number().positive().optional(),
});

export const ResolveReturnSchema = z.object({
  adminNote: z.string().max(500).optional(),
});

// ── Types from schemas ──

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type AssignCarrierInput = z.infer<typeof AssignCarrierSchema>;
export type CreateReturnInput = z.infer<typeof CreateReturnSchema>;
export type ResolveReturnInput = z.infer<typeof ResolveReturnSchema>;

// ── Helper: format Zod errors ──

export function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => e.message).join(", ");
}
