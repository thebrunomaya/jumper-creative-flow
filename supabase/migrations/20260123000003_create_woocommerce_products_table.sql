-- Migration: Create WooCommerce products table
-- Date: 2026-01-23
-- Description: Adds products sync to WooCommerce integration

-- Products table (bronze layer - raw product data)
CREATE TABLE IF NOT EXISTS j_rep_woocommerce_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiers
  account_id UUID NOT NULL,
  product_id BIGINT NOT NULL,
  parent_id BIGINT,                    -- For variations, points to parent product

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT,
  sku TEXT,
  type TEXT,                           -- simple, variable, variation, grouped, external
  status TEXT,                         -- publish, draft, pending, private

  -- Pricing
  price NUMERIC(12,2),
  regular_price NUMERIC(12,2),
  sale_price NUMERIC(12,2),

  -- Stock
  stock_status TEXT,                   -- instock, outofstock, onbackorder
  stock_quantity INTEGER,
  manage_stock BOOLEAN,

  -- Categorization (JSONB for flexibility)
  categories JSONB DEFAULT '[]',       -- [{id, name, slug}]
  tags JSONB DEFAULT '[]',             -- [{id, name, slug}]
  attributes JSONB DEFAULT '[]',       -- [{id, name, options}]

  -- Timestamps
  date_created TIMESTAMPTZ,
  date_modified TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint for UPSERT
  CONSTRAINT uq_woo_products_account_product UNIQUE (account_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_woo_products_account ON j_rep_woocommerce_products(account_id);
CREATE INDEX IF NOT EXISTS idx_woo_products_sku ON j_rep_woocommerce_products(account_id, sku);
CREATE INDEX IF NOT EXISTS idx_woo_products_type ON j_rep_woocommerce_products(account_id, type);
CREATE INDEX IF NOT EXISTS idx_woo_products_parent ON j_rep_woocommerce_products(account_id, parent_id);

-- RLS
ALTER TABLE j_rep_woocommerce_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read woocommerce products"
  ON j_rep_woocommerce_products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role full access to woocommerce products"
  ON j_rep_woocommerce_products
  FOR ALL
  TO service_role
  USING (true);

GRANT SELECT ON j_rep_woocommerce_products TO authenticated;
GRANT ALL ON j_rep_woocommerce_products TO service_role;

COMMENT ON TABLE j_rep_woocommerce_products IS 'WooCommerce products synced from customer stores. Includes simple products, variables, and variations.';
