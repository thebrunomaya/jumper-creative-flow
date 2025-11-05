import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: j_hub_dashboards_multi_account
 *
 * Aggregates metrics for all accounts accessible to the user
 * Filters by objective and date range
 *
 * Request body:
 * {
 *   objective: 'geral' | 'vendas' | 'trafego' | 'leads' | etc.
 *   date_start: 'YYYY-MM-DD'
 *   date_end: 'YYYY-MM-DD'
 * }
 *
 * Response:
 * {
 *   success: true,
 *   accounts: [{
 *     account_id: string,
 *     account_name: string,
 *     meta_ads_id: string,
 *     metrics: { ... }
 *   }]
 * }
 */

// Mapping of dashboard objectives to Meta Ads objectives
const OBJECTIVE_MAPPING: Record<string, string[] | null> = {
  'geral': null, // No filter - all objectives
  'vendas': ['OUTCOME_SALES'],
  'trafego': ['LINK_CLICKS'],
  'leads': ['OUTCOME_LEADS'],
  'engajamento': ['OUTCOME_ENGAGEMENT'],
  'reconhecimento': ['OUTCOME_AWARENESS'],
  'video': null, // All objectives (video is cross-objective)
  'conversoes': null, // All objectives with conversions
  'alcance': null, // All objectives
  'conversas': ['MESSAGES'],
  'cadastros': null, // Multiple objectives can have registrations
  'seguidores': null, // Page likes from awareness + engagement
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

    // Authenticate user
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

    // Parse request body
    const { objective, date_start, date_end } = await req.json();

    if (!objective || !date_start || !date_end) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: objective, date_start, date_end'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📊 Multi-account dashboard request:', { objective, date_start, date_end, user: user.email });

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Get user's accessible accounts (reuse permission logic from j_hub_user_accounts)
    const { data: userData, error: userError } = await service
      .from('j_hub_users')
      .select('role, nome, notion_manager_id')
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
    const notionManagerId = userData?.notion_manager_id;
    const isAdmin = userRole === 'admin';
    const isStaff = userRole === 'staff';
    const targetEmail = (user.email || '').toLowerCase();

    let accountIds: string[] = [];

    // ADMIN: Get ALL accounts
    if (isAdmin) {
      console.log('👑 Admin - fetching ALL accounts');
      const { data: allAccounts } = await service
        .from('j_hub_notion_db_accounts')
        .select('id');
      accountIds = (allAccounts || []).map((acc: any) => acc.id);
    }
    // STAFF: Get accounts where user is Gestor or Atendimento
    else if (isStaff) {
      console.log('⚡ Staff - searching by Gestor/Atendimento');

      const { data: gestorAccounts } = await service
        .from('j_hub_notion_db_accounts')
        .select('id')
        .ilike('"Gestor"', `%${targetEmail}%`);

      const { data: atendimentoAccounts } = await service
        .from('j_hub_notion_db_accounts')
        .select('id')
        .ilike('"Atendimento"', `%${targetEmail}%`);

      const allAccountIds = new Set<string>();
      (gestorAccounts || []).forEach((acc: any) => allAccountIds.add(acc.id));
      (atendimentoAccounts || []).forEach((acc: any) => allAccountIds.add(acc.id));
      accountIds = Array.from(allAccountIds);
    }
    // CLIENT: Get accounts by notion_manager_id
    else if (notionManagerId) {
      console.log('📝 Client - searching by notion_manager_id');

      const { data: gerenteAccounts } = await service
        .from('j_hub_notion_db_accounts')
        .select('id')
        .ilike('"Gerente"', `%${notionManagerId}%`);

      accountIds = (gerenteAccounts || []).map((acc: any) => acc.id);
    }

    if (accountIds.length === 0) {
      console.log('❌ No accounts found for user');
      return new Response(JSON.stringify({
        success: true,
        accounts: [],
        note: 'No accessible accounts found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Found ${accountIds.length} accessible accounts`);

    // Step 2: Get complete account data
    const { data: accountsData, error: accountsError } = await service
      .from('j_hub_notion_db_accounts')
      .select('id, "Conta", "ID Meta Ads"')
      .in('id', accountIds);

    if (accountsError) {
      console.error('Error fetching accounts:', accountsError);
      return new Response(JSON.stringify({ success: false, error: 'Error fetching account data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: For each account, aggregate metrics from j_rep_metaads_bronze
    const accountsWithMetrics = [];
    const metaObjectives = OBJECTIVE_MAPPING[objective];

    for (const account of accountsData || []) {
      const metaAdsId = account["ID Meta Ads"];

      if (!metaAdsId) {
        console.log(`⚠️ Skipping account ${account["Conta"]} - no Meta Ads ID`);
        continue;
      }

      // Build query
      let query = service
        .from('j_rep_metaads_bronze')
        .select('*')
        .eq('account_id', metaAdsId)
        .gte('date', date_start)
        .lte('date', date_end);

      // Apply objective filter
      if (metaObjectives && metaObjectives.length > 0) {
        if (metaObjectives.length === 1) {
          query = query.eq('objective', metaObjectives[0]);
        } else {
          query = query.in('objective', metaObjectives);
        }
      }

      const { data: rawData, error: dataError } = await query;

      if (dataError) {
        console.error(`Error fetching data for account ${account["Conta"]}:`, dataError);
        continue;
      }

      if (!rawData || rawData.length === 0) {
        console.log(`⚠️ No data for account ${account["Conta"]} (objective: ${objective})`);
        continue; // Skip accounts with no data
      }

      // Aggregate metrics based on objective
      const metrics = aggregateMetricsByObjective(rawData, objective);

      accountsWithMetrics.push({
        account_id: account.id,
        account_name: account["Conta"],
        meta_ads_id: metaAdsId,
        metrics
      });
    }

    console.log(`✅ Returning ${accountsWithMetrics.length} accounts with metrics`);

    return new Response(JSON.stringify({
      success: true,
      accounts: accountsWithMetrics,
      objective,
      date_range: { start: date_start, end: date_end },
      total_accounts: accountsWithMetrics.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Multi-account dashboard error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Aggregates raw data into metrics based on objective
 */
function aggregateMetricsByObjective(rawData: any[], objective: string): any {
  const totalSpend = rawData.reduce((sum, row) => sum + parseFloat(String(row.spend || 0)), 0);
  const totalImpressions = rawData.reduce((sum, row) => sum + (row.impressions || 0), 0);
  const totalClicks = rawData.reduce((sum, row) => sum + (row.clicks || 0), 0);
  const totalLinkClicks = rawData.reduce((sum, row) => sum + (row.link_clicks || 0), 0);
  const totalReach = rawData.reduce((sum, row) => sum + (row.reach || 0), 0);

  switch (objective) {
    case 'geral':
      return {
        spend: totalSpend,
        impressions: totalImpressions,
        link_clicks: totalLinkClicks,
        ctr_link: totalImpressions > 0 ? ((totalLinkClicks / totalImpressions) * 100) : 0
      };

    case 'vendas':
      const totalPurchases = rawData.reduce((sum, row) => sum + (row.actions_purchase || 0), 0);
      const totalRevenue = rawData.reduce((sum, row) => sum + parseFloat(String(row.action_values_omni_purchase || 0)), 0);
      return {
        spend: totalSpend,
        cpa: totalPurchases > 0 ? (totalSpend / totalPurchases) : 0,
        purchases: totalPurchases,
        roas: totalSpend > 0 ? (totalRevenue / totalSpend) : 0
      };

    case 'trafego':
      return {
        spend: totalSpend,
        link_clicks: totalLinkClicks,
        cpc: totalLinkClicks > 0 ? (totalSpend / totalLinkClicks) : 0,
        ctr_link: totalImpressions > 0 ? ((totalLinkClicks / totalImpressions) * 100) : 0
      };

    case 'leads':
      const totalLeads = rawData.reduce((sum, row) => sum + (row.actions_lead || 0), 0);
      const conversionRate = totalClicks > 0 ? ((totalLeads / totalClicks) * 100) : 0;
      return {
        spend: totalSpend,
        leads: totalLeads,
        cpl: totalLeads > 0 ? (totalSpend / totalLeads) : 0,
        conversion_rate: conversionRate
      };

    case 'engajamento':
      const totalEngagements = rawData.reduce((sum, row) => sum + (row.actions_post_engagement || 0), 0);
      const engagementRate = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100) : 0;
      return {
        spend: totalSpend,
        engagements: totalEngagements,
        cpe: totalEngagements > 0 ? (totalSpend / totalEngagements) : 0,
        engagement_rate: engagementRate
      };

    case 'reconhecimento':
      const avgFrequency = totalReach > 0 ? (totalImpressions / totalReach) : 0;
      return {
        spend: totalSpend,
        reach: totalReach,
        cpm: totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000) : 0,
        frequency: avgFrequency
      };

    case 'video':
      const totalVideoViews100 = rawData.reduce((sum, row) => sum + (row.video_view_p100 || 0), 0);
      const completionRate = totalImpressions > 0 ? ((totalVideoViews100 / totalImpressions) * 100) : 0;
      return {
        spend: totalSpend,
        video_views_100: totalVideoViews100,
        cpv: totalVideoViews100 > 0 ? (totalSpend / totalVideoViews100) : 0,
        completion_rate: completionRate
      };

    case 'conversoes':
      const totalConversions = rawData.reduce((sum, row) => sum + (row.actions_purchase || 0), 0);
      const convRevenue = rawData.reduce((sum, row) => sum + parseFloat(String(row.action_values_omni_purchase || 0)), 0);
      return {
        spend: totalSpend,
        conversions: totalConversions,
        cpa: totalConversions > 0 ? (totalSpend / totalConversions) : 0,
        roas: totalSpend > 0 ? (convRevenue / totalSpend) : 0
      };

    case 'alcance':
      const cpm = totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000) : 0;
      return {
        spend: totalSpend,
        reach: totalReach,
        cpm: cpm,
        impressions: totalImpressions
      };

    case 'conversas':
      const totalMessages = rawData.reduce((sum, row) => sum + (row.actions_onsite_web_messaging_conversation_started_7d || 0), 0);
      const messageCPM = totalImpressions > 0 ? ((totalSpend / totalImpressions) * 1000) : 0;
      const responseRate = totalMessages > 0 ? ((totalMessages / totalImpressions) * 100) : 0; // Approximation
      return {
        spend: totalSpend,
        messages: totalMessages,
        cpm: messageCPM,
        response_rate: responseRate
      };

    case 'cadastros':
      const totalRegistrations = rawData.reduce((sum, row) => sum + (row.actions_complete_registration || 0), 0);
      const registrationRate = totalClicks > 0 ? ((totalRegistrations / totalClicks) * 100) : 0;
      return {
        spend: totalSpend,
        registrations: totalRegistrations,
        cpc: totalClicks > 0 ? (totalSpend / totalClicks) : 0,
        registration_rate: registrationRate
      };

    case 'seguidores':
      const totalPageLikes = rawData.reduce((sum, row) => sum + (row.actions_page_like || 0), 0);
      return {
        spend: totalSpend,
        followers: totalPageLikes,
        cps: totalPageLikes > 0 ? (totalSpend / totalPageLikes) : 0,
        reach: totalReach
      };

    default:
      return {
        spend: totalSpend,
        impressions: totalImpressions,
        clicks: totalClicks,
        reach: totalReach
      };
  }
}
