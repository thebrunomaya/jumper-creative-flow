-- ============================================
-- CREATE USER AUDIT LOG
-- Created: 2025-10-11
-- ============================================
--
-- This migration creates an audit log table to track
-- all administrative actions on user accounts.
--
-- Tracks:
-- - Role changes
-- - Account deactivation/reactivation
-- - Password resets
-- - Any other admin actions
--
-- ⚠️ NOTE: This creates a new table (no impact on existing data)

-- Create audit log table
CREATE TABLE IF NOT EXISTS j_ads_user_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who was affected
  user_id UUID REFERENCES j_ads_users(id) ON DELETE SET NULL,
  user_email TEXT, -- Denormalized for historical record

  -- Who performed the action
  admin_id UUID REFERENCES j_ads_users(id) ON DELETE SET NULL,
  admin_email TEXT, -- Denormalized for historical record

  -- What action was performed
  action TEXT NOT NULL, -- 'role_changed', 'deactivated', 'reactivated', 'password_reset', etc.

  -- Details of the change
  old_value JSONB, -- Previous state (e.g., {"role": "user"})
  new_value JSONB, -- New state (e.g., {"role": "staff"})

  -- Optional reason/notes
  reason TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (action IN (
    'role_changed',
    'deactivated',
    'reactivated',
    'password_reset',
    'user_created',
    'user_deleted',
    'forced_logout'
  ))
);

-- Add helpful comments
COMMENT ON TABLE j_ads_user_audit_log IS 'Tracks all administrative actions on user accounts for security and compliance';
COMMENT ON COLUMN j_ads_user_audit_log.user_id IS 'ID of the user who was affected by the action';
COMMENT ON COLUMN j_ads_user_audit_log.admin_id IS 'ID of the admin who performed the action';
COMMENT ON COLUMN j_ads_user_audit_log.action IS 'Type of action performed';
COMMENT ON COLUMN j_ads_user_audit_log.old_value IS 'Previous state before the action (JSON)';
COMMENT ON COLUMN j_ads_user_audit_log.new_value IS 'New state after the action (JSON)';
COMMENT ON COLUMN j_ads_user_audit_log.reason IS 'Optional reason/notes provided by the admin';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_user ON j_ads_user_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON j_ads_user_audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON j_ads_user_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON j_ads_user_audit_log(created_at DESC);

-- ============================================
-- RLS POLICIES for j_ads_user_audit_log
-- ============================================

ALTER TABLE j_ads_user_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON j_ads_user_audit_log;
CREATE POLICY "Admins can view all audit logs"
ON j_ads_user_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can insert audit logs (typically done by Edge Functions)
DROP POLICY IF EXISTS "Admins can insert audit logs" ON j_ads_user_audit_log;
CREATE POLICY "Admins can insert audit logs"
ON j_ads_user_audit_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Users can view their own audit history
DROP POLICY IF EXISTS "Users can view their own audit logs" ON j_ads_user_audit_log;
CREATE POLICY "Users can view their own audit logs"
ON j_ads_user_audit_log
FOR SELECT
USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTION: Log audit action
-- ============================================

CREATE OR REPLACE FUNCTION log_user_action(
  p_user_id UUID,
  p_user_email TEXT,
  p_admin_id UUID,
  p_admin_email TEXT,
  p_action TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO j_ads_user_audit_log (
    user_id, user_email, admin_id, admin_email,
    action, old_value, new_value, reason
  ) VALUES (
    p_user_id, p_user_email, p_admin_id, p_admin_email,
    p_action, p_old_value, p_new_value, p_reason
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (Edge Functions will use this)
GRANT EXECUTE ON FUNCTION log_user_action TO authenticated;

-- Verification query (run after migration):
-- SELECT * FROM j_ads_user_audit_log ORDER BY created_at DESC LIMIT 10;
