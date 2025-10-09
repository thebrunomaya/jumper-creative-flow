-- ============================================
-- RLS: Secure j_rep_metaads_bronze table
-- Created: 2025-10-10
-- ============================================
--
-- SECURITY ISSUE: j_rep_metaads_bronze table has NO RLS
-- Any authenticated user can see ALL Meta Ads data from ALL accounts
--
-- This migration implements Row Level Security:
-- 1. Users see only data from their assigned accounts
-- 2. Admins see all data
-- 3. Staff (Gestor/Supervisor) see their managed accounts
-- 4. Clients see accounts they manage (via notion_manager_id)

-- Enable Row Level Security
ALTER TABLE j_rep_metaads_bronze ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their account metrics" ON j_rep_metaads_bronze;
DROP POLICY IF EXISTS "Admins can manage all metrics" ON j_rep_metaads_bronze;

-- Policy 1: Users can view only their account metrics
CREATE POLICY "Users can view their account metrics"
ON j_rep_metaads_bronze
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT notion_id
    FROM j_ads_notion_db_accounts a
    WHERE
      -- Admin sees all accounts
      EXISTS (
        SELECT 1 FROM j_ads_users
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR
      -- Staff (Gestor) sees their managed accounts
      (a."Gestor" ILIKE '%' || (
        SELECT email FROM j_ads_users WHERE id = auth.uid()
      ) || '%')
      OR
      -- Staff (Supervisor/Atendimento) sees their accounts
      (a."Atendimento" ILIKE '%' || (
        SELECT email FROM j_ads_users WHERE id = auth.uid()
      ) || '%')
      OR
      -- Client sees accounts they manage
      (a."Gerente" = (
        SELECT notion_manager_id FROM j_ads_users WHERE id = auth.uid()
      ))
  )
);

-- Policy 2: Admins can manage all data (INSERT/UPDATE/DELETE)
CREATE POLICY "Admins can manage all metrics"
ON j_rep_metaads_bronze
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Comment for documentation
COMMENT ON TABLE j_rep_metaads_bronze IS 'Meta Ads metrics data with RLS - users see only their assigned accounts';

-- Verification queries (run after migration):
--
-- As regular user (should see only their accounts):
-- SELECT DISTINCT account_id FROM j_rep_metaads_bronze;
--
-- As admin (should see all accounts):
-- SELECT DISTINCT account_id FROM j_rep_metaads_bronze;
