/**
 * j_hub_manager_update
 * Updates manager data in Notion and Supabase (bidirectional sync)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ManagerUpdateRequest {
  manager_id: string;  // UUID (Supabase)
  updates: {
    Nome?: string;
    "E-Mail"?: string;
    Telefone?: string;
    Funcao?: string[];
  };
}

/**
 * Convert updates to Notion API property format
 */
function buildNotionProperties(updates: Record<string, any>): Record<string, any> {
  const properties: Record<string, any> = {};

  // Title (Nome)
  if (updates.Nome !== undefined) {
    properties["Nome"] = { title: [{ text: { content: updates.Nome } }] };
  }

  // Email
  if (updates["E-Mail"] !== undefined) {
    properties["E-Mail"] = { email: updates["E-Mail"] || null };
  }

  // Phone
  if (updates.Telefone !== undefined) {
    properties["Telefone"] = { phone_number: updates.Telefone || null };
  }

  // Multi-select (Função)
  if (updates.Funcao !== undefined) {
    properties["Função"] = {
      multi_select: updates.Funcao.map((name: string) => ({ name }))
    };
  }

  return properties;
}

/**
 * Build Supabase update object from updates
 */
function buildSupabaseUpdate(updates: Record<string, any>): Record<string, any> {
  const supabaseUpdate: Record<string, any> = {};

  if (updates.Nome !== undefined) {
    supabaseUpdate["Nome"] = updates.Nome;
  }
  if (updates["E-Mail"] !== undefined) {
    supabaseUpdate["E-Mail"] = updates["E-Mail"];
  }
  if (updates.Telefone !== undefined) {
    supabaseUpdate["Telefone"] = updates.Telefone;
  }
  if (updates.Funcao !== undefined) {
    // Multi-select stored as comma-separated string
    supabaseUpdate["Função"] = Array.isArray(updates.Funcao)
      ? updates.Funcao.join(", ")
      : updates.Funcao;
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

    console.log(`[MANAGER_UPDATE] User authenticated: ${user.email}`);

    // Parse request body
    const body: ManagerUpdateRequest = await req.json();
    const { manager_id, updates } = body;

    if (!manager_id) {
      return new Response(JSON.stringify({ success: false, error: 'manager_id is required' }), {
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

    console.log(`[MANAGER_UPDATE] Updating manager: ${manager_id}`);
    console.log(`[MANAGER_UPDATE] Fields to update:`, Object.keys(updates));

    // Get user role - only admin can update managers
    const { data: userData, error: userError } = await supabase
      .from('j_hub_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return new Response(JSON.stringify({ success: false, error: 'User not found in system' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isAdmin = userData.role === 'admin';

    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Only admin can update managers' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch manager to get notion_id
    const { data: manager, error: managerError } = await supabase
      .from('j_hub_notion_db_managers')
      .select('id, notion_id, "Nome"')
      .eq('id', manager_id)
      .single();

    if (managerError || !manager) {
      return new Response(JSON.stringify({ success: false, error: 'Manager not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build Notion properties
    const notionProperties = buildNotionProperties(updates);

    if (Object.keys(notionProperties).length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No valid fields to update' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[MANAGER_UPDATE] Notion properties to update:`, Object.keys(notionProperties));

    // PATCH Notion API
    const notionResponse = await fetch(`https://api.notion.com/v1/pages/${manager.notion_id}`, {
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
      console.error(`[MANAGER_UPDATE] Notion API error:`, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update Notion',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[MANAGER_UPDATE] Notion updated successfully`);

    // Build Supabase update
    const supabaseUpdate = buildSupabaseUpdate(updates);

    // UPDATE Supabase local
    const { error: updateError } = await supabase
      .from('j_hub_notion_db_managers')
      .update(supabaseUpdate)
      .eq('id', manager_id);

    if (updateError) {
      console.error(`[MANAGER_UPDATE] Supabase update error:`, updateError);
    } else {
      console.log(`[MANAGER_UPDATE] Supabase updated successfully`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated_fields: Object.keys(updates),
        manager_name: manager.Nome,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[MANAGER_UPDATE] Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
