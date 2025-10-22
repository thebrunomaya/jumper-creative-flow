-- Fix RLS policies for j_hub_optimization_recordings
-- Allow all authenticated users to view all recordings (read-only for non-owners)

-- Drop restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own recordings" ON j_hub_optimization_recordings;

-- Create new public SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can view all recordings"
  ON j_hub_optimization_recordings
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep restrictive UPDATE/DELETE policies (only owner or admin)
-- (existing policies for UPDATE/DELETE remain unchanged)

COMMENT ON POLICY "Authenticated users can view all recordings" ON j_hub_optimization_recordings IS
  'Allow all authenticated users to view recordings (needed for Optimization executive panel)';
