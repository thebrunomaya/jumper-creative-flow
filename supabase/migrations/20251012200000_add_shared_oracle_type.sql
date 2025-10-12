-- Migration: Add shared_oracle_type to j_hub_optimization_recordings
-- Purpose: Store which oracle format was selected for public sharing
-- Author: Claude Code + Bruno Maya
-- Date: 2025-10-12

-- Add column to track which oracle was shared
ALTER TABLE j_hub_optimization_recordings
ADD COLUMN IF NOT EXISTS shared_oracle_type TEXT DEFAULT 'orfeu'
CHECK (shared_oracle_type IN ('delfos', 'orfeu', 'nostradamus'));

-- Add comment explaining the column
COMMENT ON COLUMN j_hub_optimization_recordings.shared_oracle_type IS
'Stores which oracle format (delfos/orfeu/nostradamus) was selected when creating the public share link. Default is "orfeu" (narrative) as most clients are non-technical.';

-- Create index for faster queries on shared oracle type
CREATE INDEX IF NOT EXISTS idx_optimization_recordings_shared_oracle
ON j_hub_optimization_recordings(shared_oracle_type)
WHERE share_enabled = true;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- shared_oracle_type column added with CHECK constraint
-- Default is 'orfeu' (narrative format for non-technical clients)
-- Index created for performance on public share queries
-- ============================================================================
