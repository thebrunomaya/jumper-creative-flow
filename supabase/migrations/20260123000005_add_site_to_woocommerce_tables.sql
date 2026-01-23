-- Migration: Add site column to WooCommerce tables
-- Date: 2026-01-23
-- Description: Adds site field to identify which store each record belongs to

-- Add column to orders table
ALTER TABLE j_rep_woocommerce_bronze
ADD COLUMN IF NOT EXISTS site TEXT;

-- Add column to products table
ALTER TABLE j_rep_woocommerce_products
ADD COLUMN IF NOT EXISTS site TEXT;

-- Indexes for queries by site
CREATE INDEX IF NOT EXISTS idx_woo_bronze_site ON j_rep_woocommerce_bronze(site);
CREATE INDEX IF NOT EXISTS idx_woo_products_site ON j_rep_woocommerce_products(site);

COMMENT ON COLUMN j_rep_woocommerce_bronze.site IS 'Domain extracted from Woo Site URL (e.g., boiler.fit)';
COMMENT ON COLUMN j_rep_woocommerce_products.site IS 'Domain extracted from Woo Site URL (e.g., boiler.fit)';
