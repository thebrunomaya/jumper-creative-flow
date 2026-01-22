// Force recompile - 2025-10-20: Fixed enhancement logging bug
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
      .from('j_hub_optimization_recordings')
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
      .eq('id', recording.account_id)
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
      .from('j_hub_optimization_recordings')
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
        .from('j_hub_optimization_prompts')
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

    // 5. Call OpenAI Whisper API with retry logic
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Helper function to detect transient errors
    const isTransientError = (status: number, contentType: string | null): boolean => {
      // Network/infrastructure errors that should be retried
      if ([502, 503, 504, 429].includes(status)) return true;

      // HTML responses from CDN indicate infrastructure issues
      if (contentType?.includes('text/html')) return true;

      return false;
    };

    // Helper function to call Whisper API with better error detection
    const callWhisperAPI = async (): Promise<any> => {
      // Create fresh FormData for each attempt (FormData can only be read once)
      const formData = new FormData();
      formData.append('file', audioData, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');
      formData.append('response_format', 'verbose_json');
      formData.append('prompt', finalPrompt);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      const contentType = response.headers.get('content-type');

      // Detect HTML error pages (502/503 from Cloudflare/CDN)
      if (contentType?.includes('text/html')) {
        const htmlText = await response.text();
        const isCloudflareError = htmlText.includes('cloudflare') || htmlText.includes('Bad gateway');

        if (isCloudflareError) {
          throw new Error(`TRANSIENT_ERROR: OpenAI API temporarily unavailable (CDN error: ${response.status})`);
        } else {
          throw new Error(`TRANSIENT_ERROR: Received HTML response instead of JSON (${response.status})`);
        }
      }

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `OpenAI API error: ${response.status}`;

        try {
          const errorJson = await response.json();
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText.substring(0, 500); // Limit error message length
        }

        // Classify error type
        if (isTransientError(response.status, contentType)) {
          throw new Error(`TRANSIENT_ERROR: ${errorMessage}`);
        } else {
          throw new Error(`PERMANENT_ERROR: ${errorMessage}`);
        }
      }

      return await response.json();
    };

    // Retry logic with exponential backoff
    const MAX_RETRIES = 3;
    let transcription: any = null;
    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`🎙️ [TRANSCRIBE] Attempt ${attempt + 1}/${MAX_RETRIES}`);
        transcription = await callWhisperAPI();
        break; // Success! Exit retry loop

      } catch (error: any) {
        lastError = error;
        console.error(`❌ [TRANSCRIBE] Attempt ${attempt + 1} failed:`, error.message);

        // If permanent error, fail immediately
        if (error.message.includes('PERMANENT_ERROR')) {
          throw new Error(error.message.replace('PERMANENT_ERROR: ', ''));
        }

        // If transient error and not last attempt, retry with exponential backoff
        if (error.message.includes('TRANSIENT_ERROR') && attempt < MAX_RETRIES - 1) {
          const delayMs = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
          console.log(`⏳ [TRANSCRIBE] Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        // Last attempt failed - throw final error
        if (attempt === MAX_RETRIES - 1) {
          throw new Error(`Transcription failed after ${MAX_RETRIES} attempts: ${error.message.replace('TRANSIENT_ERROR: ', '')}`);
        }
      }
    }

    if (!transcription) {
      throw lastError || new Error('Unknown transcription error');
    }

    const whisperLatency = Date.now() - startTime;

    console.log('✅ [TRANSCRIBE] Whisper completed:', transcription.text?.length || 0, 'chars,', whisperLatency, 'ms');

    // 6. ENHANCEMENT STEP: Claude Post-Processing for Quality
    let enhancedText = transcription.text;
    let enhancementLatency = 0;
    let enhancementSuccess = false;
    let enhancementPrompt = '';
    let enhancementTokensUsed: number | null = null;

    try {
      console.log('🔧 [ENHANCE] Starting automatic quality enhancement...');

      enhancementPrompt = `You are a Brazilian Portuguese transcription quality specialist.

Your job is to CORRECT ERRORS and FORMAT automatic transcriptions (Whisper) for readability, preserving the speaker's original meaning and style.

CORRECTIONS AND FORMATTING TO MAKE:
1. Proper nouns (campaign names, client names, brand names, product names)
2. Technical terms (CTR, CPA, ROAS, CPM, CPC, CPL, impressões, cliques, conversões, etc.)
3. Numbers and currency values (ensure clarity: "R$ 1.500" not "um mil e quinhentos reais")
4. Punctuation (add periods, commas, question marks where natural)
5. Paragraphs (break into logical sections for readability)

⭐ COMMON PHONETIC ERRORS IN BRAZILIAN PORTUGUESE PAID TRAFFIC:
These are VERY common mistakes that Whisper makes when transcribing PT-BR paid traffic audio. ALWAYS correct these:

- "edge" → should be "ad" (English word for advertisement)
- "edges" → should be "ads" (plural of ad)
- "roaz" or "roas" (lowercase) → should be "ROAS" (uppercase acronym)
- "cê-pê-cê" or "cpc" (lowercase) → should be "CPC" (uppercase)
- "cê-pê-ême" or "cpm" (lowercase) → should be "CPM" (uppercase)
- "cê-tê-érre" or "ctr" (lowercase) → should be "CTR" (uppercase)
- "cê-pê-á" or "cpa" (lowercase) → should be "CPA" (uppercase)
- "impressão" (singular when referring to metric) → "impressões" (plural)

⭐ FORMATTING RULES:
- Add punctuation naturally (periods at sentence ends, commas for pauses)
- Break long monologues into paragraphs at topic changes or natural pauses
- Use double line breaks (\\n\\n) to separate paragraphs
- Each paragraph should be 2-5 sentences maximum for easy reading
- Preserve speaker's original words and meaning

CRITICAL RULES:
- Do NOT rephrase or rewrite sentences
- Do NOT add information that wasn't spoken
- Do NOT remove filler words or natural speech patterns
- Preserve the exact flow and speaking style
- Only correct transcription errors and add formatting for readability

CONTEXT FOR PROPER NOUNS:
${contexto}

PLATFORM: ${platformName}

RAW TRANSCRIPTION TO CORRECT AND FORMAT:
${transcription.text}

OUTPUT: Return ONLY the corrected and formatted transcription as plain text with paragraphs separated by double line breaks (no markdown, no explanations, no preamble).`;

      const enhanceStartTime = Date.now();
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

      if (!anthropicKey) {
        console.warn('⚠️ [ENHANCE] ANTHROPIC_API_KEY not configured, skipping enhancement');
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          messages: [
            { role: 'user', content: enhancementPrompt }
          ]
        }),
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error('❌ [ENHANCE] Claude API error:', errorText);
        throw new Error(`Claude API error: ${claudeResponse.status}`);
      }

      const claudeData = await claudeResponse.json();
      enhancedText = claudeData.content[0].text;
      enhancementLatency = Date.now() - enhanceStartTime;
      enhancementSuccess = true;
      enhancementTokensUsed = (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0);

      console.log('✅ [ENHANCE] Enhancement completed');
      console.log('📏 [ENHANCE] Original length:', transcription.text.length, 'chars');
      console.log('📏 [ENHANCE] Enhanced length:', enhancedText.length, 'chars');
      console.log('⏱️ [ENHANCE] Latency:', enhancementLatency, 'ms');
      console.log('🎫 [ENHANCE] Tokens used:', claudeData.usage?.input_tokens + claudeData.usage?.output_tokens);

    } catch (error) {
      console.warn('⚠️ [ENHANCE] Enhancement failed, using raw Whisper output as fallback');
      console.warn('Error:', error.message);
      enhancedText = transcription.text; // Fallback to raw
      enhancementSuccess = false;
    }

    // 7. Store transcription in database (ENHANCED + RAW)
    // Using UPSERT to allow re-transcription without DELETE
    // NOTE: processed_text is NOT included here to preserve Step 2 work
    const { error: upsertError } = await supabase
      .from('j_hub_optimization_transcripts')
      .upsert({
        recording_id,
        full_text: enhancedText,  // Enhanced version (or raw if enhancement failed)
        // processed_text is omitted - maintains existing value on UPDATE, NULL on INSERT
        original_text: transcription.text,  // Always preserve raw Whisper output
        language: transcription.language || 'pt',
        confidence_score: null,
        segments: transcription.segments || null,
        revised_at: null,
        revised_by: null,
      }, {
        onConflict: 'recording_id',
        ignoreDuplicates: false, // Always update if exists
      });

    if (upsertError) {
      throw new Error(`Failed to save transcript: ${upsertError.message}`);
    }

    // 8. Update recording status to completed
    await supabase
      .from('j_hub_optimization_recordings')
      .update({
        transcription_status: 'completed',
        // processing_status remains 'pending' - user will trigger Step 2 manually
      })
      .eq('id', recording_id);

    // 9. Log API call for debugging (admin only) - Whisper
    await supabase
      .from('j_hub_optimization_api_logs')
      .insert({
        recording_id,
        step: 'transcribe',
        prompt_sent: finalPrompt,
        model_used: 'whisper-1',
        input_preview: `Audio file: ${recording.audio_file_path} | Duration: ${recording.duration_seconds}s`,
        output_preview: transcription.text.substring(0, 5000),
        tokens_used: null, // Whisper doesn't report tokens
        latency_ms: whisperLatency,
        success: true,
        error_message: null,
      });

    // 10. Log enhancement step (ALWAYS log, even if it failed completely)
    // This ensures Debug Modal shows both Whisper + Enhancement logs
    await supabase
      .from('j_hub_optimization_api_logs')
      .insert({
        recording_id,
        step: 'enhance_transcription',
        prompt_sent: enhancementPrompt || null, // Full prompt now saved
        model_used: 'claude-sonnet-4-5-20250929',
        input_preview: transcription.text.substring(0, 5000),
        output_preview: enhancementSuccess ? enhancedText.substring(0, 5000) : null,
        tokens_used: enhancementTokensUsed, // Actual tokens from Claude API
        latency_ms: enhancementLatency || null,
        success: enhancementSuccess,
        error_message: enhancementSuccess ? null : 'Enhancement failed, using raw Whisper output',
      });

    return new Response(
      JSON.stringify({
        success: true,
        text: enhancedText,  // Return enhanced version
        original_text: transcription.text,  // Also return original for reference
        enhanced: enhancementSuccess,  // Flag to indicate if enhancement was applied
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
          .from('j_hub_optimization_recordings')
          .update({ transcription_status: 'failed' })
          .eq('id', reqRecordingId);

        // Log error
        await supabase
          .from('j_hub_optimization_api_logs')
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
