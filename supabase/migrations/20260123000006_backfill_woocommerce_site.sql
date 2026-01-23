-- Migration: Backfill site field for existing WooCommerce records
-- Date: 2026-01-23
-- Description: Populates site field for records created before the site field was added

-- Backfill orders bronze table
UPDATE j_rep_woocommerce_bronze b
SET site = (
  SELECT regexp_replace(
    regexp_replace(a."Woo Site URL", '^https?://(www\.)?', ''),
    '/.*$', ''
  )
  FROM j_hub_notion_db_accounts a
  WHERE a.id = b.account_id
    AND a."Woo Site URL" IS NOT NULL
    AND a."Woo Site URL" != ''
)
WHERE b.site IS NULL OR b.site = '';

-- Backfill products table
UPDATE j_rep_woocommerce_products p
SET site = (
  SELECT regexp_replace(
    regexp_replace(a."Woo Site URL", '^https?://(www\.)?', ''),
    '/.*$', ''
  )
  FROM j_hub_notion_db_accounts a
  WHERE a.id = p.account_id
    AND a."Woo Site URL" IS NOT NULL
    AND a."Woo Site URL" != ''
)
WHERE p.site IS NULL OR p.site = '';
