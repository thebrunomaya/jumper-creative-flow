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
    const { recording_id } = await req.json();
    reqRecordingId = recording_id ?? null;

    if (!recording_id) {
      throw new Error('recording_id is required');
    }

    console.log('📝 [PROCESS] Processing transcript into topics for:', recording_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ processing_status: 'processing' })
      .eq('id', recording_id);

    // Fetch recording
    const { data: recording, error: recError } = await supabase
      .from('j_ads_optimization_recordings')
      .select('*')
      .eq('id', recording_id)
      .single();

    if (recError || !recording) {
      throw new Error('Recording not found');
    }

    // Fetch transcript
    const { data: transcript, error: transError } = await supabase
      .from('j_ads_optimization_transcripts')
      .select('*')
      .eq('recording_id', recording_id)
      .single();

    if (transError || !transcript) {
      throw new Error('Transcript not found');
    }

    if (!transcript.full_text || transcript.full_text.trim().length < 50) {
      throw new Error('Transcript too short for processing');
    }

    console.log('✅ [PROCESS] Transcript found, length:', transcript.full_text.length);

    // Fetch account context with Transcription Context
    const { data: accountData } = await supabase
      .from('j_ads_notion_db_accounts')
      .select('Conta, Objetivos, "Contexto para Transcrição", "Contexto para Otimização"')
      .eq('notion_id', recording.account_id)
      .maybeSingle();

    const accountName = accountData?.Conta || 'Conta';
    const objectives = recording.selected_objectives?.join(', ') || accountData?.Objetivos || 'não especificados';

    // Context priority: override > Transcription Context > Optimization Context
    const transcriptionContext = accountData?.['Contexto para Transcrição'] || '';
    const optimizationContext = recording.override_context || accountData?.['Contexto para Otimização'] || '';

    // Fetch objective-specific prompts for processing
    let objectivePrompts = '';
    if (recording.selected_objectives && recording.selected_objectives.length > 0) {
      const { data: prompts } = await supabase
        .from('j_ads_optimization_prompts')
        .select('prompt_text')
        .eq('platform', recording.platform)
        .in('objective', recording.selected_objectives)
        .eq('prompt_type', 'process');

      if (prompts && prompts.length > 0) {
        objectivePrompts = prompts.map(p => p.prompt_text).join('\n\n');
        console.log(`📝 [PROCESS] Using ${prompts.length} objective-specific prompts`);
      }
    }

    // Prepare prompt for AI processing with clear section separators
    const systemPrompt = `You are an expert at organizing paid traffic manager transcriptions.

Your task is to transform raw transcription into chronologically organized topics, facilitating review and subsequent structured analysis.

EXPECTED FORMAT:

### 🎯 [Timestamp/Moment] - Action/Observation Title
**What was done:** Clear description of the action or observation
**Metrics mentioned:** CPM R$ X, ROAS Y, CTR Z% (if mentioned)
**Reason/Context:** Why this decision was made

IMPORTANT RULES:
- Use relevant emojis (📊 📈 📉 ⚠️ ✅ 🔄 etc.) to improve readability
- Maintain chronological order of events
- Cite ALL numerical metrics mentioned
- If the manager mentions specific campaigns/ads, cite the names
- Return ONLY the organized text in topics, without introduction or additional conclusion

OUTPUT LANGUAGE: Brazilian Portuguese`;


    const platform = recording.platform === 'google' ? 'Google Ads' : 'Meta Ads';

    const userPrompt = `==============================================
PROPER NAMES AND CONTEXT
==============================================
${transcriptionContext}

PLATFORM: ${platform}
OBJECTIVES: ${objectives}

==============================================
FOCUS BY OBJECTIVE
==============================================
${objectivePrompts || 'Organize topics clearly and chronologically, highlighting metrics and actions mentioned.'}

${optimizationContext ? `
==============================================
ADDITIONAL OPTIMIZATION CONTEXT
==============================================
${optimizationContext}
` : ''}
==============================================
RAW TRANSCRIPTION TO ORGANIZE
==============================================
${transcript.full_text}

==============================================
TASK
==============================================
Transform this raw transcription into chronologically organized topics, following the format specified above.

OUTPUT FORMAT:
Markdown with emojis, structured bullet points, all cited metrics, chronological order. OUTPUT IN BRAZILIAN PORTUGUESE.`;

    console.log('🤖 [PROCESS] Calling Claude Sonnet 4.5 to process transcript...');
    console.log('📏 [PROCESS] Input length:', transcript.full_text.length, 'chars');

    // Call Anthropic API
    const startTime = Date.now();
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('❌ [PROCESS] Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    const processedText = anthropicData.content[0].text;
    const latency = Date.now() - startTime;

    console.log('✅ [PROCESS] Processed transcript into topics');
    console.log('📏 [PROCESS] Output length:', processedText.length, 'chars');
    console.log('⏱️ [PROCESS] Latency:', latency, 'ms');
    console.log('🎫 [PROCESS] Tokens used:', anthropicData.usage?.output_tokens || 'N/A');

    // Update transcript with processed text
    const { error: updateError } = await supabase
      .from('j_ads_optimization_transcripts')
      .update({ processed_text: processedText })
      .eq('recording_id', recording_id);

    if (updateError) {
      console.error('❌ [PROCESS] Failed to update transcript:', updateError);
      throw updateError;
    }

    // Update recording status to completed
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ processing_status: 'completed' })
      .eq('id', recording_id);

    // Log API call for debugging (admin only)
    try {
      await supabase
        .from('j_ads_optimization_api_logs')
        .insert({
          recording_id,
          step: 'process',
          prompt_sent: `${systemPrompt}\n\n---\n\n${userPrompt}`,
          model_used: 'claude-sonnet-4-5-20250929',
          input_preview: transcript.full_text.substring(0, 500),
          output_preview: processedText.substring(0, 500),
          tokens_used: anthropicData.usage?.output_tokens || null,
          latency_ms: latency,
          success: true,
          error_message: null,
        });
      console.log('📊 [PROCESS] API log saved successfully');
    } catch (logError) {
      console.warn('⚠️ [PROCESS] Failed to save API log (non-critical):', logError);
    }

    console.log('✅ [PROCESS] Transcript processing completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        processed_text: processedText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [PROCESS] Error:', error);

    // Update status to failed if we have recording_id
    if (reqRecordingId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('j_ads_optimization_recordings')
          .update({ processing_status: 'failed' })
          .eq('id', reqRecordingId);

        // Log error
        await supabase
          .from('j_ads_optimization_api_logs')
          .insert({
            recording_id: reqRecordingId,
            step: 'process',
            prompt_sent: null,
            model_used: 'claude-sonnet-4-5-20250929',
            input_preview: 'Error occurred before/during processing',
            output_preview: null,
            tokens_used: null,
            latency_ms: null,
            success: false,
            error_message: error.message,
          });
      } catch (updateError) {
        console.error('❌ [PROCESS] Failed to update error status:', updateError);
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
