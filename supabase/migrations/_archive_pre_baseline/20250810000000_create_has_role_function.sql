-- Create has_role helper function early so other migrations can use it
-- This function checks if a user has a specific role

-- First ensure j_ads_users table exists (it should from earlier migration)
CREATE TABLE IF NOT EXISTS j_ads_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'gestor', 'supervisor', 'gerente', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create has_role function
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM j_ads_users
    WHERE id = _user_id AND role = _role
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;
