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
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY');

    // Notion DB for Managers (Gerentes)
    const DB_GERENTES_ID = "213db60949688003bd2dec32494bb87c";

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

    if (!NOTION_TOKEN) {
      throw new Error('NOTION_API_KEY not configured');
    }

    // Fetch all managers and find current user's manager entry by E-Mail
    const notionUrl = `https://api.notion.com/v1/databases/${DB_GERENTES_ID}/query`;
    const response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const results = Array.isArray(data.results) ? data.results : [];

    // Try to match by email in the "E-Mail" property (email type) or rich_text fallback
    const targetEmail = (user.email || '').toLowerCase();

    const findEmailInProperty = (prop: any): string => {
      if (!prop) return '';
      if (prop.email) return String(prop.email).toLowerCase();
      if (prop.rich_text && Array.isArray(prop.rich_text) && prop.rich_text.length > 0) {
        return String(prop.rich_text[0]?.plain_text || '').toLowerCase();
      }
      if (prop.title && Array.isArray(prop.title) && prop.title.length > 0) {
        return String(prop.title[0]?.plain_text || '').toLowerCase();
      }
      return '';
    };

    const myManager = results.find((r: any) => {
      const props = r.properties || {};
      const emailProp = props['E-Mail'] || props['Email'] || props['E-mail'];
      const value = findEmailInProperty(emailProp);
      return value === targetEmail;
    });

    if (!myManager) {
      return new Response(
        JSON.stringify({ success: true, accounts: [], note: 'No manager entry found for user email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract relation IDs from "Contas"
    const contasProp = myManager.properties?.['Contas'];
    const accounts: string[] = Array.isArray(contasProp?.relation)
      ? contasProp.relation.map((x: any) => x.id).filter(Boolean)
      : [];

    return new Response(
      JSON.stringify({ success: true, accounts, email: targetEmail }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});