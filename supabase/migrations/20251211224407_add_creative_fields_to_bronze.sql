-- Migration: Add creative content fields and campaign fields to j_rep_metaads_bronze
-- Purpose: Enable rich creative preview in dashboards + campaign budget/status info
--
-- New fields from Windsor.ai Facebook connector:
-- Creative fields:
-- - body: Main ad copy text
-- - title: Ad headline/title
-- - link: Destination URL
-- - thumbnail_url: Video thumbnail (for video ads)
-- - media_type: Type of creative (IMAGE/VIDEO/CAROUSEL)
-- Campaign fields (requested by gestor):
-- - campaign_daily_budget: Daily budget of the campaign
-- - campaign_status: Status of the campaign (ACTIVE/PAUSED/etc)
-- - action_values_add_to_cart: Value (R$) of add to cart events

ALTER TABLE j_rep_metaads_bronze
ADD COLUMN IF NOT EXISTS body TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS link TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS campaign_daily_budget NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS campaign_status TEXT,
ADD COLUMN IF NOT EXISTS action_values_add_to_cart NUMERIC(10,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN j_rep_metaads_bronze.body IS 'Main ad copy text (from Windsor body field)';
COMMENT ON COLUMN j_rep_metaads_bronze.title IS 'Ad headline/title (from Windsor title field)';
COMMENT ON COLUMN j_rep_metaads_bronze.link IS 'Destination URL when clicking the ad';
COMMENT ON COLUMN j_rep_metaads_bronze.thumbnail_url IS 'Video thumbnail URL (for video ads)';
COMMENT ON COLUMN j_rep_metaads_bronze.media_type IS 'Type of creative: IMAGE, VIDEO, or CAROUSEL';
COMMENT ON COLUMN j_rep_metaads_bronze.campaign_daily_budget IS 'Daily budget of the campaign in account currency';
COMMENT ON COLUMN j_rep_metaads_bronze.campaign_status IS 'Campaign status: ACTIVE, PAUSED, DELETED, ARCHIVED';
COMMENT ON COLUMN j_rep_metaads_bronze.action_values_add_to_cart IS 'Total value (R$) of add to cart conversion events';
