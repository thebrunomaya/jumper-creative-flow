-- ============================================
-- Deck Versioning System
-- ============================================
-- Purpose: Enable version history and iterative refinement of generated decks
--
-- Features:
-- - Track all versions of each deck (v1, v2, v3, ...)
-- - Store refinement prompts (what user asked AI to change)
-- - Store changes summary (what was actually changed)
-- - Enable rollback to previous versions
-- - Enable version comparison
--
-- Related: v2.1.14 - Iterative AI Refinement System
-- ============================================

-- Create deck versions table
CREATE TABLE IF NOT EXISTS j_hub_deck_versions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES j_hub_decks(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),

  -- Version content
  html_output TEXT NOT NULL, -- Snapshot of HTML at this version

  -- Refinement tracking
  refinement_prompt TEXT, -- Textual feedback from user (NULL for v1 - original generation)
  changes_summary TEXT, -- AI-generated summary of what changed

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(deck_id, version_number)
);

-- Indexes for performance
CREATE INDEX idx_deck_versions_deck_id ON j_hub_deck_versions(deck_id);
CREATE INDEX idx_deck_versions_created_at ON j_hub_deck_versions(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE j_hub_deck_versions IS 'Version history for generated decks - enables iterative refinement and rollback';
COMMENT ON COLUMN j_hub_deck_versions.version_number IS 'Sequential version number (1, 2, 3, ...) - v1 is original generation';
COMMENT ON COLUMN j_hub_deck_versions.refinement_prompt IS 'User feedback that triggered this version (e.g., "Make title bigger on slide 3")';
COMMENT ON COLUMN j_hub_deck_versions.changes_summary IS 'AI-generated summary of changes applied';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE j_hub_deck_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of their own decks
CREATE POLICY "Users can view their own deck versions"
  ON j_hub_deck_versions FOR SELECT
  USING (
    deck_id IN (
      SELECT id FROM j_hub_decks WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all deck versions
CREATE POLICY "Admins can view all deck versions"
  ON j_hub_deck_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only service role can insert/update versions
-- (Versions are created by Edge Functions, not directly by users)
CREATE POLICY "Service role can manage versions"
  ON j_hub_deck_versions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Helper Function: Get Latest Version Number
-- ============================================

CREATE OR REPLACE FUNCTION get_latest_version_number(p_deck_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_latest INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0)
  INTO v_latest
  FROM j_hub_deck_versions
  WHERE deck_id = p_deck_id;

  RETURN v_latest;
END;
$$;

COMMENT ON FUNCTION get_latest_version_number IS 'Returns the latest version number for a deck (0 if no versions exist)';
