-- ============================================================================
-- Migration: Add RLS policies to Google Ads and GA4 bronze tables
-- Purpose: Allow authenticated users to read Google Ads and GA4 metrics
-- ============================================================================

-- Enable RLS on j_rep_googleads_bronze (if not already enabled)
ALTER TABLE IF EXISTS "public"."j_rep_googleads_bronze" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read googleads bronze" ON "public"."j_rep_googleads_bronze";
DROP POLICY IF EXISTS "Allow service role to manage googleads bronze" ON "public"."j_rep_googleads_bronze";

-- Create SELECT policy for authenticated users
CREATE POLICY "Allow authenticated users to read googleads bronze"
  ON "public"."j_rep_googleads_bronze"
  FOR SELECT
  TO "authenticated"
  USING (true);

-- Create full access policy for service role
CREATE POLICY "Allow service role to manage googleads bronze"
  ON "public"."j_rep_googleads_bronze"
  USING (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."j_rep_googleads_bronze" TO "anon";
GRANT ALL ON TABLE "public"."j_rep_googleads_bronze" TO "authenticated";
GRANT ALL ON TABLE "public"."j_rep_googleads_bronze" TO "service_role";


-- ============================================================================
-- Same for j_rep_ga4_bronze
-- ============================================================================

-- Enable RLS on j_rep_ga4_bronze (if not already enabled)
ALTER TABLE IF EXISTS "public"."j_rep_ga4_bronze" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read ga4 bronze" ON "public"."j_rep_ga4_bronze";
DROP POLICY IF EXISTS "Allow service role to manage ga4 bronze" ON "public"."j_rep_ga4_bronze";

-- Create SELECT policy for authenticated users
CREATE POLICY "Allow authenticated users to read ga4 bronze"
  ON "public"."j_rep_ga4_bronze"
  FOR SELECT
  TO "authenticated"
  USING (true);

-- Create full access policy for service role
CREATE POLICY "Allow service role to manage ga4 bronze"
  ON "public"."j_rep_ga4_bronze"
  USING (true);

-- Grant permissions
GRANT ALL ON TABLE "public"."j_rep_ga4_bronze" TO "anon";
GRANT ALL ON TABLE "public"."j_rep_ga4_bronze" TO "authenticated";
GRANT ALL ON TABLE "public"."j_rep_ga4_bronze" TO "service_role";
