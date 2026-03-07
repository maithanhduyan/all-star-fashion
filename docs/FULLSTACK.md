# ALL STAR FASHION — Fullstack Blueprint (Single Source of Truth)

> **Mục tiêu:** Xây dựng backend production-grade cho e-commerce thời trang cao cấp.
> **Quyết định:** Full custom backend · PostgreSQL self-hosted · VPS tự quản lý · COD trước.
> **Nguyên tắc:** Monolith (Fresh API routes + middleware) — KHÔNG tách microservice.
> **Trạng thái:** ✅ Phase 1–6 HOÀN THÀNH (chỉ còn actual VPS deploy)

---

## Mục Lục

1. [Tổng Quan Hiện Trạng](#1-tổng-quan-hiện-trạng)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Database Schema](#4-database-schema)
5. [API Specification](#5-api-specification)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Business Logic & Validation](#7-business-logic--validation)
8. [Frontend Integration](#8-frontend-integration)
9. [Cấu Trúc Thư Mục Mới](#9-cấu-trúc-thư-mục-mới)
10. [Biến Môi Trường](#10-biến-môi-trường)
11. [Deployment (Docker + VPS)](#11-deployment-docker--vps)
12. [Phân Phase Triển Khai](#12-phân-phase-triển-khai)
13. [Coding Conventions](#13-coding-conventions)
14. [Testing Strategy](#14-testing-strategy)

---

## 1. Tổng Quan Hiện Trạng

### Đã hoạt động (frontend-only)

| Thành phần | File(s) | Ghi chú |
|---|---|---|
| Homepage (hero, categories, bestsellers, new arrivals) | `routes/index.tsx` | Dữ liệu từ `lib/data.ts` |
| Shop listing + filter category + search | `routes/shop/index.tsx` | Query params `?category=`, `?q=` |
| Product detail page | `routes/shop/[slug].tsx` | Handler SSR, gallery + add-to-cart islands |
| Cart management | `islands/CartView.tsx`, `lib/cart.ts` | 100% localStorage, event `cart-updated` |
| Cart badge (navbar) | `islands/CartBadge.tsx` | Listen `cart-updated` + `storage` events |
| Mobile menu, scroll-to-top, search modal | `islands/MobileMenu.tsx`, `islands/ScrollToTop.tsx`, `islands/SearchModal.tsx` | |
| API đọc products | `routes/api/products/index.ts`, `routes/api/products/[slug].ts` | GET only, trả mock data |
| About page | `routes/about.tsx` | Static |

### Cần backend (chưa hoạt động / giả)

| Thành phần | Vấn đề hiện tại |
|---|---|
| **Checkout** | Form tĩnh HTML, không có state, không gửi data, order summary hardcode `0₫` |
| **Đặt hàng** | `CheckoutForm` island chỉ clear cart + redirect, KHÔNG tạo order |
| **Order success** | Hiển thị mã đơn random, thông tin hardcode — không query từ DB |
| **Thanh toán** | Radio buttons COD/Bank/Stripe không hoạt động |
| **Chat widget** | Auto-reply hardcode, không có real messaging |
| **Auth / User** | Hoàn toàn chưa có |
| **Reviews** | Type đã define (`lib/types.ts`) nhưng không có UI/data |
| **Admin** | Hoàn toàn chưa có |
| **Database** | 8 sản phẩm + 6 danh mục hardcode trong `lib/data.ts` |

---

## 2. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Islands  │  │   SSR    │  │   localStorage   │  │
│  │ (Preact)  │  │  Pages   │  │   (cart state)   │  │
│  └─────┬─────┘  └──────────┘  └────────┬─────────┘  │
│        │                               │            │
└────────┼───────────────────────────────┼────────────┘
         │  fetch /api/*                 │
         ▼                               ▼
┌─────────────────────────────────────────────────────┐
│               FRESH SERVER (Deno)                   │
│                                                     │
│  routes/_middleware.ts  ← session parsing            │
│        │                                            │
│  ┌─────▼──────────────────────────────────────┐     │
│  │              Route Handlers                │     │
│  │  • SSR pages    (ctx.render)               │     │
│  │  • API routes   (JSON Response)            │     │
│  └─────┬──────────────────────────────────────┘     │
│        │                                            │
│  ┌─────▼──────────────────────────────────────┐     │
│  │           Service Layer (lib/)              │     │
│  │  • product.service.ts                      │     │
│  │  • order.service.ts                        │     │
│  │  • auth.service.ts                         │     │
│  │  • review.service.ts                       │     │
│  └─────┬──────────────────────────────────────┘     │
│        │                                            │
│  ┌─────▼──────────────────────────────────────┐     │
│  │        Database Layer (db/)                 │     │
│  │  • db/client.ts     (connection pool)      │     │
│  │  • db/schema.ts     (Drizzle schema)       │     │
│  │  • db/migrations/   (SQL migrations)       │     │
│  └─────┬──────────────────────────────────────┘     │
│        │                                            │
└────────┼────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (self-hosted) │
└─────────────────┘
```

### Quyết định kiến trúc quan trọng

| Quyết định | Lý do |
|---|---|
| **Monolith** (không tách backend) | Fresh đã hỗ trợ API routes + middleware. Quy mô e-commerce này không cần microservice. |
| **Session cookie** (không JWT) | Revocable (xóa session = logout ngay). Phù hợp SSR app. Đơn giản hơn JWT refresh flow. |
| **Cart giữ localStorage** | Giảm DB queries. Guest checkout không cần server cart. Sync lên server optional (phase sau). |
| **Guest checkout** | `orders.user_id` nullable. Không bắt buộc đăng nhập để mua hàng. |
| **Server-side price validation** | KHÔNG BAO GIỜ tin client gửi giá. Luôn query giá từ DB khi tạo order. |
| **deno-postgres** (không postgres.js npm) | Native Deno driver. Không cần npm shim. Ổn định trên Deno runtime. |

---

## 3. Tech Stack & Dependencies

### Hiện tại (giữ nguyên)

| Library | Version | Vai trò |
|---|---|---|
| Fresh | 1.7.3 | Web framework |
| Preact | 10.22.0 | UI runtime |
| Tailwind CSS | 3.4.1 | Styling |
| Deno Std | 0.216.0 | Utilities (dotenv, etc.) |

### Thêm mới → `deno.json` imports

```jsonc
{
  "imports": {
    // ... giữ nguyên các imports hiện tại ...

    // Database
    "postgres": "https://deno.land/x/postgres@v0.19.3/mod.ts",

    // ORM
    "drizzle-orm": "npm:drizzle-orm@0.33.0",
    "drizzle-orm/": "npm:drizzle-orm@0.33.0/",

    // Password hashing
    "bcrypt": "https://deno.land/x/bcrypt@v0.4.1/mod.ts",

    // Validation
    "zod": "https://deno.land/x/zod@v3.23.8/mod.ts"
  }
}
```

### Dev dependencies (chạy local, không deploy)

```bash
# Migration tool — chạy qua npx hoặc deno task
deno install -A npm:drizzle-kit@0.24.0
```

---

## 4. Database Schema

### ERD (Entity Relationship)

```
users 1──────N sessions
  │
  │ 1
  │
  ├──────N orders ──────N order_items ──────1 products
  │                                            │
  └──────N reviews ────────────────────────────┘
                                               │
                                          categories
                                               │
                                          products N──1 categories
                                          products 1──N product_images
                                          products 1──N product_sizes
                                          products 1──N product_colors
```

### Table Definitions

#### `users`

| Column | Type | Constraint | Ghi chú |
|---|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` | |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Lowercase, trimmed |
| `password_hash` | `VARCHAR(255)` | NOT NULL | bcrypt hash |
| `name` | `VARCHAR(100)` | NOT NULL | |
| `phone` | `VARCHAR(20)` | | Định dạng VN: 0xxx |
| `role` | `VARCHAR(20)` | NOT NULL, default `'customer'` | `'customer'` \| `'admin'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | |

#### `sessions`

| Column | Type | Constraint | Ghi chú |
|---|---|---|---|
| `id` | `VARCHAR(64)` | PK | Crypto random hex token |
| `user_id` | `UUID` | FK → users(id) ON DELETE CASCADE | |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | Default: 30 ngày từ lúc tạo |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | |

#### `categories`

| Column | Type | Constraint | Ghi chú |
|---|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` | |
| `name` | `VARCHAR(100)` | NOT NULL | VD: "Áo Thun" |
| `slug` | `VARCHAR(100)` | UNIQUE, NOT NULL | VD: "ao-thun" |
| `image` | `VARCHAR(500)` | | URL ảnh đại diện |
| `description` | `TEXT` | | |
| `sort_order` | `INTEGER` | default `0` | Thứ tự hiển thị |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | |

#### `products`

| Column | Type | Constraint | Ghi chú |
|---|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` | |
| `name` | `VARCHAR(255)` | NOT NULL | |
| `slug` | `VARCHAR(255)` | UNIQUE, NOT NULL | |
| `price` | `INTEGER` | NOT NULL | Giá VND (integer, không dùng float) |
| `original_price` | `INTEGER` | | Giá gốc trước giảm |
| `description` | `TEXT` | | |
| `category_id` | `UUID` | FK → categories(id) | |
| `in_stock` | `BOOLEAN` | NOT NULL, default `true` | |
| `is_new` | `BOOLEAN` | NOT NULL, default `false` | |
| `is_best_seller` | `BOOLEAN` | NOT NULL, default `false` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | |

Index: `idx_products_category` ON `category_id`
Index: `idx_products_slug` ON `slug`

#### `product_images`

| Column | Type | Constraint |
|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `product_id` | `UUID` | FK → products(id) ON DELETE CASCADE |
| `url` | `VARCHAR(500)` | NOT NULL |
| `sort_order` | `INTEGER` | default `0` |

#### `product_sizes`

| Column | Type | Constraint |
|---|---|---|
| `product_id` | `UUID` | FK → products(id) ON DELETE CASCADE |
| `size` | `VARCHAR(10)` | NOT NULL |

PK: composite (`product_id`, `size`)

#### `product_colors`

| Column | Type | Constraint |
|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `product_id` | `UUID` | FK → products(id) ON DELETE CASCADE |
| `name` | `VARCHAR(50)` | NOT NULL |
| `hex` | `VARCHAR(7)` | NOT NULL |

#### `orders`

| Column | Type | Constraint | Ghi chú |
|---|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` | |
| `order_number` | `VARCHAR(20)` | UNIQUE, NOT NULL | Format: `AS-YYYYMM-XXXX` (auto-generated) |
| `user_id` | `UUID` | FK → users(id) ON DELETE SET NULL | **Nullable** (guest checkout) |
| `customer_name` | `VARCHAR(100)` | NOT NULL | |
| `customer_email` | `VARCHAR(255)` | NOT NULL | |
| `customer_phone` | `VARCHAR(20)` | NOT NULL | |
| `shipping_address` | `TEXT` | NOT NULL | |
| `city` | `VARCHAR(100)` | NOT NULL | |
| `district` | `VARCHAR(100)` | NOT NULL | |
| `note` | `TEXT` | | Ghi chú khách hàng |
| `payment_method` | `VARCHAR(20)` | NOT NULL, default `'cod'` | Phase 1: chỉ `'cod'` |
| `status` | `VARCHAR(20)` | NOT NULL, default `'pending'` | Enum bên dưới |
| `subtotal` | `INTEGER` | NOT NULL | Tổng trước phí ship |
| `shipping_fee` | `INTEGER` | NOT NULL, default `0` | |
| `total` | `INTEGER` | NOT NULL | subtotal + shipping_fee |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | |

**Order status flow:**
```
pending → confirmed → shipping → delivered
    │         │          │
    └─────────┴──────────┴──→ cancelled
```

Index: `idx_orders_user` ON `user_id`
Index: `idx_orders_status` ON `status`
Index: `idx_orders_number` ON `order_number`

#### `order_items`

| Column | Type | Constraint |
|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `order_id` | `UUID` | FK → orders(id) ON DELETE CASCADE |
| `product_id` | `UUID` | FK → products(id) ON DELETE SET NULL |
| `product_name` | `VARCHAR(255)` | NOT NULL |
| `product_image` | `VARCHAR(500)` | |
| `price` | `INTEGER` | NOT NULL |
| `size` | `VARCHAR(10)` | NOT NULL |
| `color` | `VARCHAR(50)` | NOT NULL |
| `quantity` | `INTEGER` | NOT NULL, CHECK > 0 |

> **Lưu ý:** `product_name`, `price`, `product_image` được snapshot tại thời điểm đặt hàng. Nếu sản phẩm bị xóa/sửa giá sau, đơn hàng vẫn giữ nguyên data gốc.

#### `reviews`

| Column | Type | Constraint |
|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `product_id` | `UUID` | FK → products(id) ON DELETE CASCADE |
| `user_id` | `UUID` | FK → users(id) ON DELETE CASCADE |
| `rating` | `INTEGER` | NOT NULL, CHECK 1–5 |
| `comment` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` |

Unique: (`product_id`, `user_id`) — mỗi user chỉ review 1 lần / sản phẩm.

---

## 5. API Specification

### Quy ước chung

- Base path: `/api`
- Content-Type: `application/json`
- Error format: `{ "error": "message", "code": "ERROR_CODE" }`
- Pagination: `?page=1&limit=20` → response có `{ data: [...], pagination: { page, limit, total, totalPages } }`
- Auth: cookie `session_id` — tự động gửi với mỗi request

### 5.1 Products

#### `GET /api/products`

Query params:

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `category` | string | | Filter theo category slug |
| `q` | string | | Tìm kiếm theo tên (ILIKE) |
| `page` | number | 1 | Trang |
| `limit` | number | 20 | Số item / trang (max 50) |
| `sort` | string | `newest` | `newest` \| `price_asc` \| `price_desc` \| `best_seller` |

Response `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Oversized Wool Coat",
      "slug": "oversized-wool-coat",
      "price": 2990000,
      "originalPrice": 3990000,
      "description": "...",
      "category": { "id": "uuid", "name": "Áo Khoác", "slug": "ao-khoac" },
      "images": ["/images/products/oversized-wool-coat/1.jpg", "..."],
      "sizes": ["S", "M", "L", "XL"],
      "colors": [{ "name": "Đen", "hex": "#111111" }],
      "inStock": true,
      "isNew": true,
      "isBestSeller": true
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8, "totalPages": 1 }
}
```

#### `GET /api/products/:slug`

Response `200`: Single product object (same shape as above).
Response `404`: `{ "error": "Product not found", "code": "NOT_FOUND" }`

### 5.2 Categories

#### `GET /api/categories`

Response `200`:
```json
{
  "data": [
    { "id": "uuid", "name": "Áo Thun", "slug": "ao-thun", "image": "...", "description": "..." }
  ]
}
```

### 5.3 Auth

#### `POST /api/auth/register`

Body:
```json
{
  "email": "user@example.com",
  "password": "minimum8chars",
  "name": "Nguyễn Văn A",
  "phone": "0901234567"
}
```

Response `201`:
```json
{ "user": { "id": "uuid", "email": "...", "name": "...", "role": "customer" } }
```
+ Set-Cookie: `session_id=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`

Errors:
- `400`: Validation failed
- `409`: Email already exists (`EMAIL_EXISTS`)

#### `POST /api/auth/login`

Body:
```json
{ "email": "user@example.com", "password": "..." }
```

Response `200`: Same as register.
Error `401`: `{ "error": "Invalid credentials", "code": "INVALID_CREDENTIALS" }`

#### `POST /api/auth/logout`

Response `200`: `{ "ok": true }`
+ Clear session cookie

#### `GET /api/auth/me`

Response `200`: `{ "user": { "id", "email", "name", "phone", "role" } }`
Response `401`: `{ "error": "Not authenticated", "code": "UNAUTHORIZED" }`

### 5.4 Orders

#### `POST /api/orders`

Body:
```json
{
  "items": [
    { "productId": "uuid", "size": "M", "color": "Đen", "quantity": 2 }
  ],
  "customerName": "Nguyễn Văn A",
  "customerEmail": "user@example.com",
  "customerPhone": "0901234567",
  "shippingAddress": "123 Nguyễn Huệ",
  "city": "TP. Hồ Chí Minh",
  "district": "Quận 1",
  "note": "",
  "paymentMethod": "cod"
}
```

**Server-side processing:**
1. Validate tất cả fields (Zod schema)
2. Với mỗi item: query product từ DB → kiểm tra `in_stock` → lấy `price` từ DB (KHÔNG dùng giá client gửi)
3. Tính `subtotal` = sum(price × quantity)
4. Tính `shipping_fee` (miễn phí nếu subtotal ≥ 1.000.000₫, ngược lại 30.000₫)
5. `total` = subtotal + shipping_fee
6. Generate `order_number`: `AS-YYYYMM-XXXX`
7. Insert `orders` + `order_items` trong 1 transaction
8. Nếu user đã login → gắn `user_id`

Response `201`:
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "AS-202603-0001",
    "total": 3580000,
    "status": "pending"
  }
}
```

Errors:
- `400`: Validation error / Product out of stock
- `422`: Cart empty

#### `GET /api/orders`

> Yêu cầu: **Đã đăng nhập**

Response `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "orderNumber": "AS-202603-0001",
      "status": "pending",
      "total": 3580000,
      "itemCount": 3,
      "createdAt": "2026-03-07T..."
    }
  ]
}
```

#### `GET /api/orders/:id`

> Yêu cầu: **Owner hoặc Admin**

Response `200`: Full order object kèm `items[]`.
Error `403`: Không phải owner.

### 5.5 Admin Orders

#### `PATCH /api/admin/orders/:id/status`

> Yêu cầu: **Admin only**

Body:
```json
{ "status": "confirmed" }
```

Response `200`: Updated order object.

### 5.6 Reviews (Phase 3+)

#### `POST /api/products/:slug/reviews`

> Yêu cầu: **Đã đăng nhập**

Body: `{ "rating": 5, "comment": "Sản phẩm rất đẹp" }`

#### `GET /api/products/:slug/reviews`

Query: `?page=1&limit=10`

---

## 6. Authentication & Authorization

### Flow

```
Register/Login
       │
       ▼
  Server tạo session record trong DB
  + set cookie: session_id=<64-char-hex>
       │
       ▼
  Mỗi request → _middleware.ts:
    1. Đọc cookie session_id
    2. Query sessions table (JOIN users)
    3. Kiểm tra expires_at > NOW()
    4. Gắn ctx.state.user = { id, email, name, role } hoặc null
       │
       ▼
  Protected routes kiểm tra ctx.state.user
```

### Session Token Generation

```typescript
// 32 bytes random → 64 hex chars
const token = crypto.getRandomValues(new Uint8Array(32));
const sessionId = Array.from(token, b => b.toString(16).padStart(2, "0")).join("");
```

### Cookie Settings

```
Name:     session_id
Value:    <64-char hex>
HttpOnly: true          ← JavaScript không đọc được
Secure:   true          ← Chỉ gửi qua HTTPS (production)
SameSite: Lax           ← CSRF protection
Path:     /
Max-Age:  2592000       ← 30 ngày
```

### Authorization Levels

| Level | Check | Dùng cho |
|---|---|---|
| Public | Không check | Browse products, homepage, register, login |
| Authenticated | `ctx.state.user !== null` | Xem lịch sử đơn, viết review, xem tài khoản |
| Owner | `ctx.state.user.id === resource.user_id` | Xem chi tiết đơn hàng của mình |
| Admin | `ctx.state.user.role === "admin"` | Quản lý đơn, CRUD sản phẩm, dashboard |

### Middleware Chain

```
routes/_middleware.ts           ← Parse session, gắn ctx.state.user (KHÔNG block)
routes/api/_middleware.ts       ← Set Content-Type: application/json
routes/admin/_middleware.ts     ← Kiểm tra admin role, redirect nếu không phải
routes/account/_middleware.ts   ← Kiểm tra đã login, redirect /login nếu chưa
```

---

## 7. Business Logic & Validation

### 7.1 Order Creation Rules

```
1. Cart KHÔNG được rỗng
2. Mỗi item:
   - productId phải tồn tại trong DB
   - product.in_stock === true
   - size phải nằm trong product.sizes[]
   - color phải nằm trong product.colors[].name
   - quantity: 1–5 (integer)
3. Giá lấy từ DB, KHÔNG từ client
4. Shipping: miễn phí nếu subtotal ≥ 1.000.000₫, ngược lại 30.000₫
5. Payment method phase 1: chỉ 'cod'
6. Order number: AS-{YYYYMM}-{sequential 4 digits}
7. Toàn bộ insert trong 1 DB transaction
```

### 7.2 Validation Schemas (Zod)

```typescript
// Đăng ký
const RegisterSchema = z.object({
  email: z.string().email().max(255).transform(s => s.toLowerCase().trim()),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).trim(),
  phone: z.string().regex(/^0\d{9,10}$/).optional(),
});

// Tạo đơn
const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    size: z.string().min(1),
    color: z.string().min(1),
    quantity: z.number().int().min(1).max(5),
  })).min(1).max(20),
  customerName: z.string().min(1).max(100).trim(),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().regex(/^0\d{9,10}$/),
  shippingAddress: z.string().min(1).max(500).trim(),
  city: z.string().min(1).max(100).trim(),
  district: z.string().min(1).max(100).trim(),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["cod"]),
});

// Review
const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
```

### 7.3 Password Policy

- Minimum 8 ký tự
- Hash: bcrypt, cost factor = 10
- KHÔNG lưu plaintext bao giờ

### 7.4 Price Format

- Lưu DB: **INTEGER** (đơn vị VND, không có decimal)
- Hiện UI: `Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })`
- VD: `2990000` → `2.990.000 ₫`

---

## 8. Frontend Integration

### 8.1 Refactor checklist — SSR Pages

| Route | Thay đổi |
|---|---|
| `routes/index.tsx` | Thêm handler `GET` → query DB: new arrivals, best sellers, categories |
| `routes/shop/index.tsx` | Handler `GET` → query DB với filter, search, **pagination** |
| `routes/shop/[slug].tsx` | Handler `GET` → query product + related products từ DB |
| `routes/checkout.tsx` | Giữ SSR layout. Toàn bộ form logic chuyển vào `CheckoutForm` island |
| `routes/order-success.tsx` | Thêm handler `GET` → nhận `?id=`, query order từ DB, render thật |
| `routes/cart.tsx` | Giữ nguyên (cart vẫn localStorage) |

### 8.2 Refactor checklist — Islands

| Island | Thay đổi |
|---|---|
| `CheckoutForm.tsx` | **Viết lại hoàn toàn:** Form state (useState), client validation, POST `/api/orders`, error handling, loading state |
| `CartView.tsx` | Thêm link đến checkout kèm item count, giữ nguyên localStorage logic |
| `ChatWidget.tsx` | Phase sau — giữ nguyên hoặc ẩn đi |
| Còn lại | Giữ nguyên |

### 8.3 Trang mới cần tạo

| Route | Mô tả | Island(s) cần |
|---|---|---|
| `routes/login.tsx` | Trang đăng nhập | `islands/LoginForm.tsx` |
| `routes/register.tsx` | Trang đăng ký | `islands/RegisterForm.tsx` |
| `routes/account/index.tsx` | Trang tài khoản (thông tin + lịch sử đơn) | `islands/OrderHistory.tsx` |
| `routes/account/orders/[id].tsx` | Chi tiết đơn hàng | — (SSR) |
| `routes/admin/index.tsx` | Admin dashboard | — (SSR) |
| `routes/admin/orders.tsx` | Quản lý đơn hàng | `islands/AdminOrderTable.tsx` |
| `routes/admin/products.tsx` | CRUD sản phẩm | `islands/AdminProductForm.tsx` |

### 8.4 Navbar Update

Thêm vào `components/Navbar.tsx`:
- Nếu chưa login: link "Đăng Nhập"
- Nếu đã login: dropdown "Tài Khoản" → Tài Khoản, Đơn Hàng, Đăng Xuất
- Nếu admin: thêm link "Admin"

User state lấy từ:
- SSR: `ctx.state.user` truyền qua props / `<script>` tag inject
- Island: fetch `/api/auth/me` on mount, hoặc đọc từ props SSR

---

## 9. Cấu Trúc Thư Mục Mới

```
all-star-fashion/
├── deno.json
├── dev.ts
├── main.ts
├── fresh.config.ts
├── fresh.gen.ts
├── tailwind.config.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .env                         ← gitignore
│
├── db/
│   ├── client.ts                ← PostgreSQL connection pool
│   ├── schema.ts                ← Drizzle ORM schema definitions
│   ├── migrate.ts               ← Migration runner script
│   ├── seed.ts                  ← Seed 6 categories + 8 products từ data.ts
│   └── migrations/
│       └── 0001_initial.sql     ← First migration
│
├── lib/
│   ├── types.ts                 ← Shared TypeScript interfaces (giữ nguyên + mở rộng)
│   ├── cart.ts                  ← Client-side cart (giữ nguyên)
│   ├── data.ts                  ← Mock data (giữ làm seed source, xóa sau khi seed xong)
│   ├── validation.ts            ← Zod schemas
│   └── services/
│       ├── product.service.ts   ← CRUD products (DB queries)
│       ├── category.service.ts  ← CRUD categories
│       ├── order.service.ts     ← Create/read/update orders
│       ├── auth.service.ts      ← Register, login, session management
│       └── review.service.ts    ← CRUD reviews
│
├── routes/
│   ├── _app.tsx
│   ├── _404.tsx
│   ├── _middleware.ts            ← NEW: session parsing
│   ├── index.tsx                 ← Refactor: DB query
│   ├── about.tsx
│   ├── cart.tsx
│   ├── checkout.tsx              ← Refactor: form integration
│   ├── order-success.tsx         ← Refactor: query real order
│   ├── login.tsx                 ← NEW
│   ├── register.tsx              ← NEW
│   │
│   ├── shop/
│   │   ├── index.tsx             ← Refactor: DB query + pagination
│   │   └── [slug].tsx            ← Refactor: DB query
│   │
│   ├── account/                  ← NEW
│   │   ├── _middleware.ts        ← Auth required
│   │   ├── index.tsx             ← Trang tài khoản
│   │   └── orders/
│   │       └── [id].tsx          ← Chi tiết đơn hàng
│   │
│   ├── admin/                    ← NEW
│   │   ├── _middleware.ts        ← Admin required
│   │   ├── index.tsx             ← Dashboard
│   │   ├── orders.tsx            ← Quản lý đơn
│   │   └── products.tsx          ← Quản lý sản phẩm
│   │
│   └── api/
│       ├── _middleware.ts        ← NEW: JSON content-type
│       ├── products/
│       │   ├── index.ts          ← Refactor: DB query + pagination
│       │   └── [slug].ts         ← Refactor: DB query
│       ├── categories/
│       │   └── index.ts          ← NEW
│       ├── auth/
│       │   ├── register.ts       ← NEW
│       │   ├── login.ts          ← NEW
│       │   ├── logout.ts         ← NEW
│       │   └── me.ts             ← NEW
│       ├── orders/
│       │   ├── index.ts          ← NEW: POST create, GET list
│       │   └── [id].ts           ← NEW: GET detail
│       └── admin/
│           └── orders/
│               └── [id]/
│                   └── status.ts ← NEW: PATCH update status
│
├── islands/
│   ├── AddToCart.tsx              ← Giữ nguyên
│   ├── CartBadge.tsx             ← Giữ nguyên
│   ├── CartView.tsx              ← Giữ nguyên
│   ├── ChatWidget.tsx            ← Giữ nguyên (phase sau)
│   ├── CheckoutForm.tsx          ← VIẾT LẠI
│   ├── Counter.tsx               ← Giữ nguyên
│   ├── MobileMenu.tsx            ← Giữ nguyên
│   ├── ProductGallery.tsx        ← Giữ nguyên
│   ├── ScrollToTop.tsx           ← Giữ nguyên
│   ├── SearchBar.tsx             ← Giữ nguyên
│   ├── SearchModal.tsx           ← Giữ nguyên
│   ├── LoginForm.tsx             ← NEW
│   ├── RegisterForm.tsx          ← NEW
│   ├── UserMenu.tsx              ← NEW (navbar dropdown)
│   ├── OrderHistory.tsx          ← NEW
│   ├── AdminOrderTable.tsx       ← NEW
│   └── AdminProductForm.tsx      ← NEW
│
├── components/
│   ├── Layout.tsx                ← Update: truyền user state
│   ├── Navbar.tsx                ← Update: auth links
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── CategoryCard.tsx
│   ├── Button.tsx
│   └── Pagination.tsx            ← NEW
│
├── static/
│   ├── styles.css
│   └── images/
│
└── docs/
    ├── IDEA.md
    └── FULLSTACK.md              ← File này
```

---

## 10. Biến Môi Trường

### `.env.example`

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=allstar_fashion
DATABASE_USER=allstar
DATABASE_PASSWORD=change_me_in_production

# App
APP_ENV=development
APP_PORT=8000
APP_URL=http://localhost:8000

# Session
SESSION_SECRET=generate-a-64-char-random-string-here
SESSION_MAX_AGE=2592000

# Admin (tạo admin user đầu tiên khi seed)
ADMIN_EMAIL=admin@allstarfashion.vn
ADMIN_PASSWORD=change_me_admin

# Shipping
FREE_SHIPPING_THRESHOLD=1000000
DEFAULT_SHIPPING_FEE=30000
```

### Quy tắc

- `.env` PHẢI nằm trong `.gitignore`
- `.env.example` PHẢI commit vào repo (không chứa secret thật)
- Production: dùng environment variables thật (Docker env / systemd)
- `$std/dotenv/load.ts` đã được import trong `main.ts` và `dev.ts`

---

## 11. Deployment (Docker + VPS)

### Docker Architecture

```
┌──── VPS (Ubuntu 22.04+) ─────────────────────────┐
│                                                   │
│  ┌─── Nginx (reverse proxy) ───┐                  │
│  │  SSL termination            │                  │
│  │  Port 80/443 → localhost:8000│                 │
│  └──────────┬──────────────────┘                  │
│             │                                     │
│  ┌──────────▼──────────────────┐                  │
│  │  Docker Compose             │                  │
│  │                             │                  │
│  │  ┌── app ──────────────┐    │                  │
│  │  │  Deno + Fresh       │    │                  │
│  │  │  Port 8000          │    │                  │
│  │  └───────┬─────────────┘    │                  │
│  │          │                  │                  │
│  │  ┌───────▼─────────────┐    │                  │
│  │  │  db (PostgreSQL 16) │    │                  │
│  │  │  Port 5432          │    │                  │
│  │  │  Volume: pgdata     │    │                  │
│  │  └─────────────────────┘    │                  │
│  │                             │                  │
│  └─────────────────────────────┘                  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Dockerfile (multi-stage)

```dockerfile
FROM denoland/deno:2.1.4

WORKDIR /app

# Cache dependencies
COPY deno.json deno.lock* ./
RUN deno cache main.ts || true

# Copy source
COPY . .

# Build Fresh (generate static assets)
RUN deno task build

# Run
EXPOSE 8000
CMD ["deno", "run", "-A", "main.ts"]
```

### docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"    # Chỉ expose local
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
```

### Deploy Checklist

```
□ VPS: Ubuntu 22.04+, min 2GB RAM, 20GB SSD
□ Install: Docker, Docker Compose, Nginx, Certbot
□ Clone repo vào VPS
□ Tạo .env từ .env.example (đổi tất cả passwords)
□ docker compose up -d
□ Chạy migration: docker compose exec app deno run -A db/migrate.ts
□ Chạy seed: docker compose exec app deno run -A db/seed.ts
□ Setup Nginx reverse proxy (config mẫu bên dưới)
□ Certbot: certbot --nginx -d allstarfashion.vn
□ Test toàn bộ flow trên production
```

### Nginx Config (mẫu)

```nginx
server {
    listen 80;
    server_name allstarfashion.vn www.allstarfashion.vn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name allstarfashion.vn www.allstarfashion.vn;

    ssl_certificate /etc/letsencrypt/live/allstarfashion.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/allstarfashion.vn/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Static files cache
    location /static/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }

    # App
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 12. Phân Phase Triển Khai

### Phase 1: Database Foundation ✅ HOÀN THÀNH

**Mục tiêu:** PostgreSQL chạy, schema tạo xong, seed data từ mock hiện tại.

| # | Task | File(s) | Status |
|---|---|---|---|
| 1.1 | ✅ Thêm imports mới vào `deno.json` (postgres, bcrypt, zod) | `deno.json` | Done |
| 1.2 | ✅ Tạo `db/client.ts` — PostgreSQL connection pool (10 conn) | `db/client.ts` | Done |
| 1.3 | ✅ Raw SQL thay Drizzle (driver incompatible) | `db/client.ts` | Done |
| 1.4 | ✅ Tạo migration SQL — 10 tables | `db/migrations/0001_initial.sql` | Done |
| 1.5 | ✅ Tạo `db/migrate.ts` — migration runner (Windows path fix) | `db/migrate.ts` | Done |
| 1.6 | ✅ Tạo `db/seed.ts` — seed từ `lib/data.ts` | `db/seed.ts` | Done |
| 1.7 | ✅ Tạo `.env.example` và `.env` local | `.env.example`, `.env` | Done |
| 1.8 | ✅ `.env` đã có trong `.gitignore` | `.gitignore` | Done |
| 1.9 | ✅ Docker PostgreSQL `allstar-postgres` + migrate + seed | — | Done |

**Verified:** 6 categories, 8 products, 24 images, 1 admin user in DB. ✅

---

### Phase 2: Service Layer + API ✅ HOÀN THÀNH

**Mục tiêu:** API hoạt động, đọc/ghi dữ liệu từ PostgreSQL thật.

| # | Task | File(s) | Status |
|---|---|---|---|
| 2.1 | ✅ Tạo `lib/validation.ts` — Zod schemas | `lib/validation.ts` | Done |
| 2.2 | ✅ Tạo `lib/services/product.service.ts` | `lib/services/product.service.ts` | Done |
| 2.3 | ✅ Tạo `lib/services/category.service.ts` | `lib/services/category.service.ts` | Done |
| 2.4 | ✅ Tạo `lib/services/auth.service.ts` | `lib/services/auth.service.ts` | Done |
| 2.5 | ✅ Tạo `lib/services/order.service.ts` | `lib/services/order.service.ts` | Done |
| 2.6 | ✅ Tạo root middleware `routes/_middleware.ts` | `routes/_middleware.ts` | Done |
| 2.7 | ✅ Tạo API middleware `routes/api/_middleware.ts` | `routes/api/_middleware.ts` | Done |
| 2.8 | ✅ Refactor `routes/api/products/*` → DB queries | `routes/api/products/*.ts` | Done |
| 2.9 | ✅ Tạo `routes/api/categories/index.ts` | `routes/api/categories/index.ts` | Done |
| 2.10 | ✅ Tạo auth API routes (register, login, logout, me) | `routes/api/auth/*.ts` | Done |
| 2.11 | ✅ Tạo order API routes (create, list, detail) | `routes/api/orders/*.ts` | Done |
| 2.12 | ✅ Tạo admin order status API | `routes/api/admin/orders/[id]/status.ts` | Done |

**Verified:** All API endpoints tested via curl — products, categories, auth flow, order creation, admin status update. ✅

```bash
# Test products
curl http://localhost:8000/api/products
curl http://localhost:8000/api/products/oversized-wool-coat

# Test auth
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"12345678","name":"Test"}'

# Test order
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -b "session_id=..." \
  -d '{...}'
```

---

### Phase 3: Frontend Integration ✅ HOÀN THÀNH

**Mục tiêu:** Tất cả pages đọc data từ DB. Checkout + Order flow hoạt động thật.

| # | Task | File(s) | Status |
|---|---|---|---|
| 3.1 | ✅ Refactor `routes/index.tsx` → DB handler (categories, bestSellers, newArrivals) | `routes/index.tsx` | Done |
| 3.2 | ✅ Refactor `routes/shop/index.tsx` → DB + pagination (12/page, category/search filter) | `routes/shop/index.tsx` | Done |
| 3.3 | ✅ Refactor `routes/shop/[slug].tsx` → DB (product + related) | `routes/shop/[slug].tsx` | Done |
| 3.4 | ✅ **Viết lại** `islands/CheckoutForm.tsx` — full form + POST /api/orders | `islands/CheckoutForm.tsx` | Done |
| 3.5 | ✅ Simplify `routes/checkout.tsx` → Layout + CheckoutForm island | `routes/checkout.tsx` | Done |
| 3.6 | ✅ Refactor `routes/order-success.tsx` → query real order from DB | `routes/order-success.tsx` | Done |
| 3.7 | ✅ Created `lib/utils.ts` (formatPrice, toProduct converter) | `lib/utils.ts` | Done |

**Verified:** All pages return 200, data from DB renders in HTML. ✅

---

### Phase 4: Auth UI ✅ HOÀN THÀNH

**Mục tiêu:** User có thể đăng ký, đăng nhập, xem lịch sử đơn.

| # | Task | File(s) | Status |
|---|---|---|---|
| 4.1 | ✅ Tạo `routes/auth/login.tsx` + `islands/LoginForm.tsx` | 2 files | Done |
| 4.2 | ✅ Tạo `routes/auth/register.tsx` + `islands/RegisterForm.tsx` | 2 files | Done |
| 4.3 | ✅ Update `components/Navbar.tsx` — UserMenu island | `components/Navbar.tsx` | Done |
| 4.4 | ✅ Tạo `islands/UserMenu.tsx` — dropdown (account, orders, admin, logout) | `islands/UserMenu.tsx` | Done |
| 4.5 | ✅ Update `routes/_app.tsx` — inject user JSON via script tag | `routes/_app.tsx` | Done |
| 4.6 | ✅ Tạo `routes/account/_middleware.ts` — require auth + redirect | `routes/account/_middleware.ts` | Done |
| 4.7 | ✅ Tạo `routes/account/index.tsx` — profile overview + quick links | `routes/account/index.tsx` | Done |
| 4.8 | ✅ Tạo `routes/account/orders.tsx` — order history with status badges | `routes/account/orders.tsx` | Done |

**Verified:** /auth/login 200, /auth/register 200, /account 302 (correct redirect when unauthenticated). ✅

---

### Phase 5: Admin Panel ✅ HOÀN THÀNH

**Mục tiêu:** Admin quản lý đơn hàng và sản phẩm.

| # | Task | File(s) | Status |
|---|---|---|---|
| 5.1 | ✅ Tạo `routes/admin/_middleware.ts` — require auth + admin role | 1 file | Done |
| 5.2 | ✅ Tạo `routes/admin/index.tsx` — dashboard (stats: orders, revenue, pending, today) | 1 file | Done |
| 5.3 | ✅ Tạo `routes/admin/orders.tsx` + `islands/AdminOrderActions.tsx` | 2 files | Done |
| 5.4 | ✅ Tạo `routes/admin/products.tsx` — product listing table | 1 file | Done |
| 5.5 | ✅ Admin user seeded in `db/seed.ts` (admin@allstarfashion.vn) | `db/seed.ts` | Done |

**Verified:** /admin 200 with admin auth, 302 without. Dashboard stats from DB. Order status transitions working. ✅

---

### Phase 6: Production Deploy ✅ HOÀN THÀNH

| # | Task | Status |
|---|---|---|
| 6.1 | ✅ Tạo `Dockerfile` — multi-stage Deno build, healthcheck, non-root user | Done |
| 6.2 | ✅ Tạo `docker-compose.yml` — app + db services, volume persistence | Done |
| 6.3 | ✅ Tạo `nginx/allstarfashion.conf` — reverse proxy, SSL, gzip, security headers | Done |
| 6.4 | ✅ Tạo `deploy.sh` — setup-vps, first-run, update, backup, rollback commands | Done |
| 6.5 | ✅ Tạo `.dockerignore` + `.env.production.example` | Done |
| 6.6 | ⬜ VPS deploy + SSL + smoke test (requires actual VPS) | Pending VPS |

---

### Phase 7+ (Roadmap tương lai)

| Feature | Priority | Ghi chú |
|---|---|---|
| Thanh toán online (VNPay/MoMo) | High | Thêm payment gateway sau COD |
| Image upload + CDN (Cloudinary) | High | Admin upload ảnh sản phẩm |
| Email notifications | High | Xác nhận đơn, cập nhật trạng thái |
| Reviews UI | Medium | Rating + comment trên product page |
| Full-text search (Meilisearch) | Medium | Thay thế ILIKE query |
| Inventory management / stock tracking | Medium | Trừ tồn kho khi đặt hàng |
| Wishlist | Low | |
| Chat widget (real-time) | Low | WebSocket hoặc tích hợp Tawk.to |
| Analytics dashboard | Low | Biểu đồ doanh thu, đơn hàng |
| Multi-language (EN/VI) | Low | i18n |
| PWA / mobile app | Low | |

---

## 13. Coding Conventions

### Nguyên tắc chung

- **Language:** TypeScript strict. KHÔNG dùng `any` trừ khi bắt buộc.
- **Formatting:** `deno fmt` (default settings).
- **Linting:** `deno lint` với rules `["fresh", "recommended"]`.
- **Naming:**
  - Files: `kebab-case.ts` (routes, services) hoặc `PascalCase.tsx` (components, islands)
  - Functions/variables: `camelCase`
  - Types/interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - DB columns: `snake_case`

### Service Layer Pattern

```typescript
// lib/services/product.service.ts
import { db } from "../../db/client.ts";

export async function getProducts(options: {
  category?: string;
  query?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<{ data: Product[]; pagination: Pagination }> {
  // DB query logic
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // DB query logic
}
```

### Route Handler Pattern

```typescript
// routes/api/products/index.ts
import type { Handlers } from "$fresh/server.ts";
import { getProducts } from "../../../lib/services/product.service.ts";

export const handler: Handlers = {
  async GET(req, _ctx) {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") ?? undefined;
    const q = url.searchParams.get("q") ?? undefined;
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);

    const result = await getProducts({ category, query: q, page, limit });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
```

### Error Handling

```typescript
// API routes: return JSON errors
return new Response(
  JSON.stringify({ error: "Product not found", code: "NOT_FOUND" }),
  { status: 404, headers: { "Content-Type": "application/json" } }
);

// SSR routes: render 404 page
return ctx.renderNotFound();

// Service layer: throw typed errors hoặc return null
```

### Import Order

```typescript
// 1. Deno/Fresh imports
import type { Handlers, PageProps } from "$fresh/server.ts";

// 2. Library imports
import { z } from "zod";

// 3. Internal imports — DB
import { db } from "../../db/client.ts";

// 4. Internal imports — Services
import { getProducts } from "../../lib/services/product.service.ts";

// 5. Internal imports — Types
import type { Product } from "../../lib/types.ts";

// 6. Internal imports — Components
import Layout from "../../components/Layout.tsx";
```

---

## 14. Testing Strategy

### Unit Tests

```bash
# Chạy tất cả tests
deno test --allow-env --allow-net

# Chạy test cụ thể
deno test lib/services/order.service.test.ts
```

**Test gì:**
- Validation schemas (Zod): input hợp lệ / không hợp lệ
- Service functions: mock DB, test business logic
- Price calculation: subtotal, shipping fee, total
- Order number generation

### Integration Tests

**Test gì:**
- API endpoints: request → response status + body
- Auth flow: register → login → authenticated request → logout
- Order flow: tạo đơn → verify DB record
- Middleware: session parsing, admin check

### Manual Testing Checklist

```
□ Homepage load → hiển thị products từ DB
□ Shop page → filter category, search, pagination hoạt động
□ Product detail → đúng data, ảnh, sizes, colors
□ Add to cart → cart badge cập nhật
□ Cart page → quantity +/-, remove, clear
□ Checkout → form validation, submit → tạo order
□ Order success → hiển thị order number + thông tin thật
□ Register → tạo account thành công
□ Login → session cookie set
□ Account page → hiển thị lịch sử đơn
□ Order detail → hiển thị đúng items + status
□ Logout → session cleared
□ Admin login → dashboard + order management
□ Admin cập nhật trạng thái đơn
□ Mobile responsive → tất cả pages
□ Error cases: 404, invalid form, expired session
```

---

> **Cập nhật lần cuối:** 2026-03-07
> **Tác giả:** All Star Fashion Dev Team

### Tổng Kết Triển Khai

| Phase | Tên | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Database Foundation | ✅ Done | PostgreSQL 16, 10 tables, seed data |
| 2 | Service Layer + API | ✅ Done | 12 API endpoints, 4 service modules |
| 3 | Frontend Integration | ✅ Done | SSR pages from DB, checkout flow |
| 4 | Auth UI | ✅ Done | Login/register, account pages, UserMenu |
| 5 | Admin Panel | ✅ Done | Dashboard, order management, product listing |
| 6 | Production Deploy | ✅ Done | Dockerfile, docker-compose, Nginx, deploy.sh |

**Quyết định kỹ thuật thay đổi so với blueprint ban đầu:**
- ❌ Drizzle ORM → ✅ Raw parameterized SQL (driver incompatibility with deno-postgres)
- ❌ `db/schema.ts` → ✅ Direct SQL in `db/migrations/0001_initial.sql`
- Layout user prop → Script tag injection (`<script id="__user">`) for islands to read
