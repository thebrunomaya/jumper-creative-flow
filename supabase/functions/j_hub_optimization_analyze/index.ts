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

  let reqRecordingId: string | null = null;

  try {
    const { recording_id, model, correction_prompt } = await req.json();
    reqRecordingId = recording_id ?? null;

    if (!recording_id) {
      throw new Error('recording_id is required');
    }

    const selectedModel = model || 'claude-sonnet-4-5-20250929';
    console.log(`🤖 [ANALYZE] Using model: ${selectedModel}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 [ANALYZE] Fetching recording and transcript for:', recording_id);

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
      console.warn(`🛑 [ANALYZE] Transcript too short for analysis (len=${textLength}). Marking as failed.`);
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

    console.log('✅ [ANALYZE] Transcript found, calling AI for analysis...');
    console.log('📏 [ANALYZE] Input length:', textLength, 'chars');

    // Fetch account contexts for transcription and optimization
    const { data: accountData } = await supabase
      .from('j_hub_notion_db_accounts')
      .select('contexto_transcricao, contexto_otimizacao')
      .eq('id', recording.account_id)
      .single();

    const transcriptionContext = accountData?.contexto_transcricao || 'No specific context provided.';
    const optimizationContext = accountData?.contexto_otimizacao || null;

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
      console.log(`📚 [ANALYZE] Including ${previousOptimizations.length} previous optimizations as context`);
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
      console.log('📚 [ANALYZE] No previous optimizations found for this account');
    }

    // Fetch custom analysis prompts based on platform & objectives
    let objectiveGuidance = '';
    if (recording.platform && recording.selected_objectives && recording.selected_objectives.length > 0) {
      const { data: prompts } = await supabase
        .from('j_ads_optimization_prompts')
        .select('prompt_text')
        .eq('platform', recording.platform)
        .in('objective', recording.selected_objectives)
        .eq('prompt_type', 'analyze');

      if (prompts && prompts.length > 0) {
        objectiveGuidance = prompts.map(p => p.prompt_text).join('\n\n---\n\n');
        console.log('📝 [ANALYZE] Using custom analysis prompts');
      } else {
        objectiveGuidance = 'Extract structured optimization data focusing on metrics and actions.';
      }
    } else {
      objectiveGuidance = 'Extract structured optimization data focusing on metrics and actions.';
    }

    // Prepare prompt for AI analysis
    const systemPrompt = `You are an expert at analyzing paid traffic optimizations (Meta Ads, Google Ads).
Your task is to extract structured information from an audio transcription of a traffic manager explaining their optimizations.

IMPORTANT: Return ONLY a valid JSON object, without markdown or additional explanations.

The JSON must have this EXACT structure:
{
  "summary": "Executive summary in Portuguese with 150-200 words describing what was done and why",
  "actions_taken": [
    {
      "type": "pause_campaign" | "activate_campaign" | "increase_budget" | "decrease_budget" | "new_creative" | "pause_creative" | "audience_change" | "bidding_change" | "other",
      "target": "Campaign/ad/creative name affected",
      "reason": "Why this action was taken",
      "expected_impact": "Expected impact (optional)",
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
    "success_criteria": "How to define success",
    "hypothesis": "Hypothesis being tested (if type=test)",
    "target_metric": "cpa",
    "target_value": 150
  },
  "timeline": {
    "reevaluate_date": "2025-10-14",
    "milestones": [
      {
        "date": "2025-10-10",
        "description": "Evaluate first results",
        "expected_metrics": { "cpa": 180 }
      }
    ]
  },
  "confidence_level": "high" | "medium" | "low"
}

RULES:
- If unable to extract information, use appropriate empty values ([], {}, null)
- For dates, use ISO 8601 format (YYYY-MM-DD)
- For numeric values, always use numbers (not strings)
- confidence_level should reflect transcription clarity

OUTPUT LANGUAGE: Brazilian Portuguese`;

    const platform = recording.platform === 'google' ? 'Google Ads' : 'Meta Ads';
    const objectives = recording.selected_objectives?.join(', ') || 'not specified';

    let userPrompt = `==============================================
PROPER NAMES AND CONTEXT
==============================================
${transcriptionContext}

PLATFORM: ${platform}
OBJECTIVES: ${objectives}

==============================================
FOCUS BY OBJECTIVE
==============================================
${objectiveGuidance}
`;

    if (optimizationContext) {
      userPrompt += `
==============================================
ADDITIONAL OPTIMIZATION CONTEXT
==============================================
${optimizationContext}
`;
    }

    userPrompt += `
==============================================
PROCESSED TRANSCRIPTION (ORGANIZED BULLETS)
==============================================
${transcriptText}

CONTEXT OF CURRENT RECORDING:
- Account ID: ${recording.account_id}
- Manager: ${recording.recorded_by}
- Date: ${recording.recorded_at}
- Platform: ${platform}
- Account Objectives: ${objectives}
`;

    if (historicalContext) {
      userPrompt += historicalContext;
    }

    if (correction_prompt) {
      userPrompt += `
==============================================
ADDITIONAL ANALYSIS INSTRUCTIONS
==============================================
${correction_prompt}
`;
      console.log('📝 [ANALYZE] Using correction prompt for analysis');
    }

    userPrompt += `
==============================================
TASK
==============================================
Analyze this optimization transcription and extract structured information.

OUTPUT FORMAT:
Valid JSON following the specified structure. OUTPUT IN BRAZILIAN PORTUGUESE.`;

    // Determine if we're using Claude or OpenAI
    const isClaudeModel = selectedModel.startsWith('claude-');
    let extractedContent: string;
    let tokensUsed: number | null = null;

    const startTime = Date.now();

    if (isClaudeModel) {
      // Call Anthropic API
      console.log('🤖 [ANALYZE] Calling Anthropic API with model:', selectedModel);
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
        console.error('❌ [ANALYZE] Anthropic API error:', errorText);
        throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
      }

      const anthropicData = await anthropicResponse.json();
      extractedContent = anthropicData.content[0].text;
      tokensUsed = anthropicData.usage?.output_tokens || null;
    } else {
      // Call OpenAI API
      console.log('🤖 [ANALYZE] Calling OpenAI API with model:', selectedModel);
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
        console.error('❌ [ANALYZE] OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      }

      const openaiData = await openaiResponse.json();

      if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
        console.error('❌ [ANALYZE] Invalid OpenAI response structure:', openaiData);
        throw new Error('Invalid response structure from OpenAI API');
      }

      extractedContent = openaiData.choices[0].message.content;
      tokensUsed = openaiData.usage?.completion_tokens || null;

      if (!extractedContent || extractedContent.trim() === '') {
        console.error('❌ [ANALYZE] Empty content from OpenAI:', openaiData);
        throw new Error('OpenAI returned empty content');
      }
    }

    const latency = Date.now() - startTime;

    console.log('✅ [ANALYZE] AI response received');
    console.log('📏 [ANALYZE] Response length:', extractedContent.length, 'chars');
    console.log('⏱️ [ANALYZE] Latency:', latency, 'ms');
    console.log('🎫 [ANALYZE] Tokens used:', tokensUsed || 'N/A');

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
      console.error('❌ [ANALYZE] Failed to parse AI response:', extractedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate required fields
    if (!extractedData.summary || !extractedData.actions_taken || !extractedData.metrics_mentioned) {
      throw new Error('Missing required fields in AI response');
    }

    console.log('✅ [ANALYZE] Parsed extracted data successfully');

    // Delete any existing context for this recording to avoid unique constraint violation
    console.log('🗑️ [ANALYZE] Deleting old context if exists...');
    const { error: deleteError } = await supabase
      .from('j_ads_optimization_context')
      .delete()
      .eq('recording_id', recording_id);

    if (deleteError) {
      console.warn('⚠️ [ANALYZE] Error deleting old context (non-critical):', deleteError);
    }

    // Insert new context into j_ads_optimization_context
    console.log('💾 [ANALYZE] Inserting new context...');
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
      console.error('❌ [ANALYZE] Failed to insert context:', insertError);
      throw insertError;
    }

    // Update analysis status to completed
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ analysis_status: 'completed' })
      .eq('id', recording_id);

    // Log API call for debugging (admin only)
    try {
      await supabase
        .from('j_ads_optimization_api_logs')
        .insert({
          recording_id,
          step: 'analyze',
          prompt_sent: `${systemPrompt}\n\n---\n\n${userPrompt}`,
          model_used: selectedModel,
          input_preview: transcriptText.substring(0, 500),
          output_preview: JSON.stringify(extractedData).substring(0, 500),
          tokens_used: tokensUsed,
          latency_ms: latency,
          success: true,
          error_message: null,
        });
      console.log('📊 [ANALYZE] API log saved successfully');
    } catch (logError) {
      console.warn('⚠️ [ANALYZE] Failed to save API log (non-critical):', logError);
    }

    console.log('✅ [ANALYZE] Analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        context: extractedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [ANALYZE] Error:', error);

    // Update status to failed if we have recording_id
    if (reqRecordingId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('j_ads_optimization_recordings')
          .update({ analysis_status: 'failed' })
          .eq('id', reqRecordingId);

        // Log error
        await supabase
          .from('j_ads_optimization_api_logs')
          .insert({
            recording_id: reqRecordingId,
            step: 'analyze',
            prompt_sent: null,
            model_used: null,
            input_preview: 'Error occurred before/during analysis',
            output_preview: null,
            tokens_used: null,
            latency_ms: null,
            success: false,
            error_message: error.message,
          });
      } catch (updateError) {
        console.error('❌ [ANALYZE] Failed to update error status:', updateError);
      }
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
