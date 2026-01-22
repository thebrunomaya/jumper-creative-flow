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
      .from('j_hub_optimization_recordings')
      .update({ processing_status: 'processing' })
      .eq('id', recording_id);

    // Fetch recording
    const { data: recording, error: recError } = await supabase
      .from('j_hub_optimization_recordings')
      .select('*')
      .eq('id', recording_id)
      .single();

    if (recError || !recording) {
      throw new Error('Recording not found');
    }

    // Fetch transcript
    const { data: transcript, error: transError } = await supabase
      .from('j_hub_optimization_transcripts')
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
    // Using account_uuid (UUID) instead of legacy account_id (TEXT notion_id)
    const { data: accountData } = await supabase
      .from('j_hub_notion_db_accounts')
      .select('Conta, Objetivos, "Contexto para Transcrição", "Contexto para Otimização"')
      .eq('id', recording.account_uuid)
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
        .from('j_hub_optimization_prompts')
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

🎯 [Timestamp/Moment] - Action/Observation Title
What was done: Clear description of the action or observation
Metrics mentioned: CPM R$ X, ROAS Y, CTR Z% (if mentioned)
Reason/Context: Why this decision was made

IMPORTANT RULES:
- Use relevant emojis (📊 📈 📉 ⚠️ ✅ 🔄 etc.) to improve readability
- Maintain chronological order of events
- Cite ALL numerical metrics mentioned
- If the manager mentions specific campaigns/ads, cite the names
- Return ONLY the organized text in topics, without introduction or additional conclusion

==============================================
TEMPORAL CONTEXT (CRITICAL)
The system provides a timestamp when the optimization was recorded. The manager may or may not mention the current date/time in their audio.

DETERMINING THE OPTIMIZATION DATE/TIME:

PRIORITY 1 - Extract from transcription:
If the manager mentions date/time (e.g., "Today is October 17th, it's 1 PM"):
→ Use that date/time

PRIORITY 2 - Use system timestamp:
If the manager does NOT mention date/time:
→ Use the timestamp from CONTEXT OF CURRENT RECORDING
→ Convert from UTC to Brazil Time (UTC-3)
→ This is the date/time of the optimization

CALCULATING RELATIVE PERIODS:
Once you have the optimization date, CALCULATE all relative periods mentioned:

"Yesterday" / "Previous day" / "D-1"
→ 1 day before optimization date (complete 00h00-23h59)
Example:
- Optimization: 17/10/2025
- Yesterday = 16/10/2025 00h00-23h59

"Today" / "Today so far"
→ Current day from 00h00 until optimization time
Example:
- Optimization: 17/10/2025 at 13h00
- Today = 17/10/2025 00h00-13h00

"Last X days"
→ X complete days BEFORE today (does not include today)
Example:
- Optimization: 17/10/2025
- Last 7 days = 10/10/2025 00h - 16/10/2025 23h59

"This week"
→ Monday of current week until today

"Last week"
→ Monday to Sunday of previous week

"This month"
→ Day 1 of current month until today

"Last month"
→ Complete previous month (day 1 to last day)

"Since it started" / "Maximum period" without specific start date:
→ Indicate: [Start date not specified - until DD/MM/YYYY]

MANDATORY OUTPUT FORMAT:
ALWAYS include an initial context section:

📅 CONTEXTO DA OTIMIZAÇÃO
Data/hora: DD/MM/YYYY às HH:MM
Gestor: [manager name]
Conta: [account name]
Plataforma: [Meta Ads/Google Ads]

Then ALWAYS specify absolute periods in section titles:

📊 [16/10/2025 Completo] - Performance do Dia Anterior
Período analisado: 16/10/2025 00h00 - 23h59 (dia completo)
Análise realizada em: 17/10/2025 às 13h00
Métricas:
[metrics here]

📈 [10/10 - 16/10/2025] - Últimos 7 Dias
Período analisado: 10/10/2025 00h - 16/10/2025 23h59 (7 dias completos)
Análise realizada em: 17/10/2025 às 13h00
Métricas:
[metrics here]

CRITICAL RULES:
- NEVER leave ambiguous periods like "yesterday", "last days", "recently"
- ALWAYS convert to absolute dates with DD/MM/YYYY format
- ALWAYS specify if period is "complete" (00h-23h59) or "partial" (00h-HH:MM)
- Include "Análise realizada em:" timestamp to show when data was collected
- If start date is unknown, explicitly state: [Data inicial não especificada]

OUTPUT LANGUAGE: Brazilian Portuguese`;


    const platform = recording.platform === 'google' ? 'Google Ads' : 'Meta Ads';

    // Format recording timestamp for context
    const recordingDate = new Date(recording.recorded_at);
    const brazilTime = new Date(recordingDate.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
    const formattedDate = brazilTime.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });

    const userPrompt = `==============================================
CONTEXT OF CURRENT RECORDING
==============================================
RECORDING TIMESTAMP (System): ${formattedDate} (Brazil Time - UTC-3)
USE THIS if manager does NOT mention date/time in audio.

==============================================
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
      .from('j_hub_optimization_transcripts')
      .update({ processed_text: processedText })
      .eq('recording_id', recording_id);

    if (updateError) {
      console.error('❌ [PROCESS] Failed to update transcript:', updateError);
      throw updateError;
    }

    // Update recording status to completed
    await supabase
      .from('j_hub_optimization_recordings')
      .update({ processing_status: 'completed' })
      .eq('id', recording_id);

    // Log API call for debugging (admin only)
    try {
      await supabase
        .from('j_hub_optimization_api_logs')
        .insert({
          recording_id,
          step: 'process',
          prompt_sent: `${systemPrompt}\n\n---\n\n${userPrompt}`,
          model_used: 'claude-sonnet-4-5-20250929',
          input_preview: transcript.full_text.substring(0, 5000),
          output_preview: processedText.substring(0, 5000),
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
          .from('j_hub_optimization_recordings')
          .update({ processing_status: 'failed' })
          .eq('id', reqRecordingId);

        // Log error
        await supabase
          .from('j_hub_optimization_api_logs')
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
