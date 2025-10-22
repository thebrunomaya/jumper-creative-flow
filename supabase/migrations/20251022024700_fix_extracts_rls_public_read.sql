-- Fix RLS policies for j_hub_optimization_extracts
-- Allow all authenticated users to view all extracts (read-only for non-owners)

-- Drop restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own extracts" ON j_hub_optimization_extracts;

-- Create new public SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can view all extracts"
  ON j_hub_optimization_extracts
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep restrictive UPDATE policy (only owner or admin)
-- (existing policies for UPDATE remain unchanged)

COMMENT ON POLICY "Authenticated users can view all extracts" ON j_hub_optimization_extracts IS
  'Allow all authenticated users to view extracts (needed for Optimization executive panel)';
