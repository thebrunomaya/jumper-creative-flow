-- ============================================
-- Add Version Tracking to Decks
-- ============================================
-- Purpose: Track which version is currently "active" for each deck
--
-- Features:
-- - current_version: Which version number is displayed (default: latest)
-- - is_refined: Quick flag to indicate if deck has been manually refined
--
-- Related: v2.1.14 - Iterative AI Refinement System
-- ============================================

-- Add current_version column
ALTER TABLE j_hub_decks
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1 CHECK (current_version > 0);

-- Add is_refined flag (quick indicator)
ALTER TABLE j_hub_decks
ADD COLUMN IF NOT EXISTS is_refined BOOLEAN DEFAULT FALSE;

-- Comments
COMMENT ON COLUMN j_hub_decks.current_version IS 'Version number currently displayed/shared (usually latest, but can be rolled back)';
COMMENT ON COLUMN j_hub_decks.is_refined IS 'TRUE if deck has been refined at least once (has versions > 1)';

-- ============================================
-- Helper Function: Update Current Version
-- ============================================

CREATE OR REPLACE FUNCTION update_deck_current_version(
  p_deck_id UUID,
  p_version_number INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify version exists
  IF NOT EXISTS (
    SELECT 1 FROM j_hub_deck_versions
    WHERE deck_id = p_deck_id AND version_number = p_version_number
  ) THEN
    RAISE EXCEPTION 'Version % does not exist for deck %', p_version_number, p_deck_id;
  END IF;

  -- Update current version
  UPDATE j_hub_decks
  SET
    current_version = p_version_number,
    is_refined = (p_version_number > 1),
    updated_at = NOW()
  WHERE id = p_deck_id;

  -- Update html_output to match this version
  UPDATE j_hub_decks d
  SET html_output = v.html_output
  FROM j_hub_deck_versions v
  WHERE d.id = p_deck_id
    AND v.deck_id = p_deck_id
    AND v.version_number = p_version_number;
END;
$$;

COMMENT ON FUNCTION update_deck_current_version IS 'Sets the current active version for a deck (enables rollback to previous versions)';

-- ============================================
-- Trigger: Auto-increment version on refinement
-- ============================================

CREATE OR REPLACE FUNCTION auto_set_refined_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_version INTEGER;
BEGIN
  -- Get max version for this deck
  SELECT MAX(version_number)
  INTO v_max_version
  FROM j_hub_deck_versions
  WHERE deck_id = NEW.deck_id;

  -- If more than 1 version exists, mark as refined
  IF v_max_version > 1 THEN
    UPDATE j_hub_decks
    SET is_refined = TRUE
    WHERE id = NEW.deck_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_set_refined_flag
  AFTER INSERT ON j_hub_deck_versions
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_refined_flag();

COMMENT ON TRIGGER trigger_auto_set_refined_flag ON j_hub_deck_versions IS 'Automatically sets is_refined=TRUE when new versions are created';
