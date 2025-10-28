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
  forceRegenerate?: boolean;
}

interface ExtractAction {
  category: 'VERBA' | 'CRIATIVOS' | 'CONJUNTOS' | 'COPY' | 'OBSERVAÇÃO';
  description: string;
}

const EXTRACT_PROMPT = `Você é um assistente especializado em extrair ações concretas de logs de otimização seguindo o método RADAR.

**TAREFA**: Analise o log e extraia TODAS as ações executadas, listando primeiro as internas e depois as externas.

**AÇÕES INTERNAS** (executadas diretamente nas plataformas):
- [PAUSOU] / [ATIVOU] / [REATIVOU]: Recursos ligados/desligados
- [CRIOU] / [PUBLICOU] / [DUPLICOU]: Novos recursos
- [EXCLUIU]: Recursos removidos
- [AJUSTOU] / [REALOCOU]: Modificações de budget ou configurações
- [CORRIGIU]: Erros consertados
- [ESCALOU]: Investimento aumentado
- [TESTOU]: Testes iniciados
- [OBSERVOU]: Análise sem ação (apenas se explicitamente mencionado)

**AÇÕES EXTERNAS** (dependem de terceiros):
- [SOLICITOU]: Criativos, verba, ajustes técnicos
- [INFORMOU]: Gerente ou cliente
- [AGUARDANDO]: Aprovações pendentes
- [ABRIU]: Tickets no sistema
- [ENVIOU]: Comunicações durante otimização

**FORMATO DE SAÍDA** (use EXATAMENTE este formato com verbos em MAIÚSCULAS):
- [VERBO]: Detalhes específicos + quantificação

[linha em branco separando se houver ações externas]

- [VERBO]: Detalhes da solicitação/comunicação

**EXEMPLO DE SAÍDA CORRETA**:
- [CRIOU]: Campanha de vendas CBO "Estratégia Apocalíptica" com budget R$ 413/dia
- [CRIOU]: Conjunto "Rebelde" (categoria de produto) dentro da CBO
- [OBSERVOU]: Distribuição anômala de verba (72,6% no catálogo) sem executar ajustes

- [SOLICITOU]: 5 novos criativos ao time de design
- [INFORMOU]: Gerente sobre performance baixa da campanha X

**REGRAS**:
1. Liste primeiro todas as ações internas
2. Separe com linha em branco se houver ações externas
3. Use APENAS os verbos listados ENTRE COLCHETES EM MAIÚSCULAS: [VERBO]
4. Especifique recursos afetados (nomes/IDs)
5. Quantifique sempre que possível
6. Se não houver ações de um tipo, omita completamente

**LOG A ANALISAR**:
{context_text}

**RESPONDA APENAS COM A LISTA DE AÇÕES (formato: - [VERBO]: detalhes)**:`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request
    const { recordingId, contextText, forceRegenerate = false }: ExtractRequest = await req.json();

    if (!recordingId || !contextText) {
      throw new Error('recordingId and contextText are required');
    }

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

    // Generate extract with Claude
    console.log('[Extract] Calling Claude API...');
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
            content: EXTRACT_PROMPT.replace('{context_text}', contextText),
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

    console.log('[Extract] Generated extract:', extractText);

    // Parse extract into structured actions (optional, for future features)
    const actions: ExtractAction[] = [];
    const lines = extractText.split('\n').filter((line) => line.trim().startsWith('-'));

    lines.forEach((line) => {
      const match = line.match(/-\s*\[(\w+)\]:\s*(.+)/i);
      if (match) {
        const [, verb, description] = match;
        const verbUpper = verb.toUpperCase();
        // Map verbs to legacy categories for backward compatibility
        let category: ExtractAction['category'] = 'OBSERVAÇÃO';
        if (['AJUSTOU', 'REALOCOU', 'ESCALOU'].includes(verbUpper)) category = 'VERBA';
        if (['CRIOU', 'PUBLICOU', 'DUPLICOU', 'PAUSOU', 'ATIVOU', 'REATIVOU'].includes(verbUpper)) category = 'CRIATIVOS';
        if (['TESTOU', 'CORRIGIU'].includes(verbUpper)) category = 'CONJUNTOS';
        if (['OBSERVOU'].includes(verbUpper)) category = 'OBSERVAÇÃO';

        actions.push({
          category,
          description: `[${verbUpper}]: ${description.trim()}`,
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
          actions: actions,
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
      step: 'extract',
      prompt_sent: EXTRACT_PROMPT,
      model_used: 'claude-sonnet-4-5-20250929',
      input_preview: contextText.substring(0, 5000),
      output_preview: extractText.substring(0, 5000),
      tokens_used: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0),
      latency_ms: null, // Could calculate if needed
      success: true,
      error_message: null,
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
        await supabase.from('j_hub_optimization_api_logs').insert({
          recording_id: reqRecordingId,
          step: 'extract',
          prompt_sent: EXTRACT_PROMPT || null,
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
