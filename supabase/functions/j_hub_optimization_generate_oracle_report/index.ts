/**
 * Oracle Report Generator Edge Function
 *
 * Generates intelligent optimization reports adapted to audience:
 * - DELFOS 🏛️: Technical (300-400 words)
 * - ORFEU 🎵: Storytelling (600-800 words)
 * - NOSTRADAMUS 📜: Analytical (800-1000 words)
 *
 * Features:
 * - Smart caching (returns cached if exists)
 * - Cost tracking (logs tokens and estimated cost)
 * - Error handling with retries
 * - Anthropic Claude Sonnet 4.5
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Import prompt builders
import { buildOraclePrompt } from '../j_hub_optimization_generate_oracle_report/prompts/builder.ts';

// Anthropic API configuration
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929';
const ANTHROPIC_VERSION = '2023-06-01';

// Token pricing (per 1K tokens)
const INPUT_TOKEN_COST = 0.003; // $0.003 per 1K input tokens
const OUTPUT_TOKEN_COST = 0.015; // $0.015 per 1K output tokens

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Oracle types
 */
type OracleType = 'delfos' | 'orfeu' | 'nostradamus';

/**
 * Request body interface
 */
interface RequestBody {
  context_id: string;
  oracle: OracleType;
  account_name: string;
  force_regenerate?: boolean;
}

/**
 * Call Anthropic Claude API
 */
async function callClaudeAPI(
  prompt: string,
  anthropicApiKey: string
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    text: data.content[0].text,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

/**
 * Calculate estimated cost
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * INPUT_TOKEN_COST;
  const outputCost = (outputTokens / 1000) * OUTPUT_TOKEN_COST;
  return inputCost + outputCost;
}

/**
 * Log generation to database
 */
async function logGeneration(
  supabase: any,
  contextId: string,
  oracle: OracleType,
  generationTimeMs: number,
  cached: boolean,
  inputTokens: number | null,
  outputTokens: number | null,
  estimatedCost: number | null,
  status: 'success' | 'error' | 'timeout',
  errorMessage: string | null = null
) {
  try {
    await supabase.from('j_hub_oracle_generation_logs').insert({
      context_id: contextId,
      oracle,
      generation_time_ms: generationTimeMs,
      cached,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimatedCost,
      model_used: ANTHROPIC_MODEL,
      status,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('Failed to log generation:', error);
    // Don't throw - logging failure shouldn't break the function
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { context_id, oracle, account_name, force_regenerate = false } = body;

    // Validate oracle type
    if (!['delfos', 'orfeu', 'nostradamus'].includes(oracle)) {
      return new Response(
        JSON.stringify({ error: `Invalid oracle type: ${oracle}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!context_id || !account_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: context_id, account_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client (service role for full access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch optimization context
    const { data: context, error: contextError } = await supabase
      .from('j_hub_optimization_context')
      .select('*')
      .eq('id', context_id)
      .single();

    if (contextError || !context) {
      return new Response(
        JSON.stringify({ error: 'Optimization context not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache (if not forcing regeneration)
    if (!force_regenerate && context.generated_reports?.[oracle]) {
      const generationTime = Date.now() - startTime;

      // Log cached retrieval
      await logGeneration(
        supabase,
        context_id,
        oracle,
        generationTime,
        true, // cached
        null,
        null,
        null,
        'success'
      );

      return new Response(
        JSON.stringify({
          report: context.generated_reports[oracle],
          oracle,
          cached: true,
          generation_time_ms: generationTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt
    const prompt = buildOraclePrompt(oracle, account_name, {
      summary: context.summary,
      actions_taken: context.actions_taken,
      metrics_mentioned: context.metrics_mentioned,
      strategy: context.strategy,
      timeline: context.timeline,
      confidence_level: context.confidence_level,
    });

    // Call Claude API
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const { text: generatedReport, inputTokens, outputTokens } = await callClaudeAPI(
      prompt,
      anthropicApiKey
    );

    const estimatedCost = calculateCost(inputTokens, outputTokens);
    const generationTime = Date.now() - startTime;

    // Update context with generated report
    const updatedReports = {
      ...context.generated_reports,
      [oracle]: generatedReport,
      generated_at: new Date().toISOString(),
      last_oracle_used: oracle,
    };

    await supabase
      .from('j_hub_optimization_context')
      .update({ generated_reports: updatedReports })
      .eq('id', context_id);

    // Log generation
    await logGeneration(
      supabase,
      context_id,
      oracle,
      generationTime,
      false, // not cached
      inputTokens,
      outputTokens,
      estimatedCost,
      'success'
    );

    // Return success response
    return new Response(
      JSON.stringify({
        report: generatedReport,
        oracle,
        cached: false,
        generation_time_ms: generationTime,
        tokens: {
          input: inputTokens,
          output: outputTokens,
        },
        estimated_cost_usd: estimatedCost,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const generationTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Oracle generation error:', errorMessage);

    // Try to log error if we have context_id
    try {
      const body: RequestBody = await req.json();
      if (body.context_id && body.oracle) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await logGeneration(
          supabase,
          body.context_id,
          body.oracle as OracleType,
          generationTime,
          false,
          null,
          null,
          null,
          'error',
          errorMessage
        );
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        generation_time_ms: generationTime,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
