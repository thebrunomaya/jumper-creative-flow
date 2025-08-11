-- Secure the accounts table by enabling Row Level Security (RLS)
-- This prevents anonymous/public access via the API. Edge Functions using the service role key remain unaffected.

-- Enable RLS on accounts
alter table public.accounts enable row level security;

-- Note: No policies are created intentionally to keep the table fully restricted.
-- If in the future you need selective access, create explicit policies or a sanitized view with appropriate RLS.
