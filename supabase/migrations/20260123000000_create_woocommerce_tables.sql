-- Migration: Create WooCommerce sync infrastructure
-- Date: 2026-01-23
-- Description: Creates tables for WooCommerce data sync (MVP)

-- 1. Add column for WooCommerce site URL in accounts table
ALTER TABLE j_hub_notion_db_accounts
ADD COLUMN IF NOT EXISTS "Woo Site URL" TEXT;

-- 2. Create bronze table for WooCommerce orders and line items
CREATE TABLE IF NOT EXISTS j_rep_woocommerce_bronze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiers
  account_id UUID NOT NULL,            -- FK to j_hub_notion_db_accounts.id
  order_id BIGINT NOT NULL,
  line_item_id BIGINT,                 -- NULL for order record, populated for line item

  -- Order data
  order_date DATE NOT NULL,
  order_status TEXT NOT NULL,          -- completed, processing, etc.
  order_total NUMERIC(12,2),
  customer_id BIGINT,
  customer_email TEXT,
  payment_method TEXT,

  -- Line item data (when line_item_id is NOT NULL)
  product_id BIGINT,
  product_name TEXT,
  product_sku TEXT,
  quantity INTEGER,
  item_total NUMERIC(12,2),

  -- Flexible metadata (bundles, variations, etc.)
  meta_data JSONB DEFAULT '{}',

  -- Sync tracking
  synced_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint for UPSERT
  -- Using COALESCE to handle NULL line_item_id
  UNIQUE(account_id, order_id, COALESCE(line_item_id, 0))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_woo_bronze_account_date
  ON j_rep_woocommerce_bronze(account_id, order_date);
CREATE INDEX IF NOT EXISTS idx_woo_bronze_order_id
  ON j_rep_woocommerce_bronze(order_id);
CREATE INDEX IF NOT EXISTS idx_woo_bronze_order_date
  ON j_rep_woocommerce_bronze(order_date);

-- Enable RLS (same pattern as other bronze tables)
ALTER TABLE j_rep_woocommerce_bronze ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read woocommerce bronze"
  ON j_rep_woocommerce_bronze
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for service role full access
CREATE POLICY "Allow service role full access to woocommerce bronze"
  ON j_rep_woocommerce_bronze
  FOR ALL
  TO service_role
  USING (true);

-- Grants
GRANT SELECT ON j_rep_woocommerce_bronze TO authenticated;
GRANT ALL ON j_rep_woocommerce_bronze TO service_role;

-- 3. Create sync status tracking table
CREATE TABLE IF NOT EXISTS j_hub_woocommerce_sync_status (
  account_id UUID PRIMARY KEY REFERENCES j_hub_notion_db_accounts(id) ON DELETE CASCADE,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,               -- 'success', 'error'
  last_sync_orders_count INTEGER,
  last_error_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for sync status
ALTER TABLE j_hub_woocommerce_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read woocommerce sync status"
  ON j_hub_woocommerce_sync_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow service role full access to woocommerce sync status"
  ON j_hub_woocommerce_sync_status
  FOR ALL
  TO service_role
  USING (true);

GRANT SELECT ON j_hub_woocommerce_sync_status TO authenticated;
GRANT ALL ON j_hub_woocommerce_sync_status TO service_role;

-- Add comment for documentation
COMMENT ON TABLE j_rep_woocommerce_bronze IS 'WooCommerce orders and line items synced from customer stores. Part of Jumper Flow MVP for e-commerce data integration.';
COMMENT ON TABLE j_hub_woocommerce_sync_status IS 'Tracks last sync status per account for WooCommerce integration.';
COMMENT ON COLUMN j_hub_notion_db_accounts."Woo Site URL" IS 'Base URL for WooCommerce API (e.g., https://boiler.fit)';
