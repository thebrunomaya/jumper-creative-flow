-- Fix RLS policies for optimization tables to allow admins to view ALL data
-- Issue: Admins couldn't view transcripts/context from recordings made by other users
-- Date: 2025-10-15

-- ============================================================================
-- j_hub_optimization_transcripts - Add admin policy
-- ============================================================================

-- Create policy for admins to view all transcripts
CREATE POLICY "Admins can view all transcripts"
ON j_hub_optimization_transcripts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM j_hub_users
    WHERE j_hub_users.id = auth.uid()
    AND j_hub_users.role = 'admin'
  )
);

-- Create policy for admins to update all transcripts
CREATE POLICY "Admins can update all transcripts"
ON j_hub_optimization_transcripts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM j_hub_users
    WHERE j_hub_users.id = auth.uid()
    AND j_hub_users.role = 'admin'
  )
);

-- ============================================================================
-- j_hub_optimization_context - Add admin policy
-- ============================================================================

-- Create policy for admins to view all context
CREATE POLICY "Admins can view all context"
ON j_hub_optimization_context
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM j_hub_users
    WHERE j_hub_users.id = auth.uid()
    AND j_hub_users.role = 'admin'
  )
);

-- Create policy for admins to update all context
CREATE POLICY "Admins can update all context"
ON j_hub_optimization_context
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM j_hub_users
    WHERE j_hub_users.id = auth.uid()
    AND j_hub_users.role = 'admin'
  )
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Admins can view all transcripts" ON j_hub_optimization_transcripts IS
'Allows admin users to view transcripts from all recordings, not just their own';

COMMENT ON POLICY "Admins can update all transcripts" ON j_hub_optimization_transcripts IS
'Allows admin users to edit transcripts from all recordings, not just their own';

COMMENT ON POLICY "Admins can view all context" ON j_hub_optimization_context IS
'Allows admin users to view analysis context from all recordings, not just their own';

COMMENT ON POLICY "Admins can update all context" ON j_hub_optimization_context IS
'Allows admin users to edit analysis context from all recordings, not just their own';
