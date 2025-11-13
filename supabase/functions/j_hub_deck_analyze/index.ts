import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { validateEnvironment } from '../_shared/env-validation.ts';
import { loadPatternMetadata } from '../_shared/template-utils.ts';
import { formatPatternCatalogForPrompt } from '../_shared/pattern-catalog.ts';
import { fetchWithRetry } from '../_shared/fetch-with-retry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Increased timeout to 150 seconds (2.5 minutes) to handle large content analysis
// Claude Sonnet 4.5 typically takes 60-120s for complex deck analysis
Deno.serve({
  signal: AbortSignal.timeout(150000),  // 150 seconds
}, async (req) => {
  // Log EVERY request immediately
  console.log('📨 [DECK_ANALYZE] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    console.log('✅ [DECK_ANALYZE] Responding to OPTIONS (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }

  let deckId: string | null = null;

  try {
    // UTF-8 decoder
    const decoder = new TextDecoder('utf-8');

    // Validate environment variables
    console.log('🔒 [DECK_ANALYZE] Validating environment variables...');
    const env = validateEnvironment();
    console.log('✅ [DECK_ANALYZE] Environment validation passed');

    // Create Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔍 [DECK_ANALYZE] Starting content analysis...');

    // Parse request body with explicit UTF-8 decoding
    console.log('📦 [DECK_ANALYZE] Parsing request body...');
    const bodyBytes = await req.arrayBuffer();
    const bodyText = decoder.decode(bodyBytes);
    const body = JSON.parse(bodyText);

    console.log('📦 [DECK_ANALYZE] Body parsed:', {
      has_markdown: !!body.markdown_source,
      markdown_length: body.markdown_source?.length || 0,
      deck_type: body.deck_type,
      template_id: body.template_id
    });

    const {
      deck_id, // Optional: for status updates and logging
      markdown_source,
      deck_type, // 'report', 'pitch', 'plan'
      template_id = 'koko-classic'
    } = body;

    deckId = deck_id; // Store for error handling

    // Check for stuck status and update analysis_status if deck_id provided
    if (deck_id) {
      // Load current deck status
      const { data: currentDeck } = await supabase
        .from('j_hub_decks')
        .select('analysis_status, updated_at')
        .eq('id', deck_id)
        .single();

      if (currentDeck?.analysis_status === 'processing') {
        const updatedAt = new Date(currentDeck.updated_at);
        const now = new Date();
        const minutesSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000 / 60;

        if (minutesSinceUpdate > 10) {
          console.warn('⚠️ [DECK_ANALYZE] Deck stuck in analysis for', minutesSinceUpdate.toFixed(1), 'minutes - allowing retry');
          // Continue to update status below (will reset to processing)
        } else {
          throw new Error(`Deck is already being analyzed (started ${minutesSinceUpdate.toFixed(1)} minutes ago). Please wait.`);
        }
      }

      console.log('🔄 [DECK_ANALYZE] Updating analysis_status to processing...');
      await supabase
        .from('j_hub_decks')
        .update({ analysis_status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', deck_id);
    }

    // Enhanced input validation
    console.log('✅ [DECK_ANALYZE] Starting input validation...');
    if (!markdown_source || typeof markdown_source !== 'string') {
      throw new Error('Markdown source is required');
    }

    if (markdown_source.length < 10) {
      throw new Error('Markdown source too short (minimum 10 characters)');
    }

    if (markdown_source.length > 500000) {
      throw new Error('Markdown source too large (maximum 500KB)');
    }

    const validTypes = ['report', 'pitch', 'plan'];
    if (!deck_type || !validTypes.includes(deck_type)) {
      throw new Error(`Invalid deck_type: ${deck_type}. Must be one of: ${validTypes.join(', ')}`);
    }

    console.log('📋 [DECK_ANALYZE] Request validated:', {
      deck_type,
      template_id,
      markdown_length: markdown_source.length,
      markdown_preview: markdown_source.substring(0, 100) + '...'
    });

    // Load pattern metadata for this template
    console.log('📚 [DECK_ANALYZE] Loading pattern metadata...');
    const patternMetadata = await loadPatternMetadata(template_id);
    const patternCatalog = formatPatternCatalogForPrompt(patternMetadata);

    console.log('✅ [DECK_ANALYZE] Pattern catalog loaded:', {
      patterns_available: patternMetadata.patterns.length,
      catalog_size_chars: patternCatalog.length
    });

    // Build analysis prompt (OPTIMIZED for speed - reduced verbosity while maintaining quality)
    const systemPrompt = `Expert presentation designer. Analyze markdown, recommend slide patterns.

**Task:** Create JSON plan matching content to patterns from catalog.

**Rules:**
- First slide = hero-slide (cover)
- Vary patterns (diversity >0.75)
- Match content: timeline→dates, bar-chart→comparisons, donut-chart→%, statement-slide→insights
- JSON only, no markdown fences

**Output:**
{
  "slides": [
    {"slide_number": 1, "section_title": "...", "content_summary": "...", "content_type": "...", "recommended_pattern": "...", "reasoning": "..."}
  ],
  "total_slides": N,
  "pattern_diversity_score": 0.XX
}`;

    const userPrompt = `${patternCatalog}

# CONTENT (${deck_type})
${markdown_source}

Create slide-by-slide JSON plan. First=hero-slide, vary patterns, match content types. JSON only.`;

    // Call Claude for content analysis
    console.log('🤖 [DECK_ANALYZE] Calling Claude Sonnet 4.5 for analysis...');
    console.log('📊 [DECK_ANALYZE] Token estimate:', {
      system_prompt: Math.ceil(systemPrompt.length / 4),
      pattern_catalog: Math.ceil(patternCatalog.length / 4),
      markdown: Math.ceil(markdown_source.length / 4),
      total_input_estimate: Math.ceil((systemPrompt.length + patternCatalog.length + markdown_source.length) / 4)
    });

    const startTime = Date.now();

    const claudeResponse = await fetchWithRetry(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,  // Increased to ensure complete JSON response (was too low at 3000)
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ],
        }),
        maxRetries: 2,  // Reduced retries to avoid cumulative timeout
        timeoutMs: 120000,  // Increased to 120s to match function timeout
        retryOn5xx: true,
      }
    );

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ [DECK_ANALYZE] Claude API error:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    // Force UTF-8 decoding of Claude response
    const claudeBytes = await claudeResponse.arrayBuffer();
    const claudeText = decoder.decode(claudeBytes);
    const claudeData = JSON.parse(claudeText);

    const latency = Date.now() - startTime;

    // Validate Claude API response structure
    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('❌ [DECK_ANALYZE] Invalid Claude response structure:', claudeData);
      throw new Error('Invalid Claude API response: missing content array');
    }

    if (!claudeData.content[0] || !claudeData.content[0].text) {
      console.error('❌ [DECK_ANALYZE] Invalid Claude response structure:', claudeData.content[0]);
      throw new Error('Invalid Claude API response: missing text in content[0]');
    }

    // Extract plan from Claude response
    let planText = claudeData.content[0].text.trim();

    // Clean up markdown fences if Claude included them (despite instructions)
    planText = planText.replace(/^```json\n/, '').replace(/\n```$/, '').trim();

    // Check if response was truncated due to max_tokens limit
    if (claudeData.stop_reason === 'max_tokens') {
      console.error('⚠️ [DECK_ANALYZE] Claude response truncated - hit max_tokens limit!');
      console.error('📊 [DECK_ANALYZE] Token usage:', {
        input: claudeData.usage?.input_tokens || 0,
        output: claudeData.usage?.output_tokens || 0,
        total: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)
      });
      throw new Error('Claude response truncated - analysis too complex. Try shorter content or simpler deck type.');
    }

    // Parse plan JSON
    let plan;
    try {
      plan = JSON.parse(planText);
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      console.error('❌ [DECK_ANALYZE] Failed to parse plan JSON:', planText.substring(0, 500));
      console.error('📏 [DECK_ANALYZE] Response length:', planText.length, 'characters');
      throw new Error(`Claude returned invalid JSON: ${errorMessage}`);
    }

    // Validate plan structure
    if (!plan.slides || !Array.isArray(plan.slides)) {
      throw new Error('Invalid plan structure: missing slides array');
    }

    if (!plan.total_slides || typeof plan.total_slides !== 'number') {
      throw new Error('Invalid plan structure: missing or invalid total_slides');
    }

    if (plan.slides.length !== plan.total_slides) {
      console.warn('⚠️ [DECK_ANALYZE] Slide count mismatch:', {
        slides_array_length: plan.slides.length,
        total_slides_declared: plan.total_slides
      });
      // Fix total_slides to match actual array length
      plan.total_slides = plan.slides.length;
    }

    console.log('✅ [DECK_ANALYZE] Analysis complete:', {
      total_slides: plan.total_slides,
      pattern_diversity: plan.pattern_diversity_score,
      latency_ms: latency,
      input_tokens: claudeData.usage?.input_tokens || 0,
      output_tokens: claudeData.usage?.output_tokens || 0,
      total_tokens: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)
    });

    // Log pattern distribution for debugging
    const patternCounts: Record<string, number> = {};
    plan.slides.forEach((slide: any) => {
      const pattern = slide.recommended_pattern;
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    });

    console.log('📊 [DECK_ANALYZE] Pattern distribution:', patternCounts);

    // Update analysis_status + save plan if deck_id provided
    if (deck_id) {
      console.log('💾 [DECK_ANALYZE] Saving plan to database...');
      await supabase
        .from('j_hub_decks')
        .update({
          generation_plan: plan,
          analysis_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', deck_id);

      // Log API call
      console.log('📝 [DECK_ANALYZE] Logging API call...');
      await supabase
        .from('j_hub_deck_api_logs')
        .insert({
          deck_id: deck_id,
          stage: 'analysis',
          prompt_sent: systemPrompt + '\n\n' + userPrompt,
          response_received: JSON.stringify(plan),
          tokens_used: {
            input: claudeData.usage?.input_tokens || 0,
            output: claudeData.usage?.output_tokens || 0,
            total: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)
          },
          latency_ms: latency,
          model_used: 'claude-sonnet-4-5-20250929',
          success: true
        });
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        plan: plan,
        template_id: template_id,
        pattern_metadata: patternMetadata,
        tokens_used: {
          input: claudeData.usage?.input_tokens || 0,
          output: claudeData.usage?.output_tokens || 0,
          total: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)
        },
        latency_ms: latency
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 200
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ [DECK_ANALYZE] Error:', error);

    // Update status to 'failed' if we have deck_id
    if (deckId) {
      try {
        const env = validateEnvironment();
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        await supabase
          .from('j_hub_decks')
          .update({
            analysis_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', deckId);

        // Log failed API call
        await supabase
          .from('j_hub_deck_api_logs')
          .insert({
            deck_id: deckId,
            stage: 'analysis',
            success: false,
            error_message: errorMessage
          });
      } catch (logError) {
        console.error('Failed to update error status:', logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 500
      }
    );
  }
});
