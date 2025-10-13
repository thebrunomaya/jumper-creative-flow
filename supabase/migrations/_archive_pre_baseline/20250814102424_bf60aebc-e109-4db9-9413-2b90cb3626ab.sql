-- Rename table from j_ads_notion_manager_accounts to j_ads_notion_accounts
ALTER TABLE j_ads_notion_manager_accounts RENAME TO j_ads_notion_accounts;

-- Update RLS policy names to match new table name
DROP POLICY IF EXISTS "Admins can view j_ads_notion_manager_accounts" ON j_ads_notion_accounts;

CREATE POLICY "Admins can view j_ads_notion_accounts" 
ON j_ads_notion_accounts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));