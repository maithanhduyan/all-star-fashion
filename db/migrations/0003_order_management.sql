-- Migration 0003: Order management enhancement
-- Shipping carriers, order history/timeline, invoices, returns

-- ============================================
-- SHIPPING CARRIERS
-- ============================================
CREATE TABLE shipping_carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    tracking_url_template VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed common Vietnamese carriers
INSERT INTO shipping_carriers (name, code, tracking_url_template) VALUES
  ('Giao Hàng Nhanh', 'ghn', 'https://donhang.ghn.vn/?order_code={tracking}'),
  ('Giao Hàng Tiết Kiệm', 'ghtk', 'https://i.ghtk.vn/{tracking}'),
  ('J&T Express', 'jt', 'https://jtexpress.vn/vi/tracking?type=track&billcode={tracking}'),
  ('Viettel Post', 'vtp', 'https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?code={tracking}'),
  ('BEST Express', 'best', 'https://best-inc.vn/track?bills={tracking}'),
  ('Shopee Express', 'spx', NULL),
  ('Tự giao', 'self', NULL);

-- ============================================
-- ADD COLUMNS TO ORDERS
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'partial_refund'));

-- Update status constraint to include new statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_status;
ALTER TABLE orders ADD CONSTRAINT chk_orders_status CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'completed', 'cancelled', 'returning', 'returned'));

CREATE INDEX idx_orders_carrier ON orders(carrier_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- ============================================
-- ORDER TIMELINE / HISTORY
-- ============================================
CREATE TABLE order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    note TEXT,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_timeline_order ON order_timeline(order_id);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_address TEXT,
    subtotal INTEGER NOT NULL,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    discount INTEGER NOT NULL DEFAULT 0,
    tax INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cod',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    note TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_invoices_total CHECK (total > 0),
    CONSTRAINT chk_invoices_payment_status CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'partial_refund'))
);

CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_issued ON invoices(issued_at);

-- ============================================
-- INVOICE ITEMS
-- ============================================
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    size VARCHAR(10),
    color VARCHAR(50),
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    CONSTRAINT chk_invoice_items_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================
-- RETURNS
-- ============================================
CREATE TABLE order_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    return_number VARCHAR(30) UNIQUE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'requested',
    refund_amount INTEGER NOT NULL DEFAULT 0,
    refund_method VARCHAR(20),
    admin_note TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_returns_status CHECK (status IN ('requested', 'approved', 'rejected', 'completed'))
);

CREATE INDEX idx_order_returns_order ON order_returns(order_id);
CREATE INDEX idx_order_returns_status ON order_returns(status);
