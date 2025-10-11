-- ============================================
-- ADD USER ACTIVITY TRACKING
-- Created: 2025-10-11
-- ============================================
--
-- This migration adds tracking columns to j_ads_users
-- to monitor user activity and status.
--
-- Changes:
-- - Add last_login_at (timestamp of last login)
-- - Add login_count (total number of logins)
-- - Add is_active (whether account is active)
-- - Add deactivated_at (when account was deactivated)
-- - Add deactivated_by (admin who deactivated)
--
-- ⚠️ NOTE: This is an additive migration (no data loss)

-- Add activity tracking columns
ALTER TABLE j_ads_users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES j_ads_users(id);

-- Add helpful comments
COMMENT ON COLUMN j_ads_users.last_login_at IS 'Timestamp of the user''s last login';
COMMENT ON COLUMN j_ads_users.login_count IS 'Total number of successful logins';
COMMENT ON COLUMN j_ads_users.is_active IS 'Whether the user account is active (true) or deactivated (false)';
COMMENT ON COLUMN j_ads_users.deactivated_at IS 'Timestamp when the account was deactivated';
COMMENT ON COLUMN j_ads_users.deactivated_by IS 'Admin user ID who deactivated this account';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_last_login ON j_ads_users(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON j_ads_users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_inactive ON j_ads_users(deactivated_at DESC) WHERE is_active = false;

-- Set all existing users as active (default state)
UPDATE j_ads_users SET is_active = true WHERE is_active IS NULL;

-- Verification query (run after migration):
-- SELECT id, email, role, is_active, last_login_at, login_count FROM j_ads_users ORDER BY created_at DESC LIMIT 10;
