-- Add public sharing capabilities to optimization recordings
-- Migration: 20251010120000_add_optimization_sharing.sql

-- Add columns for public sharing
ALTER TABLE j_ads_optimization_recordings
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_created_at TIMESTAMPTZ;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_optimization_recordings_public_slug
  ON j_ads_optimization_recordings(public_slug)
  WHERE public_slug IS NOT NULL;

-- Create index for enabled shares
CREATE INDEX IF NOT EXISTS idx_optimization_recordings_share_enabled
  ON j_ads_optimization_recordings(share_enabled)
  WHERE share_enabled = true;

-- Add comment for documentation
COMMENT ON COLUMN j_ads_optimization_recordings.public_slug IS 'Unique slug for public URL (e.g., "clinicaseven-10out2025-abc123")';
COMMENT ON COLUMN j_ads_optimization_recordings.password_hash IS 'Bcrypt hash of the share password';
COMMENT ON COLUMN j_ads_optimization_recordings.share_enabled IS 'Whether public sharing is enabled for this optimization';
COMMENT ON COLUMN j_ads_optimization_recordings.share_expires_at IS 'Optional expiration timestamp for the share link';
COMMENT ON COLUMN j_ads_optimization_recordings.share_created_at IS 'When the share was created';
