-- Enable RLS on j_ads_notion_db_managers table
ALTER TABLE j_ads_notion_db_managers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read their own manager data" ON j_ads_notion_db_managers;
DROP POLICY IF EXISTS "Admins can read all manager data" ON j_ads_notion_db_managers;

-- Policy 1: Allow authenticated users to read their own manager record
-- This allows users to fetch their display name from the database
-- Using lower() for case-insensitive comparison
CREATE POLICY "Users can read their own manager data"
ON j_ads_notion_db_managers
FOR SELECT
TO authenticated
USING (
  lower(auth.jwt() ->> 'email') = lower("E-Mail")
);

-- Policy 2: Allow admins to read all manager data
CREATE POLICY "Admins can read all manager data"
ON j_ads_notion_db_managers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Comment for documentation
COMMENT ON TABLE j_ads_notion_db_managers IS 'Notion-synced managers table with RLS policies allowing users to read their own data and admins to read all data';
