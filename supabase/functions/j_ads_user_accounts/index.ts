import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const targetEmail = (user.email || '').toLowerCase();

    console.log('🔍 Finding accounts for user:', targetEmail);

    // Step 1: Find manager by email in the complete managers table
    const { data: managerData, error: managerError } = await service
      .from('j_ads_notion_db_managers')
      .select('"E-Mail", "Contas", notion_id')
      .ilike('"E-Mail"', targetEmail)
      .maybeSingle();

    if (managerError) {
      console.error('Error finding manager:', managerError);
      return new Response(JSON.stringify({ success: false, error: 'Error finding manager data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!managerData) {
      console.log('❌ No manager found for email:', targetEmail);
      return new Response(
        JSON.stringify({ 
          success: true, 
          accounts: [], 
          email: targetEmail, 
          note: 'No manager entry found for user email' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Manager found:', managerData);

    // Step 2: Parse account IDs from "Contas" field (comma-separated relation IDs)
    const contasField = managerData["Contas"] || "";
    const accountIds: string[] = contasField 
      ? contasField.split(',').map((id: string) => id.trim()).filter(Boolean)
      : [];

    console.log('📋 Account IDs from manager:', accountIds);

    if (accountIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          accounts: [], 
          email: targetEmail,
          note: 'Manager has no linked accounts' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Get complete account data from the synchronized accounts table
    const { data: accountsData, error: accountsError } = await service
      .from('j_ads_notion_db_accounts')
      .select('*')
      .in('notion_id', accountIds);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return new Response(JSON.stringify({ success: false, error: 'Error fetching account data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Found ${accountsData?.length || 0} accounts`);

    // Step 4: Format accounts data for the frontend
    const formattedAccounts = (accountsData || []).map((account: any) => ({
      id: account.notion_id,
      name: account["Conta"] || 'Sem nome',
      objectives: account["Objetivos"] ? account["Objetivos"].split(', ').filter(Boolean) : [],
      // Include other fields that might be useful
      status: account["Status"],
      tier: account["Tier"],
      gestor: account["Gestor"],
      supervisor: account["Supervisor"],
      canal_sowork: account["Canal SoWork"],
      id_meta_ads: account["ID Meta Ads"],
      meta_ads_id: account["ID Meta Ads"], // Add duplicate key for consistency
      id_google_ads: account["ID Google Ads"],
    }));

    console.log('📊 Formatted accounts:', formattedAccounts);

    return new Response(
      JSON.stringify({ 
        success: true, 
        accounts: formattedAccounts,
        account_ids: accountIds, // Also return raw IDs for compatibility
        email: targetEmail,
        source: 'complete_sync'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Complete accounts error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});