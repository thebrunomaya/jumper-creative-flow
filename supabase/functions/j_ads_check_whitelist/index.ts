import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se email está na tabela de managers do Notion
    const { data: managers, error: managerError } = await supabase
      .from('j_ads_notion_managers')
      .select('email, name, status')
      .eq('email', email.toLowerCase())
      .single();

    if (managerError || !managers) {
      // Email não está na whitelist
      return new Response(
        JSON.stringify({ 
          authorized: false,
          message: 'Email não autorizado. Entre em contato com seu gestor.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já tem conta no Supabase Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    const existingUser = users?.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );

    return new Response(
      JSON.stringify({ 
        authorized: true,
        hasAccount: !!existingUser,
        managerName: managers.name,
        isFirstAccess: !existingUser,
        status: managers.status || 'active'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao verificar whitelist:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar autorização' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});