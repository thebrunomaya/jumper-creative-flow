-- ============================================
-- Add version_type Column to Deck Versions
-- ============================================
-- Purpose: Differentiate between types of deck versions:
--   - 'original': Initial generation (v1)
--   - 'refined': AI refinement (minor changes via j_hub_deck_refine)
--   - 'regenerated': Complete regeneration from new markdown (via j_hub_deck_regenerate)
--
-- Related: v2.1.23 - Markdown Editing & Regeneration System
-- ============================================

-- Add version_type column with enum constraint
ALTER TABLE j_hub_deck_versions
ADD COLUMN version_type TEXT NOT NULL DEFAULT 'original'
CHECK (version_type IN ('original', 'refined', 'regenerated'));

-- Add index for filtering by version type
CREATE INDEX idx_deck_versions_type ON j_hub_deck_versions(version_type);

-- Comment for documentation
COMMENT ON COLUMN j_hub_deck_versions.version_type IS 'Type of version: original (v1), refined (AI minor changes), regenerated (full regeneration from new markdown)';

-- ============================================
-- Backfill Existing Versions
-- ============================================
-- Set existing versions to correct type based on data:
-- - v1 with no refinement_prompt → 'original'
-- - v2+ with refinement_prompt → 'refined'

-- Update v1 versions (initial generation)
UPDATE j_hub_deck_versions
SET version_type = 'original'
WHERE version_number = 1
  AND refinement_prompt IS NULL;

-- Update v2+ versions with refinement prompts (refinements)
UPDATE j_hub_deck_versions
SET version_type = 'refined'
WHERE version_number > 1
  AND refinement_prompt IS NOT NULL;
