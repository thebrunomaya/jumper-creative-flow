import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let reqRecordingId: string | null = null;

  try {
    const body = await req.json();
    const { recording_id } = body;
    reqRecordingId = recording_id ?? null;

    if (!recording_id) {
      throw new Error('recording_id is required');
    }

    console.log('🎙️ [TRANSCRIBE] Starting:', recording_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get recording details
    const { data: recording, error: recordingError } = await supabase
      .from('j_ads_optimization_recordings')
      .select('*')
      .eq('id', recording_id)
      .single();

    if (recordingError || !recording) {
      throw new Error(`Recording not found: ${recordingError?.message}`);
    }

    // 1.5. Build account context - Priority: override_context > Notion > auto-generated
    let accountContextFinal = '';
    let accountName = 'Conta não identificada';

    // Priority 1: Check if user edited context for this recording
    if (recording.override_context) {
      accountContextFinal = recording.override_context;
    }

    // Fetch Notion account data for name and context
    const { data: accountData } = await supabase
      .from('j_hub_notion_db_accounts')
      .select('*')
      .eq('notion_id', recording.account_id)
      .maybeSingle();

    if (accountData) {
      // Extract account name (always needed for prompt)
      accountName = accountData.Conta || accountName;

      // If no override context, get from Notion
      if (!recording.override_context) {
        // Priority 2: Use dedicated "Contexto para Transcrição" column
        if (accountData['Contexto para Transcrição']) {
          accountContextFinal = accountData['Contexto para Transcrição'];
        } else if (accountData['Contexto para Otimização']) {
          // Fallback to old column
          accountContextFinal = accountData['Contexto para Otimização'];
        }
        // If both empty, context remains empty
      }
    }

    // 2. Update status to processing
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ transcription_status: 'processing' })
      .eq('id', recording_id);

    // 3. Download audio from storage
    const filePath = recording.audio_file_path as string;

    const { data: audioData, error: downloadError } = await supabase.storage
      .from('optimizations')
      .download(filePath);

    if (downloadError || !audioData) {
      console.error('❌ [TRANSCRIBE] Download error:', downloadError);
      throw new Error(`Failed to download audio: ${downloadError?.message || 'No data returned'}`);
    }

    // 4. Fetch transcribe prompts from database for selected objectives
    let objectivePromptsText = '';
    if (recording.selected_objectives && recording.selected_objectives.length > 0) {
      const { data: prompts } = await supabase
        .from('j_ads_optimization_prompts')
        .select('prompt_text')
        .eq('platform', recording.platform)
        .in('objective', recording.selected_objectives)
        .eq('prompt_type', 'transcribe');

      if (prompts && prompts.length > 0) {
        objectivePromptsText = prompts.map(p => p.prompt_text).join('\n\n');
        console.log(`📝 [TRANSCRIBE] Using ${prompts.length} objective-specific prompts`);
      }
    }

    // 5. Build optimized Whisper prompt in English (model's native language)
    const platformName = recording.platform === 'google' ? 'Google Ads' : 'Meta Ads';

    // Limit context to 400 chars (leave room for rest of prompt)
    const contexto = accountContextFinal.substring(0, 400);

    // Build final prompt in English with explicit instructions
    let finalPrompt = `Audio transcription of paid traffic analysis in Brazilian Portuguese.

During transcription, pay special attention to correctly transcribe the following names and terms that will likely be spoken:

PROPER NAMES AND CONTEXT:
${contexto}

PLATFORM: ${platformName}

${objectivePromptsText}

OUTPUT: Transcribe in Brazilian Portuguese.`;

    console.log('📏 [TRANSCRIBE] Prompt size:', finalPrompt.length, 'chars');

    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json'); // Get segments with timestamps
    formData.append('prompt', finalPrompt);

    // 5. Call OpenAI Whisper API
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const startTime = Date.now();
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('❌ [TRANSCRIBE] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${whisperResponse.status} - ${errorText}`);
    }

    const transcription = await whisperResponse.json();
    const latency = Date.now() - startTime;

    console.log('✅ [TRANSCRIBE] Completed:', transcription.text?.length || 0, 'chars,', latency, 'ms');

    // 6. Store transcription in database (RAW ONLY - no processing)
    const { error: insertError } = await supabase
      .from('j_ads_optimization_transcripts')
      .insert({
        recording_id,
        full_text: transcription.text,
        processed_text: null, // Processing is now Step 2 (separate function)
        original_text: transcription.text,
        language: transcription.language || 'pt',
        confidence_score: null,
        segments: transcription.segments || null,
        revised_at: null,
        revised_by: null,
      });

    if (insertError) {
      throw new Error(`Failed to save transcript: ${insertError.message}`);
    }

    // 7. Update recording status to completed
    await supabase
      .from('j_ads_optimization_recordings')
      .update({
        transcription_status: 'completed',
        // processing_status remains 'pending' - user will trigger Step 2 manually
      })
      .eq('id', recording_id);

    // 8. Log API call for debugging (admin only)
    await supabase
      .from('j_ads_optimization_api_logs')
      .insert({
        recording_id,
        step: 'transcribe',
        prompt_sent: finalPrompt,
        model_used: 'whisper-1',
        input_preview: `Audio file: ${recording.audio_file_path} | Duration: ${recording.duration_seconds}s`,
        output_preview: transcription.text.substring(0, 500),
        tokens_used: null, // Whisper doesn't report tokens
        latency_ms: latency,
        success: true,
        error_message: null,
      });

    return new Response(
      JSON.stringify({
        success: true,
        text: transcription.text,
        language: transcription.language,
        segments: transcription.segments?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ [TRANSCRIBE] Error:', error);

    // Try to update status to failed if we have recording_id
    try {
      if (reqRecordingId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('j_ads_optimization_recordings')
          .update({ transcription_status: 'failed' })
          .eq('id', reqRecordingId);

        // Log error
        await supabase
          .from('j_ads_optimization_api_logs')
          .insert({
            recording_id: reqRecordingId,
            step: 'transcribe',
            prompt_sent: null,
            model_used: 'whisper-1',
            input_preview: 'Error occurred before API call',
            output_preview: null,
            tokens_used: null,
            latency_ms: null,
            success: false,
            error_message: error.message,
          });
      }
    } catch (updateError) {
      console.error('❌ [TRANSCRIBE] Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
