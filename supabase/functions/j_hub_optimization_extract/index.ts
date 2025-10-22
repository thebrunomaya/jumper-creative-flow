/**
 * j_hub_optimization_extract
 * Extracts structured action summary from optimization log (Step 2 → Step 3)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractRequest {
  recordingId: string;
  contextText: string; // Step 2 log content
  method?: 'radar' | 'legacy'; // Extraction method (default: radar)
  forceRegenerate?: boolean;
}

interface ExtractAction {
  category: 'VERBA' | 'CRIATIVOS' | 'CONJUNTOS' | 'COPY';
  description: string;
}

const RADAR_PROMPT = `Você é um assistente especializado em criar extratos estruturados de otimizações de tráfego pago usando o MÉTODO RADAR.

**ESTRUTURA RADAR - 5 SEÇÕES**:

R - REGISTRO (retrato atual: métricas, status, setup)
A - ANOMALIA (o que mudou, fugiu do padrão)
D - DIAGNÓSTICO (por que aconteceu, causa raiz)
A - AÇÃO (o que foi feito concretamente)
R - RESULTADO ESPERADO (projeção e próximos passos)

**FORMATO DE SAÍDA OBRIGATÓRIO**:

┌─ RADAR | {cliente} | {data_hora} ────────────┐

R │ [máximo 4 linhas]
  │ Linha 1: Métrica principal (CPA/ROAS/CPL) + status vs meta
  │ Linha 2: Gasto e conversões do período analisado
  │ Linha 3: Setup atual (campanhas ativas, testes rodando)
  │ Linha 4: Contexto adicional se necessário

A │ [máximo 4 linhas]
  │ Liste mudanças/desvios com emoji de severidade:
  │ 🔴 Crítico | 🟡 Atenção | 🔵 Informativo
  │ Quantifique desvios: percentuais, valores absolutos
  │ Se nada anormal: "Sem anomalias - operando normal"

D │ [máximo 4 linhas]
  │ Linha 1: Causa raiz do que foi observado
  │ Linha 2-3: Contexto e interpretação profissional
  │ Última linha: Nível de confiança (alta/média/baixa)

A │ [máximo 4 linhas]
  │ Liste ações executadas com verbos no passado
  │ Quantifique mudanças (pausados X ads, budget +Y%)
  │ Se sem ação: "Sem ação - {justificativa clara}"

R │ [máximo 4 linhas]
  │ Linha 1: Projeção de performance curto prazo
  │ Linha 2: Data/gatilho da próxima revisão
  │ Linha 3: Ação planejada (condicional se aplicável)
  │ Linha 4: Métrica esperada após mudanças

└──────────────────────────────────────────────┘

**REGRAS CRÍTICAS**:

1. Máximo 4 linhas por seção (pode ser menos se informação cabe em menos)
2. Use conectores naturais: "com CPA", "nos últimos 7 dias", "baseado em"
3. Especifique nomes: "Campanha ABO Tyaro", não genérico "campanha"
4. Verbos de ação quando relevante: "armando proteção", não só "proteção"
5. Sempre quantifique: números, percentuais, valores em R$
6. Severidade visual obrigatória em ANOMALIA: 🔴🟡🔵
7. Conciso COM contexto (não telegráfico, não verboso)
8. Mantenha exatamente a formatação do box (┌─ │ └─)

**EXEMPLOS DE BOA FORMATAÇÃO**:

✅ BOM - Contextualizado:
R │ CPA R$1.063 (alvo R$1.000-1.300) ✅ nos últimos 7 dias
  │ Melhor Campanha: Plataformas com CPA R$955

❌ RUIM - Telegráfico:
R │ CPA R$1.063
  │ Plataformas R$955

✅ BOM - Com severidade:
A │ Regional 100% pausada (armando proteção CPA alto) 🔴
  │ Mix 1/2 na campanha ABO Tyaro com CPA >R$1.300 (fora do alvo) 🟡

❌ RUIM - Sem contexto:
A │ Regional pausada
  │ Mix 1/2 ruim

**INFORMAÇÕES DA OTIMIZAÇÃO**:
- CLIENTE: {cliente}
- DATA/HORA: {data_hora}

**LOG DE OTIMIZAÇÃO A ANALISAR**:
{context_text}

**RESPONDA APENAS COM O RADAR FORMATADO** (sem explicações adicionais, sem markdown code blocks, apenas o box formatado).`;

const ACTIONS_PROMPT = `Você é um assistente especializado em extrair e organizar ações de otimizações de tráfego pago.

**OBJETIVO**: Analisar o log de otimização e criar uma lista organizada de ações executadas pelo gestor de tráfego.

**CATEGORIAS DE AÇÕES**:
- **[VERBA]**: Ajustes de orçamento (aumentos, reduções, realocações)
- **[CRIATIVOS]**: Mudanças em anúncios (novos criativos, pausas, testes A/B)
- **[CONJUNTOS]**: Ajustes em conjuntos de anúncios (públicos, locais, interesses)
- **[COPY]**: Alterações em textos e calls-to-action

**FORMATO DE SAÍDA OBRIGATÓRIO**:

• [CATEGORIA] Descrição clara e concisa da ação executada
• [CATEGORIA] Próxima ação com detalhes quantificados

**REGRAS CRÍTICAS**:

1. Cada ação em uma linha iniciando com "•"
2. Use verbos no passado para ações já executadas (ex: "Aumentou", "Pausou", "Criou")
3. Quantifique sempre que possível (valores em R$, percentuais, números de anúncios)
4. Seja específico: mencione nomes de campanhas, conjuntos, criativos
5. Máximo 8-10 ações (priorize as mais relevantes)
6. Mantenha conciso mas informativo (20-40 palavras por ação)

**EXEMPLOS DE FORMATAÇÃO**:

✅ BOM - Específico e quantificado:
• [VERBA] Aumentou orçamento da Campanha ABO Tyaro de R$800 para R$1.200 (+50%)
• [CRIATIVOS] Pausou 3 anúncios com CPA acima de R$1.500 no conjunto Regional
• [CONJUNTOS] Criou novo público lookalike 1% baseado em compradores últimos 30 dias

❌ RUIM - Genérico:
• [VERBA] Aumentou orçamento
• [CRIATIVOS] Pausou anúncios ruins
• [CONJUNTOS] Criou público novo

**INFORMAÇÕES DA OTIMIZAÇÃO**:
- CLIENTE: {cliente}
- DATA/HORA: {data_hora}

**LOG DE OTIMIZAÇÃO A ANALISAR**:
{context_text}

**RESPONDA APENAS COM A LISTA DE AÇÕES** (sem explicações adicionais, sem markdown code blocks, apenas as bullets).`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    const { recordingId, contextText, method = 'radar', forceRegenerate = false }: ExtractRequest = await req.json();

    if (!recordingId || !contextText) {
      throw new Error('recordingId and contextText are required');
    }

    console.log(`[Extract] Method selected: ${method}`);

    // Check if extract already exists
    if (!forceRegenerate) {
      const { data: existingExtract } = await supabase
        .from('j_hub_optimization_extracts')
        .select('*')
        .eq('recording_id', recordingId)
        .single();

      if (existingExtract) {
        return new Response(
          JSON.stringify({
            success: true,
            extract: existingExtract,
            cached: true,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Fetch recording to get account_id and recorded_at
    const { data: recording, error: recordingError } = await supabase
      .from('j_hub_optimization_recordings')
      .select('account_id, recorded_at')
      .eq('id', recordingId)
      .single();

    if (recordingError || !recording) {
      throw new Error('Recording not found');
    }

    // Fetch account name from Notion DB
    const { data: account } = await supabase
      .from('j_hub_notion_db_accounts')
      .select('Conta')
      .eq('notion_id', recording.account_id)
      .maybeSingle();

    const clientName = account?.Conta || recording.account_id;

    // Format date as DD/MM/YYYY HHhMM
    const recordedDate = new Date(recording.recorded_at);
    const dateFormatted = recordedDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = `${recordedDate.getHours()}h${String(recordedDate.getMinutes()).padStart(2, '0')}`;
    const dateTimeFormatted = `${dateFormatted} ${timeFormatted}`;

    // Select prompt based on method
    const basePrompt = method === 'radar' ? RADAR_PROMPT : ACTIONS_PROMPT;

    // Build prompt with variables
    const promptWithVars = basePrompt
      .replace('{cliente}', clientName)
      .replace('{data_hora}', dateTimeFormatted)
      .replace('{context_text}', contextText);

    // Generate extract with Claude
    console.log(`[Extract] Calling Claude API with method: ${method}...`);
    console.log('[Extract] Client:', clientName, '| DateTime:', dateTimeFormatted);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: promptWithVars,
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const claudeData = await claudeResponse.json();
    const extractText = claudeData.content[0].text.trim();

    console.log(`[Extract] Generated ${method.toUpperCase()} extract:`, extractText.substring(0, 200));

    // Validate format based on method
    const validationWarnings: string[] = [];

    if (method === 'radar') {
      // RADAR format validation
      if (!extractText.includes('RADAR') || !extractText.includes(clientName)) {
        validationWarnings.push('RADAR header may be missing client name');
      }

      const rCount = (extractText.match(/^R │/gm) || []).length;
      const aCount = (extractText.match(/^A │/gm) || []).length;
      const dCount = (extractText.match(/^D │/gm) || []).length;

      if (rCount !== 2 || aCount !== 2 || dCount !== 1) {
        validationWarnings.push(`RADAR sections count mismatch (expected 2R-2A-1D, got ${rCount}R-${aCount}A-${dCount}D)`);
      }

      if (!extractText.includes('🔴') && !extractText.includes('🟡') && !extractText.includes('🔵')) {
        validationWarnings.push('ANOMALIA section missing severity emojis (🔴🟡🔵)');
      }

      if (!extractText.includes('┌─') || !extractText.includes('└─')) {
        validationWarnings.push('RADAR box formatting may be incomplete');
      }
    } else {
      // Actions/Legacy format validation
      const bulletCount = (extractText.match(/^•/gm) || []).length;
      if (bulletCount === 0) {
        validationWarnings.push('No actions found (expected bullet points starting with •)');
      }

      const categoryCount = (extractText.match(/\[(VERBA|CRIATIVOS|CONJUNTOS|COPY)\]/g) || []).length;
      if (categoryCount === 0) {
        validationWarnings.push('No categories found (expected [VERBA], [CRIATIVOS], etc.)');
      }
    }

    if (validationWarnings.length > 0) {
      console.warn(`[Extract] ${method.toUpperCase()} validation warnings:`, validationWarnings);
      // Continue anyway - gestor can manually fix
    } else {
      console.log(`[Extract] ${method.toUpperCase()} validation: ✅ All checks passed`);
    }

    // Parse extract into structured actions (optional, for future features)
    const actions: ExtractAction[] = [];
    const lines = extractText.split('\n').filter((line) => line.trim().startsWith('•'));

    lines.forEach((line) => {
      const match = line.match(/•\s*\[(\w+)\]\s*(.+)/);
      if (match) {
        const [, category, description] = match;
        actions.push({
          category: category as ExtractAction['category'],
          description: description.trim(),
        });
      }
    });

    // Save to database
    const { data: extract, error: dbError } = await supabase
      .from('j_hub_optimization_extracts')
      .upsert(
        {
          recording_id: recordingId,
          extract_text: extractText,
          extract_format: method, // Save selected method (radar or legacy)
          actions: actions, // Parsed actions (populated for legacy, empty for radar)
          tags: { // Initialize with empty tags structure (RADAR uses this, legacy may not)
            registro: { panorama: null, gasto_atual: null },
            anomalia: { pontos_negativos: [], pontos_positivos: [] },
            diagnostico: {},
            acao: { acoes_executadas: [] },
            resultado_esperado: { proxima_acao: [], expectativa_impacto: null }
          },
          edit_count: forceRegenerate ? 0 : undefined, // Reset edit count on regenerate
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'recording_id' }
      )
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Update recording status to completed
    const { error: statusError } = await supabase
      .from('j_hub_optimization_recordings')
      .update({ analysis_status: 'completed' })
      .eq('id', recordingId);

    if (statusError) {
      console.error('[Extract] Failed to update recording status:', statusError);
      // Non-critical error - extract was saved successfully
    }

    // Log API call for debugging (admin only)
    await supabase.from('j_hub_optimization_api_logs').insert({
      recording_id: recordingId,
      step: `extract_${method}`, // Include method in step name for easier filtering
      prompt_sent: promptWithVars, // Save prompt with variables substituted
      model_used: 'claude-sonnet-4-5-20250929',
      input_preview: contextText.substring(0, 5000),
      output_preview: extractText.substring(0, 5000),
      tokens_used: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0),
      latency_ms: null, // Could calculate if needed
      success: true,
      error_message: validationWarnings.length > 0 ? `[${method.toUpperCase()}] Warnings: ${validationWarnings.join(', ')}` : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        extract,
        cached: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Extract] Error:', error);

    // Log error to API logs for debugging (best effort)
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Try to parse request body if error occurred before parse
      let reqRecordingId: string | undefined;
      let reqContextText: string | undefined;

      try {
        const body = await req.clone().json();
        reqRecordingId = body.recordingId;
        reqContextText = body.contextText;
      } catch (parseError) {
        console.warn('[Extract] Could not parse request body for error logging');
      }

      if (reqRecordingId) {
        const reqMethod = (await req.clone().json()).method || 'radar';
        await supabase.from('j_hub_optimization_api_logs').insert({
          recording_id: reqRecordingId,
          step: `extract_${reqMethod}`,
          prompt_sent: (reqMethod === 'radar' ? RADAR_PROMPT : ACTIONS_PROMPT) || null,
          model_used: 'claude-sonnet-4-5-20250929',
          input_preview: reqContextText?.substring(0, 5000) || 'Error occurred before/during processing',
          output_preview: null,
          tokens_used: null,
          latency_ms: null,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } catch (logError) {
      console.error('[Extract] Failed to log error (non-critical):', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
