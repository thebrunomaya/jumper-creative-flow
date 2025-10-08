import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recording_id, model, correction_prompt } = await req.json();
    
    if (!recording_id) {
      throw new Error('recording_id is required');
    }

    const selectedModel = model || 'claude-sonnet-4-20250514';
    console.log(`🤖 Using model: ${selectedModel}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Fetching recording and transcript for:', recording_id);

    // Fetch recording
    const { data: recording, error: recError } = await supabase
      .from('j_ads_optimization_recordings')
      .select('*')
      .eq('id', recording_id)
      .single();

    if (recError || !recording) {
      throw new Error('Recording not found');
    }

    // Update analysis status to processing
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ analysis_status: 'processing' })
      .eq('id', recording_id);

    // Fetch transcript
    const { data: transcript, error: transError } = await supabase
      .from('j_ads_optimization_transcripts')
      .select('*')
      .eq('recording_id', recording_id)
      .single();

    if (transError || !transcript) {
      throw new Error('Transcript not found');
    }

    // Use processed_text if available, fallback to full_text
    const transcriptText = transcript.processed_text || transcript.full_text;
    
    // Guard: transcript too short for meaningful analysis
    const textLength = transcriptText.trim().length;
    if (textLength < 50) {
      console.warn(`🛑 Transcript too short for analysis (len=${textLength}). Marking as failed.`);
      await supabase
        .from('j_ads_optimization_recordings')
        .update({ analysis_status: 'failed' })
        .eq('id', recording_id);

      return new Response(
        JSON.stringify({
          error: 'Transcrição muito curta para análise automática. Edite a transcrição ou grave novamente.',
          details: { textLength }
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Transcript found, calling OpenAI for analysis...');

    // Fetch last 3 optimizations from this account for historical context
    const { data: previousOptimizations } = await supabase
      .from('j_ads_optimization_context')
      .select(`
        recording_id,
        summary,
        actions_taken,
        created_at,
        j_ads_optimization_recordings!inner(recorded_at, recorded_by)
      `)
      .eq('account_id', recording.account_id)
      .neq('recording_id', recording_id)
      .order('created_at', { ascending: false })
      .limit(3);

    let historicalContext = '';
    if (previousOptimizations && previousOptimizations.length > 0) {
      console.log(`📚 Including ${previousOptimizations.length} previous optimizations as context`);
      historicalContext = '\n\n## HISTÓRICO DE OTIMIZAÇÕES RECENTES (use para contexto e continuidade):\n\n';
      previousOptimizations.forEach((opt, idx) => {
        const recordDate = new Date(opt.j_ads_optimization_recordings.recorded_at).toLocaleDateString('pt-BR');
        historicalContext += `### Otimização ${idx + 1} - ${recordDate}\n`;
        historicalContext += `**Gestor:** ${opt.j_ads_optimization_recordings.recorded_by}\n`;
        historicalContext += `**Resumo:** ${opt.summary}\n`;
        historicalContext += `**Ações tomadas:** ${opt.actions_taken.length} ação(ões)\n`;
        if (opt.actions_taken && opt.actions_taken.length > 0) {
          opt.actions_taken.forEach((action: any, actionIdx: number) => {
            historicalContext += `  ${actionIdx + 1}. ${action.type}: ${action.target} - ${action.reason}\n`;
          });
        }
        historicalContext += '\n';
      });
    } else {
      console.log('📚 No previous optimizations found for this account');
    }

    // Fetch custom analysis prompts based on platform & objectives
    let customAnalysisGuidance = '';
    if (recording.platform && recording.selected_objectives && recording.selected_objectives.length > 0) {
      const { data: prompts } = await supabase
        .from('j_ads_optimization_prompts')
        .select('prompt_text')
        .eq('platform', recording.platform)
        .in('objective', recording.selected_objectives)
        .eq('prompt_type', 'analysis');
      
      if (prompts && prompts.length > 0) {
        customAnalysisGuidance = '\n\nFOCO ESPECÍFICO NOS OBJETIVOS:\n' + 
          prompts.map(p => p.prompt_text).join('\n');
        console.log('📝 Using custom analysis prompts');
      }
    }

    // Prepare prompt for AI analysis
    const systemPrompt = `Você é um especialista em análise de otimizações de tráfego pago (Meta Ads, Google Ads).
Sua tarefa é extrair informações estruturadas de uma transcrição de áudio de um gestor de tráfego explicando as otimizações que realizou.

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem explicações adicionais.

O JSON deve ter esta estrutura EXATA:
{
  "summary": "Resumo executivo em português com 150-200 palavras descrevendo o que foi feito e por quê",
  "actions_taken": [
    {
      "type": "pause_campaign" | "activate_campaign" | "increase_budget" | "decrease_budget" | "new_creative" | "pause_creative" | "audience_change" | "bidding_change" | "other",
      "target": "Nome da campanha/ad/criativo afetado",
      "reason": "Por que tomou essa ação",
      "expected_impact": "Impacto esperado (opcional)",
      "metrics_before": { "cpa": 200, "roas": 2.5 }
    }
  ],
  "metrics_mentioned": {
    "cpa": 200,
    "roas": 2.5,
    "ctr": 1.8,
    "conversions": 50
  },
  "strategy": {
    "type": "test" | "scale" | "optimize" | "maintain" | "pivot",
    "duration_days": 7,
    "success_criteria": "Como definir se foi bem-sucedido",
    "hypothesis": "Hipótese sendo testada (se type=test)",
    "target_metric": "cpa",
    "target_value": 150
  },
  "timeline": {
    "reevaluate_date": "2025-10-14",
    "milestones": [
      {
        "date": "2025-10-10",
        "description": "Avaliar primeiros resultados",
        "expected_metrics": { "cpa": 180 }
      }
    ]
  },
  "confidence_level": "high" | "medium" | "low"
}

REGRAS:
- Se não conseguir extrair alguma informação, use valores vazios apropriados ([], {}, null)
- Para datas, use formato ISO 8601 (YYYY-MM-DD)
- Para valores numéricos, sempre use números (não strings)
- confidence_level deve refletir a clareza da transcrição${customAnalysisGuidance}`;

    const platform = recording.platform === 'google' ? 'Google Ads' : 'Meta Ads';
    const objectives = recording.selected_objectives?.join(', ') || 'não especificados';

    let userPrompt = `Analise esta transcrição de otimização de tráfego e extraia as informações estruturadas:

TRANSCRIÇÃO:
${transcriptText}

CONTEXTO DA GRAVAÇÃO ATUAL:
- Account ID: ${recording.account_id}
- Gestor: ${recording.recorded_by}
- Data: ${recording.recorded_at}
- Plataforma: ${platform}
- Objetivos da Conta: ${objectives}
${historicalContext}`;

    if (correction_prompt) {
      userPrompt += `\n\nINSTRUÇÕES ADICIONAIS DE ANÁLISE:\n${correction_prompt}`;
      console.log('📝 Using correction prompt for analysis');
    }

    userPrompt += '\n\nRetorne APENAS o JSON estruturado conforme o formato especificado.';

    // Determine if we're using Claude or OpenAI
    const isClaudeModel = selectedModel.startsWith('claude-');
    let extractedContent: string;

    if (isClaudeModel) {
      // Call Anthropic API
      console.log('🤖 Calling Anthropic API with model:', selectedModel);
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        console.error('Anthropic API error:', errorText);
        throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
      }

      const anthropicData = await anthropicResponse.json();
      extractedContent = anthropicData.content[0].text;
    } else {
      // Call OpenAI API
      console.log('🤖 Calling OpenAI API with model:', selectedModel);
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          ...(selectedModel.startsWith('gpt-5')
            ? { max_completion_tokens: 8192 }
            : { max_tokens: 1024, temperature: 0.2 })
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      console.log('📊 OpenAI response structure:', JSON.stringify(openaiData, null, 2));
      
      if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
        console.error('Invalid OpenAI response structure:', openaiData);
        throw new Error('Invalid response structure from OpenAI API');
      }
      
      extractedContent = openaiData.choices[0].message.content;
      
      if (!extractedContent || extractedContent.trim() === '') {
        console.error('Empty content from OpenAI:', openaiData);
        throw new Error('OpenAI returned empty content');
      }
    }

    console.log('📝 Raw AI response:', extractedContent);

    // Parse JSON response
    let extractedData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = extractedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      extractedData = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response:', extractedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate required fields
    if (!extractedData.summary || !extractedData.actions_taken || !extractedData.metrics_mentioned) {
      throw new Error('Missing required fields in AI response');
    }

    console.log('✅ Parsed extracted data:', JSON.stringify(extractedData, null, 2));

    // Delete any existing context for this recording to avoid unique constraint violation
    console.log('🗑️ Deleting old context if exists...');
    const { error: deleteError } = await supabase
      .from('j_ads_optimization_context')
      .delete()
      .eq('recording_id', recording_id);

    if (deleteError) {
      console.error('⚠️ Error deleting old context (non-critical):', deleteError);
    }

    // Insert new context into j_ads_optimization_context
    console.log('💾 Inserting new context...');
    const { error: insertError } = await supabase
      .from('j_ads_optimization_context')
      .insert({
        recording_id: recording_id,
        account_id: recording.account_id,
        summary: extractedData.summary,
        actions_taken: extractedData.actions_taken,
        metrics_mentioned: extractedData.metrics_mentioned,
        strategy: extractedData.strategy,
        timeline: extractedData.timeline,
        confidence_level: extractedData.confidence_level || 'medium',
        model_used: selectedModel,
        correction_prompt: correction_prompt || null,
        correction_applied_at: correction_prompt ? new Date().toISOString() : null,
      });

    if (insertError) {
      console.error('Failed to insert context:', insertError);
      throw insertError;
    }

    // Update analysis status to completed
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ analysis_status: 'completed' })
      .eq('id', recording_id);

    console.log('✅ Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        context: extractedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-optimization:', error);
    
    // Update status to failed if we have recording_id
    const { recording_id } = await req.json().catch(() => ({}));
    if (recording_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('j_ads_optimization_recordings')
        .update({ analysis_status: 'failed' })
        .eq('id', recording_id);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
