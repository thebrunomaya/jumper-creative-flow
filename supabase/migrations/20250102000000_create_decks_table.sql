-- Create j_hub_decks table for presentation system
-- Migration created: 2024-11-02

CREATE TABLE IF NOT EXISTS j_hub_decks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES j_hub_users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES j_hub_notion_db_accounts(id) ON DELETE SET NULL,

  -- Deck Configuration
  type TEXT NOT NULL CHECK (type IN ('report', 'mediaplan', 'pitch')),
  brand_identity TEXT NOT NULL CHECK (brand_identity IN ('jumper', 'koko', 'tyaro')),
  template_id TEXT NOT NULL, -- e.g., 'report-sales', 'mediaplan-launch'

  -- Content
  title TEXT NOT NULL,
  markdown_source TEXT NOT NULL,
  html_output TEXT, -- Cached HTML for quick access
  file_url TEXT,    -- URL in Supabase Storage (if uploaded)

  -- Sharing Configuration (like optimization shares)
  slug TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash TEXT, -- Optional password protection

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_decks_user_id
  ON j_hub_decks(user_id);

CREATE INDEX IF NOT EXISTS idx_decks_account_id
  ON j_hub_decks(account_id)
  WHERE account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_decks_slug
  ON j_hub_decks(slug)
  WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_decks_brand_identity
  ON j_hub_decks(brand_identity);

CREATE INDEX IF NOT EXISTS idx_decks_type
  ON j_hub_decks(type);

CREATE INDEX IF NOT EXISTS idx_decks_created_at
  ON j_hub_decks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE j_hub_decks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own decks
CREATE POLICY "Users can view own decks"
  ON j_hub_decks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own decks
CREATE POLICY "Users can create own decks"
  ON j_hub_decks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own decks
CREATE POLICY "Users can update own decks"
  ON j_hub_decks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own decks
CREATE POLICY "Users can delete own decks"
  ON j_hub_decks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Public decks are viewable by anyone (for shared links)
CREATE POLICY "Public decks viewable by anyone"
  ON j_hub_decks
  FOR SELECT
  USING (is_public = true);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_j_hub_decks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_j_hub_decks_updated_at
  BEFORE UPDATE ON j_hub_decks
  FOR EACH ROW
  EXECUTE FUNCTION update_j_hub_decks_updated_at();

-- Add comments for documentation
COMMENT ON TABLE j_hub_decks IS 'Stores generated presentation decks (reports, media plans, pitches)';
COMMENT ON COLUMN j_hub_decks.type IS 'Type of deck: report, mediaplan, or pitch';
COMMENT ON COLUMN j_hub_decks.brand_identity IS 'Brand identity: jumper, koko, or tyaro';
COMMENT ON COLUMN j_hub_decks.template_id IS 'Template identifier used for generation';
COMMENT ON COLUMN j_hub_decks.markdown_source IS 'Original markdown input from user';
COMMENT ON COLUMN j_hub_decks.html_output IS 'Generated HTML presentation (cached)';
COMMENT ON COLUMN j_hub_decks.file_url IS 'Public URL in Supabase Storage if uploaded';
COMMENT ON COLUMN j_hub_decks.slug IS 'Unique slug for public sharing (e.g., /decks/share/abc123)';
COMMENT ON COLUMN j_hub_decks.is_public IS 'Whether deck is publicly accessible via slug';
COMMENT ON COLUMN j_hub_decks.password_hash IS 'Optional bcrypt hash for password-protected decks';
