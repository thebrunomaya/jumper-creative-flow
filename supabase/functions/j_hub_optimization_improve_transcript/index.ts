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
    const {
      recording_id,
      action,
      current_text,
      whisper_prompt,
      user_instructions
    } = body;

    reqRecordingId = recording_id ?? null;

    if (!recording_id) {
      throw new Error('recording_id is required');
    }

    console.log(`🔧 [IMPROVE] Action: ${action}, Recording: ${recording_id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============================================
    // ACTION 1: AI-Assisted Improvements
    // ============================================
    if (action === 'ai_improve') {
      if (!current_text || !user_instructions) {
        throw new Error('current_text and user_instructions are required for ai_improve action');
      }

      console.log('🤖 [IMPROVE] Processing AI improvements...');

      // System prompt emphasizing minimal changes
      const systemPrompt = `You are helping refine an audio transcription in Brazilian Portuguese.

CRITICAL RULES:
- Make MINIMAL changes - only what the user explicitly requests
- Do NOT rewrite or rephrase sentences
- Do NOT fix grammar unless explicitly asked
- Do NOT remove filler words unless explicitly asked
- Do NOT add punctuation unless explicitly asked
- ONLY correct what is mentioned in the user request
- Preserve the exact flow and structure of the original

Your job is to apply corrections precisely and conservatively.`;

      // User prompt with full context and clear section separators
      const userPrompt = `==============================================
CONTEXT: Original Whisper Prompt
==============================================
${whisper_prompt || 'No Whisper prompt available for this transcription.'}

==============================================
CURRENT TRANSCRIPTION TO BE CORRECTED
==============================================
${current_text}

==============================================
USER'S CORRECTION REQUEST
==============================================
${user_instructions}

==============================================
TASK
==============================================
Apply ONLY the corrections explicitly mentioned in the user's request above.
Make minimal changes - preserve everything else exactly as it is.

OUTPUT FORMAT:
Return the corrected transcription as plain text (no markdown formatting, no explanations, no preamble).`;

      const startTime = Date.now();

      // Call Claude API
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!anthropicKey) {
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
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!claudeResponse.ok) {
        const errorText = await claudeResponse.text();
        console.error('❌ [IMPROVE] Claude API error:', errorText);
        throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
      }

      const result = await claudeResponse.json();
      const improvedText = result.content[0].text;
      const latency = Date.now() - startTime;

      console.log('✅ [IMPROVE] Completed:', improvedText.length, 'chars,', latency, 'ms');

      // Log API call for admin debug
      const { error: logError } = await supabase
        .from('j_hub_optimization_api_logs')
        .insert({
          recording_id,
          step: 'improve_transcript',
          prompt_sent: systemPrompt + '\n\n' + userPrompt,
          model_used: 'claude-sonnet-4-5-20250929',
          input_preview: current_text.substring(0, 500),
          output_preview: improvedText.substring(0, 500),
          tokens_used: result.usage?.input_tokens + result.usage?.output_tokens,
          latency_ms: latency,
          success: true,
          error_message: null,
        });

      if (logError) {
        console.error('❌ [IMPROVE] Failed to save log:', logError);
      } else {
        console.log('✅ [IMPROVE] Log saved successfully');
      }

      return new Response(
        JSON.stringify({
          success: true,
          improved_text: improvedText
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // ============================================
    // ACTION 2: Re-transcribe
    // ============================================
    if (action === 'retranscribe') {
      console.log('🔄 [IMPROVE] Re-transcribing...');

      // Simply call the transcribe function again
      const transcribeResponse = await fetch(
        `${supabaseUrl}/functions/v1/j_hub_optimization_transcribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ recording_id })
        }
      );

      if (!transcribeResponse.ok) {
        throw new Error(`Transcribe function failed: ${transcribeResponse.status}`);
      }

      const transcribeResult = await transcribeResponse.json();

      console.log('✅ [IMPROVE] Re-transcription completed');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transcription regenerated successfully',
          data: transcribeResult
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('❌ [IMPROVE] Error:', error);

    // Try to log error if we have recording_id
    try {
      if (reqRecordingId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('j_hub_optimization_api_logs')
          .insert({
            recording_id: reqRecordingId,
            step: 'improve_transcript',
            prompt_sent: null,
            model_used: 'claude-sonnet-4-20250514',
            input_preview: 'Error occurred before API call',
            output_preview: null,
            tokens_used: null,
            latency_ms: null,
            success: false,
            error_message: error.message,
          });
      }
    } catch (logError) {
      console.error('❌ [IMPROVE] Failed to log error:', logError);
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
