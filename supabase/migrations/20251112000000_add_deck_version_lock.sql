-- Migration: Add version locking mechanism for concurrent deck refinements
-- Date: 2024-11-12
-- Purpose: Prevent race conditions when multiple users refine the same deck simultaneously

-- ============================================================================
-- FUNCTION: get_next_version_number
-- ============================================================================
-- Returns the next available version number for a deck with pessimistic locking
-- Uses FOR UPDATE to prevent concurrent transactions from getting the same number
--
-- Parameters:
--   p_deck_id: UUID of the deck
--
-- Returns:
--   INTEGER: Next version number (e.g., if max is 3, returns 4)
--
-- Usage:
--   SELECT get_next_version_number('deck-uuid-here');
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_version_number(p_deck_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  -- Get the maximum version number with a lock to prevent race conditions
  -- FOR UPDATE locks the selected rows until the transaction commits
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM j_hub_deck_versions
  WHERE deck_id = p_deck_id
  FOR UPDATE;

  -- Log the version number generation
  RAISE LOG 'Generated next version number % for deck %', v_next_version, p_deck_id;

  RETURN v_next_version;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_version_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_version_number(UUID) TO service_role;

-- ============================================================================
-- INDEX: Improve version lookup performance
-- ============================================================================
-- Composite index on (deck_id, version_number) for faster lookups
-- Used by: get_next_version_number, version history queries

CREATE INDEX IF NOT EXISTS idx_deck_versions_deck_version
  ON j_hub_deck_versions(deck_id, version_number DESC);

-- Comment for documentation
COMMENT ON INDEX idx_deck_versions_deck_version IS
  'Optimizes version number lookups for concurrent refinement operations';

-- Comment on function for documentation
COMMENT ON FUNCTION get_next_version_number(UUID) IS
  'Atomically generates the next version number for a deck with pessimistic locking to prevent race conditions';
