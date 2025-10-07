// j_ads_update_optimization_context - Atualiza contexto de otimização marcando como revisado
// Usa service role para contornar RLS, mas valida autorização do usuário (admin ou autor da gravação)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') || '';

    // Client para verificar usuário (com JWT do request)
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Client com service role para operações no DB
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const { recording_id, update } = body as {
      recording_id?: string;
      update?: Record<string, unknown>;
    };

    if (!recording_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'recording_id é obrigatório' }),
        { status: 400, headers }
      );
    }

    // Verificar usuário autenticado
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      console.error('❌ [EDGE] Usuário não autenticado', userErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado' }),
        { status: 401, headers }
      );
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    console.log('🔐 [EDGE] User:', { userId, userEmail, recording_id });

    // Carrega gravação para validar propriedade
    const { data: rec, error: recErr } = await admin
      .from('j_ads_optimization_recordings')
      .select('recorded_by')
      .eq('id', recording_id)
      .maybeSingle();

    if (recErr || !rec) {
      console.error('❌ [EDGE] Gravação não encontrada', recErr);
      return new Response(
        JSON.stringify({ success: false, error: 'Gravação não encontrada' }),
        { status: 404, headers }
      );
    }

    // Verifica se é admin
    const { data: role, error: roleErr } = await admin
      .from('j_ads_user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    const isAdmin = role?.role === 'admin';
    const isOwner = !!userEmail && rec.recorded_by === userEmail;

    if (!isAdmin && !isOwner) {
      console.error('❌ [EDGE] Sem permissão para atualizar contexto', { userEmail, recorded_by: rec.recorded_by });
      return new Response(
        JSON.stringify({ success: false, error: 'Sem permissão' }),
        { status: 403, headers }
      );
    }

    // Monta payload final
    const nowIso = new Date().toISOString();
    const payload: Record<string, unknown> = {
      ...update,
      confidence_level: 'revised',
      revised_at: nowIso,
    };

    console.log('📝 [EDGE] Atualizando contexto:', { recording_id, keys: Object.keys(payload) });

    const { data: updated, error: updErr } = await admin
      .from('j_ads_optimization_context')
      .update(payload)
      .eq('recording_id', recording_id)
      .select('id, confidence_level, revised_at')
      .maybeSingle();

    if (updErr) {
      console.error('❌ [EDGE] Erro ao atualizar contexto', updErr);
      return new Response(
        JSON.stringify({ success: false, error: updErr.message }),
        { status: 400, headers }
      );
    }

    if (!updated) {
      console.error('❌ [EDGE] Nenhum contexto encontrado para atualizar');
      return new Response(
        JSON.stringify({ success: false, error: 'Contexto não encontrado' }),
        { status: 404, headers }
      );
    }

    console.log('✅ [EDGE] Contexto atualizado com sucesso', updated);

    return new Response(
      JSON.stringify({ success: true, updated }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error('🔥 [EDGE] Erro inesperado', e);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno' }),
      { status: 500, headers }
    );
  }
});