/**
 * j_hub_account_update
 * Updates account data in Notion and Supabase (bidirectional sync)
 *
 * Flow:
 * 1. Authenticate user (JWT)
 * 2. Verify role (admin or staff)
 * 3. Lookup notion_id by UUID
 * 4. Check permission (admin = all, staff = only their accounts)
 * 5. Convert fields to Notion API format
 * 6. PATCH Notion API
 * 7. UPDATE Supabase local
 * 8. Return result
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AccountUpdateRequest {
  account_id: string;  // UUID (Supabase)
  updates: {
    // Basic
    Conta?: string;
    Status?: string;
    Tier?: number;
    Objetivos?: string[];
    Nicho?: string[];
    // Team
    Gestor?: string;
    Atendimento?: string;
    // Platforms
    "ID Meta Ads"?: string;
    "ID Google Ads"?: string;
    "ID Tiktok Ads"?: string;
    "ID Google Analytics"?: string;
    // AI Context
    "Contexto para Otimizacao"?: string;
    "Contexto para Transcricao"?: string;
    // Financial
    "Metodo de Pagamento"?: string;
    "META: Verba Mensal"?: string;
    "G-ADS: Verba Mensal"?: string;
    // WooCommerce
    "Woo Site URL"?: string;
    "Woo Consumer Key"?: string;
    "Woo Consumer Secret"?: string;
  };
}

/**
 * Convert updates to Notion API property format
 */
function buildNotionProperties(updates: Record<string, any>): Record<string, any> {
  const properties: Record<string, any> = {};

  // Title (Conta)
  if (updates.Conta !== undefined) {
    properties["Conta"] = { title: [{ text: { content: updates.Conta } }] };
  }

  // Status (select type)
  if (updates.Status !== undefined) {
    properties["Status"] = { select: { name: updates.Status } };
  }

  // Select fields
  if (updates["Metodo de Pagamento"] !== undefined) {
    properties["Método de Pagamento"] = { select: { name: updates["Metodo de Pagamento"] } };
  }

  // Number fields
  if (updates.Tier !== undefined) {
    properties["Tier"] = { number: updates.Tier };
  }

  // Multi-select fields
  if (updates.Objetivos !== undefined) {
    properties["Objetivos"] = {
      multi_select: updates.Objetivos.map((name: string) => ({ name }))
    };
  }
  if (updates.Nicho !== undefined) {
    properties["Nicho"] = {
      multi_select: updates.Nicho.map((name: string) => ({ name }))
    };
  }

  // Rich text fields (with accent mapping)
  const textFieldMap: Record<string, string> = {
    "ID Meta Ads": "ID Meta Ads",
    "ID Google Ads": "ID Google Ads",
    "ID Tiktok Ads": "ID Tiktok Ads",
    "ID Google Analytics": "ID Google Analytics",
    "Contexto para Otimizacao": "Contexto para Otimização",
    "Contexto para Transcricao": "Contexto para Transcrição",
    "META: Verba Mensal": "META: Verba Mensal",
    "G-ADS: Verba Mensal": "G-ADS: Verba Mensal",
    "Gestor": "Gestor",
    "Atendimento": "Atendimento",
    "Woo Site URL": "Woo Site URL",
    "Woo Consumer Key": "Woo Consumer Key",
    "Woo Consumer Secret": "Woo Consumer Secret"
  };

  for (const [inputField, notionField] of Object.entries(textFieldMap)) {
    if (updates[inputField] !== undefined) {
      properties[notionField] = {
        rich_text: [{ text: { content: updates[inputField] || "" } }]
      };
    }
  }

  return properties;
}

/**
 * Build Supabase update object from updates
 */
function buildSupabaseUpdate(updates: Record<string, any>): Record<string, any> {
  const supabaseUpdate: Record<string, any> = {};

  // Map input fields to Supabase column names
  const fieldMap: Record<string, string> = {
    "Conta": "Conta",
    "Status": "Status",
    "Tier": "Tier",
    "Objetivos": "Objetivos",
    "Nicho": "Nicho",
    "Gestor": "Gestor",
    "Atendimento": "Atendimento",
    "ID Meta Ads": "ID Meta Ads",
    "ID Google Ads": "ID Google Ads",
    "ID Tiktok Ads": "ID Tiktok Ads",
    "ID Google Analytics": "ID Google Analytics",
    "Contexto para Otimizacao": "Contexto para Otimização",
    "Contexto para Transcricao": "Contexto para Transcrição",
    "Metodo de Pagamento": "Método de Pagamento",
    "META: Verba Mensal": "META: Verba Mensal",
    "G-ADS: Verba Mensal": "G-ADS: Verba Mensal",
    "Woo Site URL": "Woo Site URL",
    "Woo Consumer Key": "Woo Consumer Key",
    "Woo Consumer Secret": "Woo Consumer Secret",
  };

  for (const [inputField, columnName] of Object.entries(fieldMap)) {
    if (updates[inputField] !== undefined) {
      // Multi-select fields are stored as comma-separated strings in Supabase
      if (inputField === "Objetivos" || inputField === "Nicho") {
        supabaseUpdate[columnName] = Array.isArray(updates[inputField])
          ? updates[inputField].join(", ")
          : updates[inputField];
      } else {
        supabaseUpdate[columnName] = updates[inputField];
      }
    }
  }

  return supabaseUpdate;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY')!;

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ACCOUNT_UPDATE] User authenticated: ${user.email}`);

    // Parse request body
    const body: AccountUpdateRequest = await req.json();
    const { account_id, updates } = body;

    if (!account_id) {
      return new Response(JSON.stringify({ success: false, error: 'account_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'updates object is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ACCOUNT_UPDATE] Updating account: ${account_id}`);
    console.log(`[ACCOUNT_UPDATE] Fields to update:`, Object.keys(updates));

    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('j_hub_users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return new Response(JSON.stringify({ success: false, error: 'User not found in system' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isAdmin = userData.role === 'admin';
    const isStaff = userData.role === 'staff';

    if (!isAdmin && !isStaff) {
      return new Response(JSON.stringify({ success: false, error: 'Only admin and staff can update accounts' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch account to get notion_id and check permissions
    const { data: account, error: accountError } = await supabase
      .from('j_hub_notion_db_accounts')
      .select('id, notion_id, "Conta", "Gestor", "Atendimento"')
      .eq('id', account_id)
      .single();

    if (accountError || !account) {
      return new Response(JSON.stringify({ success: false, error: 'Account not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check permission for staff: must be Gestor or Atendimento
    if (isStaff && !isAdmin) {
      const userEmail = userData.email?.toLowerCase() || '';
      const gestorEmails = (account.Gestor || '').toLowerCase();
      const atendimentoEmails = (account.Atendimento || '').toLowerCase();

      const hasAccess = gestorEmails.includes(userEmail) || atendimentoEmails.includes(userEmail);

      if (!hasAccess) {
        return new Response(JSON.stringify({
          success: false,
          error: 'You do not have permission to edit this account'
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`[ACCOUNT_UPDATE] Permission check passed for ${userData.email}`);

    // Build Notion properties
    console.log(`[ACCOUNT_UPDATE] Raw updates:`, JSON.stringify(updates));
    const notionProperties = buildNotionProperties(updates);

    if (Object.keys(notionProperties).length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No valid fields to update' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ACCOUNT_UPDATE] Notion properties to update:`, JSON.stringify(notionProperties));
    console.log(`[ACCOUNT_UPDATE] Account notion_id: ${account.notion_id}`);

    // PATCH Notion API
    const notionResponse = await fetch(`https://api.notion.com/v1/pages/${account.notion_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties: notionProperties }),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error(`[ACCOUNT_UPDATE] Notion API error:`, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update Notion',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ACCOUNT_UPDATE] Notion updated successfully`);

    // Build Supabase update
    const supabaseUpdate = buildSupabaseUpdate(updates);

    // UPDATE Supabase local
    const { error: updateError } = await supabase
      .from('j_hub_notion_db_accounts')
      .update(supabaseUpdate)
      .eq('id', account_id);

    if (updateError) {
      console.error(`[ACCOUNT_UPDATE] Supabase update error:`, updateError);
      // Note: Notion was already updated, so we log but don't fail
      // Next sync will fix the inconsistency
    } else {
      console.log(`[ACCOUNT_UPDATE] Supabase updated successfully`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_fields: Object.keys(updates),
        account_name: account.Conta,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[ACCOUNT_UPDATE] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
