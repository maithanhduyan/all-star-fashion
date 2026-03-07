-- Migration 0002: Add product management fields
-- cost_price, discount_price, stock_quantity, SEO fields

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(500);

-- Add constraints
ALTER TABLE products ADD CONSTRAINT chk_products_cost_price CHECK (cost_price IS NULL OR cost_price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_discount_price CHECK (discount_price IS NULL OR discount_price > 0);
ALTER TABLE products ADD CONSTRAINT chk_products_stock CHECK (stock_quantity >= 0);

-- Update existing products with default stock
UPDATE products SET stock_quantity = CASE WHEN in_stock THEN 100 ELSE 0 END WHERE stock_quantity = 0 AND in_stock = true;
