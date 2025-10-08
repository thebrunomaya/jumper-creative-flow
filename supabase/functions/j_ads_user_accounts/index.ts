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

    // DEBUG: Log full user structure to understand where provider comes from
    console.log('📋 User metadata DEBUG:', JSON.stringify({
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      identities: user.identities?.map(i => ({ provider: i.provider, id: i.id }))
    }, null, 2));

    // DUAL ACCESS LOGIC: Detect if login came from Notion OAuth or Email/Password
    // Check multiple possible locations for provider info
    const isNotionOAuth =
      user.app_metadata?.provider === 'notion' ||
      user.app_metadata?.providers?.includes('notion') ||
      user.identities?.some(identity => identity.provider === 'notion');

    console.log('🔐 Login method:', isNotionOAuth ? 'Notion OAuth' : 'Email/Password');
    console.log('🔍 Detection details:', {
      'app_metadata.provider': user.app_metadata?.provider,
      'app_metadata.providers': user.app_metadata?.providers,
      'identities': user.identities?.map(i => i.provider)
    });

    let accountIds: string[] = [];

    if (isNotionOAuth) {
      // NOTION OAUTH PATH: Find accounts where user is Gestor or Supervisor
      console.log('🎯 Notion OAuth detected - searching by Gestor/Supervisor fields');

      // Search in Gestor and Supervisor fields (which contain emails)
      const { data: accountsData, error: accountsError } = await service
        .from('j_ads_notion_db_accounts')
        .select('notion_id')
        .or(`"Gestor".ilike.%${targetEmail}%,"Supervisor".ilike.%${targetEmail}%`);

      if (accountsError) {
        console.error('Error finding accounts by Gestor/Supervisor:', accountsError);
        return new Response(JSON.stringify({ success: false, error: 'Error finding accounts' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      accountIds = (accountsData || []).map((acc: any) => acc.notion_id);
      console.log(`✅ Found ${accountIds.length} accounts via Gestor/Supervisor`);

    } else {
      // EMAIL/PASSWORD PATH: Use existing logic (DB_Gerentes)
      console.log('📧 Email/Password detected - searching in DB_Gerentes');

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

      if (managerData) {
        console.log('✅ Manager found:', managerData);
        const contasField = managerData["Contas"] || "";
        accountIds = contasField
          ? contasField.split(',').map((id: string) => id.trim()).filter(Boolean)
          : [];
        console.log('📋 Account IDs from manager:', accountIds);
      } else {
        console.log('❌ No manager found for email:', targetEmail);
      }
    }

    // If no accounts found, return empty result
    if (accountIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          accounts: [],
          email: targetEmail,
          login_method: isNotionOAuth ? 'notion_oauth' : 'email_password',
          note: isNotionOAuth
            ? 'No accounts found where user is Gestor or Supervisor'
            : 'No manager entry found or manager has no linked accounts'
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

    // Step 4: Resolve names for Gestor, Supervisor, and Gerente
    // Collect all unique emails and notion_ids to lookup
    const gestorEmails = new Set<string>();
    const supervisorEmails = new Set<string>();
    const gerenteIds = new Set<string>();

    (accountsData || []).forEach((account: any) => {
      if (account["Gestor"]) {
        account["Gestor"].split(',').forEach((email: string) => {
          const trimmed = email.trim();
          if (trimmed) gestorEmails.add(trimmed);
        });
      }
      if (account["Supervisor"]) {
        account["Supervisor"].split(',').forEach((email: string) => {
          const trimmed = email.trim();
          if (trimmed) supervisorEmails.add(trimmed);
        });
      }
      if (account["Gerente"]) {
        account["Gerente"].split(',').forEach((id: string) => {
          const trimmed = id.trim();
          if (trimmed) gerenteIds.add(trimmed);
        });
      }
    });

    // Fetch all managers at once
    const allEmails = [...gestorEmails, ...supervisorEmails];
    const allIds = [...gerenteIds];

    // Build OR filter for emails and IDs
    let managersQuery = service
      .from('j_ads_notion_db_managers')
      .select('notion_id, "E-Mail", "Nome"');

    if (allEmails.length > 0 && allIds.length > 0) {
      // Both emails and IDs exist
      managersQuery = managersQuery.or(`"E-Mail".in.(${allEmails.join(',')}),notion_id.in.(${allIds.join(',')})`);
    } else if (allEmails.length > 0) {
      // Only emails
      managersQuery = managersQuery.in('"E-Mail"', allEmails);
    } else if (allIds.length > 0) {
      // Only IDs
      managersQuery = managersQuery.in('notion_id', allIds);
    }

    const { data: managersData } = await managersQuery;

    // Create lookup maps
    const emailToName = new Map<string, string>();
    const idToName = new Map<string, string>();

    (managersData || []).forEach((manager: any) => {
      if (manager["E-Mail"] && manager["Nome"]) {
        emailToName.set(manager["E-Mail"].toLowerCase().trim(), manager["Nome"]);
      }
      if (manager.notion_id && manager["Nome"]) {
        idToName.set(manager.notion_id, manager["Nome"]);
      }
    });

    console.log('📋 Manager lookups created:', {
      emailToName: emailToName.size,
      idToName: idToName.size
    });

    // Step 5: Format accounts data with resolved names
    const formattedAccounts = (accountsData || []).map((account: any) => {
      // Resolve Gestor emails to names
      const gestorNames = account["Gestor"]
        ? account["Gestor"].split(',')
            .map((email: string) => emailToName.get(email.trim().toLowerCase()) || email.trim())
            .join(', ')
        : undefined;

      // Resolve Supervisor emails to names
      const supervisorNames = account["Supervisor"]
        ? account["Supervisor"].split(',')
            .map((email: string) => emailToName.get(email.trim().toLowerCase()) || email.trim())
            .join(', ')
        : undefined;

      // Resolve Gerente notion_ids to names
      const gerenteNames = account["Gerente"]
        ? account["Gerente"].split(',')
            .map((id: string) => idToName.get(id.trim()) || id.trim())
            .join(', ')
        : undefined;

      return {
        id: account.notion_id,
        name: account["Conta"] || 'Sem nome',
        objectives: account["Objetivos"] ? account["Objetivos"].split(', ').filter(Boolean) : [],
        status: account["Status"],
        tier: account["Tier"],
        gestor: gestorNames, // Names resolved from emails
        supervisor: supervisorNames, // Names resolved from emails
        gerente: gerenteNames, // Names resolved from notion_ids
        gestor_email: account["Gestor"], // Keep original emails for matching
        supervisor_email: account["Supervisor"], // Keep original emails for matching
        canal_sowork: account["Canal SoWork"],
        id_meta_ads: account["ID Meta Ads"],
        meta_ads_id: account["ID Meta Ads"],
        id_google_ads: account["ID Google Ads"],
      };
    });

    console.log('📊 Formatted accounts with names:', formattedAccounts);

    return new Response(
      JSON.stringify({
        success: true,
        accounts: formattedAccounts,
        account_ids: accountIds, // Also return raw IDs for compatibility
        email: targetEmail,
        login_method: isNotionOAuth ? 'notion_oauth' : 'email_password',
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