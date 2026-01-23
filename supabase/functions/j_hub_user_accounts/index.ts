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

    // Get user data from j_hub_users (role, nome, notion_user_id)
    const { data: userData, error: userError } = await service
      .from('j_hub_users')
      .select('role, nome, notion_user_id')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return new Response(JSON.stringify({ success: false, error: 'Error fetching user data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userRole = userData?.role || 'client';
    const userName = userData?.nome;
    const notionUserId = userData?.notion_user_id; // Workspace user ID for people field updates
    const isAdmin = userRole === 'admin';
    const isStaff = userRole === 'staff';
    const isClient = userRole === 'client';

    console.log('👤 User data:', { role: userRole, nome: userName, notion_user_id: notionUserId });
    console.log('👑 Is Admin:', isAdmin);

    // Log user metadata for debugging
    console.log('📋 User metadata:', {
      provider: user.app_metadata?.provider,
      identities: user.identities?.map(i => i.provider)
    });

    let accountIds: string[] = [];

    // ADMIN PATH: If user is admin, get ALL accounts
    if (isAdmin) {
      console.log('👑 Admin detected - fetching ALL accounts');

      const { data: allAccountsData, error: allAccountsError } = await service
        .from('j_hub_notion_db_accounts')
        .select('notion_id');

      if (allAccountsError) {
        console.error('Error finding all accounts:', allAccountsError);
        return new Response(JSON.stringify({ success: false, error: 'Error finding accounts' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      accountIds = (allAccountsData || []).map((acc: any) => acc.notion_id);
      console.log(`✅ Found ${accountIds.length} accounts (ADMIN ACCESS)`);

    } else if (isStaff) {
      // STAFF PATH: Find accounts where user is Gestor or Atendimento
      console.log('⚡ Staff detected - searching by Gestor/Atendimento fields');

      // Search in Gestor field
      const { data: gestorAccounts, error: gestorError } = await service
        .from('j_hub_notion_db_accounts')
        .select('notion_id, "Gestor"')
        .ilike('"Gestor"', `%${targetEmail}%`);

      if (gestorError) {
        console.error('Error finding accounts by Gestor:', gestorError);
      }

      // Search in Atendimento field (renamed from Supervisor)
      const { data: atendimentoAccounts, error: atendimentoError } = await service
        .from('j_hub_notion_db_accounts')
        .select('notion_id, "Atendimento"')
        .ilike('"Atendimento"', `%${targetEmail}%`);

      if (atendimentoError) {
        console.error('Error finding accounts by Atendimento:', atendimentoError);
      }

      console.log('🔍 Gestor accounts found:', gestorAccounts?.length || 0);
      console.log('🔍 Atendimento accounts found:', atendimentoAccounts?.length || 0);

      // Combine results and remove duplicates
      const allAccountIds = new Set<string>();
      (gestorAccounts || []).forEach((acc: any) => allAccountIds.add(acc.notion_id));
      (atendimentoAccounts || []).forEach((acc: any) => allAccountIds.add(acc.notion_id));

      accountIds = Array.from(allAccountIds);
      console.log(`✅ Found ${accountIds.length} unique accounts via Gestor/Atendimento`);

    } else if (isClient) {
      // CLIENT PATH: Find accounts via manager email matching
      // Step 1: Find manager in DB_Gerentes by email
      console.log('📝 Client detected - searching by email in DB_Gerentes');

      const { data: managerData, error: managerError } = await service
        .from('j_hub_notion_db_managers')
        .select('"E-Mail", "Contas", notion_id')
        .ilike('"E-Mail"', targetEmail)
        .maybeSingle();

      if (!managerError && managerData) {
        console.log('✅ Manager found in DB_Gerentes:', managerData);

        // Step 2: Get accounts from Contas field (relation IDs)
        const contasField = managerData["Contas"] || "";
        if (contasField) {
          accountIds = contasField.split(',').map((id: string) => id.trim()).filter(Boolean);
        }

        // Step 3: Also search in Gerente field by manager's notion_id
        const managerNotionId = managerData.notion_id;
        if (managerNotionId) {
          const { data: gerenteAccounts, error: gerenteError } = await service
            .from('j_hub_notion_db_accounts')
            .select('notion_id')
            .ilike('"Gerente"', `%${managerNotionId}%`);

          if (!gerenteError && gerenteAccounts) {
            for (const acc of gerenteAccounts) {
              if (!accountIds.includes(acc.notion_id)) {
                accountIds.push(acc.notion_id);
              }
            }
          }
        }

        console.log(`📋 Found ${accountIds.length} accounts for client`);
      } else {
        console.log('❌ No manager found for email:', targetEmail);
      }
    }

    // If no accounts found, return empty result (unless admin - that would be weird)
    if (accountIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          accounts: [],
          account_ids: [],
          account_notion_ids: [],
          email: targetEmail,
          is_admin: isAdmin,
          user_role: userRole,
          note: isAdmin
            ? 'No accounts in database (unexpected for admin)'
            : isStaff
              ? 'No accounts found where user is Gestor or Atendimento'
              : 'No manager entry found or manager has no linked accounts'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Get complete account data from the synchronized accounts table
    // Returns accounts sorted alphabetically by default for consistent UX across all pages
    const { data: accountsData, error: accountsError } = await service
      .from('j_hub_notion_db_accounts')
      .select('*')
      .in('notion_id', accountIds)
      .order('"Conta"', { ascending: true }); // Alphabetical sorting

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return new Response(JSON.stringify({ success: false, error: 'Error fetching account data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Found ${accountsData?.length || 0} accounts`);

    // Store notion_ids (TEXT) for legacy tables (j_hub_optimization_recordings)
    const accountNotionIds = (accountsData || []).map((acc: any) => acc.notion_id);

    // Convert notion_ids to UUIDs for foreign key compatibility
    // This ensures account_ids array contains UUIDs that match j_hub_decks.account_id FK
    accountIds = (accountsData || []).map((acc: any) => acc.id);
    console.log('🔄 Converted accountIds to UUIDs:', accountIds.length);

    // Step 4: Resolve names for Gestor, Atendimento, and Gerente
    // Collect all unique emails and notion_ids to lookup
    const gestorEmails = new Set<string>();
    const atendimentoEmails = new Set<string>();
    const gerenteIds = new Set<string>();

    (accountsData || []).forEach((account: any) => {
      if (account["Gestor"]) {
        account["Gestor"].split(',').forEach((email: string) => {
          const trimmed = email.trim();
          if (trimmed) gestorEmails.add(trimmed);
        });
      }
      if (account["Atendimento"]) {
        account["Atendimento"].split(',').forEach((email: string) => {
          const trimmed = email.trim();
          if (trimmed) atendimentoEmails.add(trimmed);
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
    const allEmails = [...gestorEmails, ...atendimentoEmails];
    const allIds = [...gerenteIds];

    // Build OR filter for emails and IDs
    let managersQuery = service
      .from('j_hub_notion_db_managers')
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

    // Step 4.5: For emails not found in managers table, lookup in j_hub_users
    const missingEmails = allEmails.filter(email => !emailToName.has(email.toLowerCase().trim()));

    if (missingEmails.length > 0) {
      console.log('🔍 Looking up missing emails in j_hub_users:', missingEmails.length);

      // Query j_hub_users for missing names (OAuth users like Gestors/Atendimento)
      const { data: usersData } = await service
        .from('j_hub_users')
        .select('email, nome')
        .in('email', missingEmails);

      (usersData || []).forEach((u: any) => {
        if (u.email && u.nome) {
          emailToName.set(u.email.toLowerCase().trim(), u.nome);
          console.log(`✅ Found name in j_hub_users for ${u.email}: ${u.nome}`);
        }
      });

      console.log('📋 Updated emailToName with j_hub_users data:', emailToName.size);
    }

    // Step 5: Format accounts data with resolved names
    const formattedAccounts = (accountsData || []).map((account: any) => {
      // Resolve Gestor emails to names
      const gestorNames = account["Gestor"]
        ? account["Gestor"].split(',')
            .map((email: string) => emailToName.get(email.trim().toLowerCase()) || email.trim())
            .join(', ')
        : undefined;

      // Resolve Atendimento emails to names
      const atendimentoNames = account["Atendimento"]
        ? account["Atendimento"].split(',')
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
        id: account.id, // UUID for foreign key references
        notion_id: account.notion_id, // Keep notion_id for backward compatibility
        name: account["Conta"] || 'Sem nome',
        objectives: account["Objetivos"] ? account["Objetivos"].split(', ').filter(Boolean) : [],
        nicho: account["Nicho"] ? account["Nicho"].split(', ').filter(Boolean) : [],
        status: account["Status"],
        tier: account["Tier"],
        gestor: gestorNames, // Names resolved from emails
        atendimento: atendimentoNames, // Names resolved from emails (renamed from supervisor)
        gerente: gerenteNames, // Names resolved from notion_ids
        gestor_email: account["Gestor"], // Keep original emails for matching
        atendimento_email: account["Atendimento"], // Keep original emails for matching (renamed from supervisor_email)
        canal_sowork: account["Canal SoWork"],
        id_meta_ads: account["ID Meta Ads"],
        meta_ads_id: account["ID Meta Ads"],
        id_google_ads: account["ID Google Ads"],
        id_tiktok_ads: account["ID Tiktok Ads"] || null,
        id_google_analytics: account["ID Google Analytics"] || null,
        contexto_otimizacao: account["Contexto para Otimização"] || null,
        contexto_transcricao: account["Contexto para Transcrição"] || null,
        payment_method: account["Método de Pagamento"] || null,
        meta_verba_mensal: account["META: Verba Mensal"] || null,
        gads_verba_mensal: account["G-ADS: Verba Mensal"] || null,
        woo_site_url: account["Woo Site URL"] || null,
        woo_consumer_key: account["Woo Consumer Key"] || null,
        woo_consumer_secret: account["Woo Consumer Secret"] || null,
        // Report configuration
        report_enabled: account.report_enabled || false,
        report_roas_target: account.report_roas_target || null,
        report_cpa_max: account.report_cpa_max || null,
        report_conv_min: account.report_conv_min || null,
        report_daily_target: account.report_daily_target || null,
        report_whatsapp_numbers: account.report_whatsapp_numbers || [],
      };
    });

    console.log('📊 Formatted accounts with names:', formattedAccounts.length);

    // Step 6: Calculate balance data from j_rep_metaads_bronze (real spend data)
    // and j_rep_metaads_account_balance (spend_cap data)
    const metaAdsIds = formattedAccounts
      .map((acc: any) => acc.id_meta_ads)
      .filter(Boolean);

    let balanceMap = new Map<string, { days_remaining: number; current_balance: number }>();

    if (metaAdsIds.length > 0) {
      // Get balance data from account_balance table (has spend_cap and current_balance)
      const { data: balanceData } = await service
        .from('j_rep_metaads_account_balance')
        .select('account_id, current_balance, spend_cap, amount_spent, spend_last_7d, date')
        .in('account_id', metaAdsIds)
        .order('date', { ascending: false });

      // Get last 7 days spend from bronze table as fallback/verification
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: spendData } = await service
        .from('j_rep_metaads_bronze')
        .select('account_id, spend, date')
        .in('account_id', metaAdsIds)
        .gte('date', sevenDaysAgoStr);

      // Calculate total spend per account in last 7 days from bronze table
      const spendByAccountFromBronze = new Map<string, number>();
      (spendData || []).forEach((row: any) => {
        const accountId = row.account_id;
        const spend = parseFloat(row.spend) || 0;
        spendByAccountFromBronze.set(accountId, (spendByAccountFromBronze.get(accountId) || 0) + spend);
      });

      // Build balance map using best available data
      const processedAccounts = new Set<string>();
      (balanceData || []).forEach((b: any) => {
        if (processedAccounts.has(b.account_id)) return; // Skip duplicates (keep most recent)
        processedAccounts.add(b.account_id);

        const currentBalance = Number(b.current_balance) || 0;

        // Use spend_last_7d from Windsor if available, otherwise calculate from bronze
        const windsorSpend7d = Number(b.spend_last_7d) || 0;
        const bronzeSpend7d = spendByAccountFromBronze.get(b.account_id) || 0;
        const spendLast7d = windsorSpend7d > 0 ? windsorSpend7d : bronzeSpend7d;

        const avgDailySpend = spendLast7d / 7;

        // Calculate days remaining: current_balance / avg_daily_spend
        // Special values:
        //   0 = balance depleted (show ❌)
        //   999 = no recent spend data, can't calculate (show ∞)
        let daysRemaining = 999;
        if (currentBalance <= 0) {
          daysRemaining = 0; // Balance depleted!
        } else if (avgDailySpend > 0) {
          daysRemaining = Math.round(currentBalance / avgDailySpend);
        }

        balanceMap.set(b.account_id, {
          days_remaining: daysRemaining,
          current_balance: currentBalance,
        });
      });

      console.log('💰 Balance data calculated for', balanceMap.size, 'accounts');
    }

    // Step 7: Enrich accounts with payment method and balance
    const enrichedAccounts = formattedAccounts.map((account: any) => {
      const balance = account.id_meta_ads ? balanceMap.get(account.id_meta_ads) : null;

      // Get payment method from the original account data
      const originalAccount = (accountsData || []).find((a: any) => a.id === account.id);
      const paymentMethod = originalAccount?.["Método de Pagamento"] || null;

      return {
        ...account,
        payment_method: paymentMethod,
        days_remaining: balance?.days_remaining ?? null,
        current_balance: balance?.current_balance ?? null,
      };
    });

    console.log('📊 Enriched accounts with balance data');

    return new Response(
      JSON.stringify({
        success: true,
        accounts: enrichedAccounts,
        account_ids: accountIds, // UUIDs for modern tables (j_hub_decks)
        account_notion_ids: accountNotionIds, // TEXT notion_ids for legacy tables (j_hub_optimization_recordings)
        email: targetEmail,
        is_admin: isAdmin, // Flag to indicate admin access
        user_role: userRole, // User role from j_hub_users
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