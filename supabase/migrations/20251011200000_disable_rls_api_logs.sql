-- Disable RLS for j_ads_optimization_api_logs
-- This table is for admin debugging only, accessed via Edge Functions with service role key
-- No direct user access is needed

ALTER TABLE j_ads_optimization_api_logs DISABLE ROW LEVEL SECURITY;

-- Add comment explaining why RLS is disabled
COMMENT ON TABLE j_ads_optimization_api_logs IS
'API logs for debugging optimization steps. RLS disabled because table is accessed only by Edge Functions with service role key for admin debugging purposes.';
