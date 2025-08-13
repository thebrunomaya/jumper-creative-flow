// Deno Edge Function: get-accounts-safe
// Returns sanitized account data for authorized users (admin or manager roles)
// CORS enabled. Requires a valid JWT.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Client with the caller's JWT to get user info
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      console.error('get-accounts-safe: auth.getUser error', userErr);
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = userData.user;

    // Admin client to read roles and accounts (bypasses RLS)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check roles for this user
    const { data: roles, error: rolesError } = await adminClient
      .from('j_ads_user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('get-accounts-safe: roles error', rolesError);
      return new Response(JSON.stringify({ error: 'Role verification failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const roleSet = new Set((roles ?? []).map((r: any) => r.role));
    const isAllowed = roleSet.has('admin') || roleSet.has('manager');

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch sanitized accounts data
    const { data: accounts, error: accError } = await adminClient
      .from('accounts')
      .select('name, status, manager, account_manager, tier')
      .order('name', { ascending: true });

    if (accError) {
      console.error('get-accounts-safe: accounts error', accError);
      return new Response(JSON.stringify({ error: 'Failed to fetch accounts' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Explicitly map to ensure only safe fields
    const safe = (accounts ?? []).map((a: any) => ({
      name: a.name ?? null,
      status: a.status ?? null,
      manager: a.manager ?? null,
      account_manager: a.account_manager ?? null,
      tier: a.tier ?? null,
    }));

    return new Response(JSON.stringify({ data: safe }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    console.error('get-accounts-safe: unexpected error', e);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
