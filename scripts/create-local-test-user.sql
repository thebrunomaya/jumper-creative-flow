-- Create test user for local development
-- Run this in Supabase Studio > SQL Editor

-- 1. Create auth user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  '40c24dcd-cfd0-4b44-b4b8-87fea59d3dd0',
  'bruno@jumper.studio',
  crypt('jumper123', gen_salt('bf')), -- Password: jumper123
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Bruno Maya"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create user identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  '40c24dcd-cfd0-4b44-b4b8-87fea59d3dd0',
  '40c24dcd-cfd0-4b44-b4b8-87fea59d3dd0',
  jsonb_build_object('sub', '40c24dcd-cfd0-4b44-b4b8-87fea59d3dd0', 'email', 'bruno@jumper.studio'),
  'email',
  now(),
  now(),
  now()
)
ON CONFLICT (id, provider) DO NOTHING;

-- 3. Create j_hub_users entry (admin role)
INSERT INTO public.j_hub_users (
  id,
  email,
  role,
  nome,
  created_at,
  updated_at
)
VALUES (
  '40c24dcd-cfd0-4b44-b4b8-87fea59d3dd0',
  'bruno@jumper.studio',
  'admin',
  'Bruno Maya',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Verification queries
SELECT 'Auth user created:' as status, id, email, email_confirmed_at FROM auth.users WHERE email = 'bruno@jumper.studio';
SELECT 'Hub user created:' as status, id, email, role, nome FROM public.j_hub_users WHERE email = 'bruno@jumper.studio';
