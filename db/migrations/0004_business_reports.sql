-- Migration 0004: Business reporting & accounting enhancements
-- Revenue reports, payment methods expansion, reporting indexes

-- ============================================
-- EXPAND PAYMENT METHODS
-- ============================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_payment;
ALTER TABLE orders ADD CONSTRAINT chk_orders_payment CHECK (payment_method IN ('cod', 'bank_transfer', 'momo', 'vnpay', 'credit_card'));

-- ============================================
-- BUSINESS REPORT SNAPSHOTS (monthly cache)
-- ============================================
CREATE TABLE IF NOT EXISTS business_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_month DATE NOT NULL, -- first day of month, e.g. '2026-03-01'
    total_orders INTEGER NOT NULL DEFAULT 0,
    completed_orders INTEGER NOT NULL DEFAULT 0,
    cancelled_orders INTEGER NOT NULL DEFAULT 0,
    returned_orders INTEGER NOT NULL DEFAULT 0,
    total_revenue INTEGER NOT NULL DEFAULT 0,    -- from completed/delivered orders
    total_refunds INTEGER NOT NULL DEFAULT 0,
    net_revenue INTEGER NOT NULL DEFAULT 0,      -- revenue - refunds
    total_shipping_fees INTEGER NOT NULL DEFAULT 0,
    avg_order_value INTEGER NOT NULL DEFAULT 0,
    total_items_sold INTEGER NOT NULL DEFAULT 0,
    total_invoices INTEGER NOT NULL DEFAULT 0,
    new_customers INTEGER NOT NULL DEFAULT 0,
    top_products JSONB DEFAULT '[]',             -- [{productName, quantity, revenue}]
    status_breakdown JSONB DEFAULT '{}',         -- {pending: 5, confirmed: 3, ...}
    payment_method_breakdown JSONB DEFAULT '{}', -- {cod: 10, bank_transfer: 5, ...}
    carrier_breakdown JSONB DEFAULT '{}',        -- {ghn: 5, ghtk: 3, ...}
    city_breakdown JSONB DEFAULT '{}',           -- {HCMC: 10, Hanoi: 5, ...}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_report_month UNIQUE (report_month)
);

CREATE INDEX idx_business_reports_month ON business_reports(report_month);

-- ============================================
-- DAILY REVENUE TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS daily_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_revenue INTEGER NOT NULL DEFAULT 0,
    total_refunds INTEGER NOT NULL DEFAULT 0,
    net_revenue INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_revenue_date UNIQUE (report_date)
);

CREATE INDEX idx_daily_revenue_date ON daily_revenue(report_date);

-- ============================================
-- REPORTING INDEXES (for fast queries)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(city);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- ============================================
-- ADD discount column to orders for promotions
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0;
