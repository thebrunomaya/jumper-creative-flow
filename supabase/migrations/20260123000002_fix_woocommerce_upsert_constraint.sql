-- Migration: Fix WooCommerce UPSERT constraint
-- Date: 2026-01-23
-- Description: Replace functional index with proper UNIQUE constraint for Supabase UPSERT compatibility

-- 1. Drop the functional index (not compatible with PostgREST ON CONFLICT)
DROP INDEX IF EXISTS idx_woo_bronze_upsert;

-- 2. Update any existing NULL line_item_id to 0 (should be none, but just in case)
UPDATE j_rep_woocommerce_bronze SET line_item_id = 0 WHERE line_item_id IS NULL;

-- 3. Make line_item_id NOT NULL with default 0
ALTER TABLE j_rep_woocommerce_bronze
ALTER COLUMN line_item_id SET DEFAULT 0,
ALTER COLUMN line_item_id SET NOT NULL;

-- 4. Create proper UNIQUE constraint (works with Supabase UPSERT)
ALTER TABLE j_rep_woocommerce_bronze
ADD CONSTRAINT uq_woo_bronze_account_order_line_item
UNIQUE (account_id, order_id, line_item_id);

-- Add comment
COMMENT ON CONSTRAINT uq_woo_bronze_account_order_line_item ON j_rep_woocommerce_bronze
IS 'Unique constraint for UPSERT - line_item_id=0 for order records, actual ID for line items';
