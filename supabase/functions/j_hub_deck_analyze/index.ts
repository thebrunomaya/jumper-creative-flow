import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateEnvironment } from '../_shared/env-validation.ts';
import { loadPatternMetadata } from '../_shared/template-utils.ts';
import { formatPatternCatalogForPrompt } from '../_shared/pattern-catalog.ts';
import { fetchWithRetry } from '../_shared/fetch-with-retry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

  try {
    // UTF-8 decoder
    const decoder = new TextDecoder('utf-8');

    // Validate environment variables
    console.log('🔒 [DECK_ANALYZE] Validating environment variables...');
    const env = validateEnvironment();
    console.log('✅ [DECK_ANALYZE] Environment validation passed');

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
      markdown_source,
      deck_type, // 'report', 'pitch', 'plan'
      template_id = 'koko-classic'
    } = body;

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

    // Build analysis prompt
    const systemPrompt = `You are an expert presentation designer analyzing content to recommend optimal slide patterns.

**Your Task:**
1. Analyze the provided markdown content for a ${deck_type} presentation
2. Identify distinct sections and their content types
3. Match each section to the BEST slide pattern from the available catalog
4. Output a structured plan in JSON format

**Critical Rules:**

1. **Pattern Diversity:**
   - Maximize pattern variety (avoid using same pattern >2x consecutively)
   - Target diversity score >0.75 (use at least 75% of relevant patterns)
   - Mix narrative + data visualization + emphasis slides

2. **Content-to-Pattern Matching:**
   - Timeline data (dates, weeks, milestones) → \`timeline\` pattern
   - Key insights (bold messages, findings) → \`statement-slide\` or \`statement-slide-reverse\`
   - Comparisons (channels, periods) → \`bar-chart\` pattern
   - Percentages (budget, share) → \`donut-chart\` pattern
   - Multi-stage process (funnel, journey) → \`funnel\` pattern
   - Trends over time → \`line-chart\` or \`stacked-area\` pattern
   - General text/lists → \`content-slide\` pattern
   - Key metrics (KPIs) → \`metric-cards\` pattern

3. **Structure Rules:**
   - First slide MUST be \`hero-slide\` (cover)
   - Use \`statement-slide\` for major insights (1 per 3-4 slides)
   - Last slide should be \`conclusion-slide\` if there's a final message
   - Use \`section-divider\` between major topics

4. **Quality Standards:**
   - Each slide must have clear purpose
   - Pattern choice must be justified by content type
   - Reasoning must explain WHY this pattern fits

**Output Format (strict JSON, no markdown fences):**

{
  "slides": [
    {
      "slide_number": 1,
      "section_title": "Cover",
      "content_summary": "Project title and metadata",
      "content_type": "cover",
      "recommended_pattern": "hero-slide",
      "reasoning": "First slide of presentation, requires dramatic cover"
    },
    {
      "slide_number": 2,
      "section_title": "Weekly Evolution",
      "content_summary": "Week 1 through Week 5 CPA progression",
      "content_type": "timeline",
      "recommended_pattern": "timeline",
      "reasoning": "Chronological data with dates - Timeline pattern shows progression perfectly"
    }
  ],
  "total_slides": 10,
  "pattern_diversity_score": 0.85
}

**IMPORTANT:**
- Output ONLY valid JSON (no markdown fences, no explanations)
- Calculate pattern_diversity_score as: (unique patterns used) / (total slides)
- Ensure slide_number starts at 1 and increments sequentially`;

    const userPrompt = `${patternCatalog}

---

# MARKDOWN CONTENT TO ANALYZE

**Deck Type:** ${deck_type}
**Template:** ${template_id}

${markdown_source}

---

# YOUR TASK

Analyze the markdown above and create a detailed slide-by-slide plan.
For each section/topic, recommend the best pattern from the catalog above.

Remember:
- First slide = hero-slide (cover)
- Maximize pattern diversity (aim for >0.75 score)
- Match content type to pattern purpose
- Provide clear reasoning for each pattern choice

Output valid JSON only (no markdown fences, no extra text).`;

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
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ],
        }),
        maxRetries: 3,
        timeoutMs: 30000,
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

    // Parse plan JSON
    let plan;
    try {
      plan = JSON.parse(planText);
    } catch (parseError) {
      console.error('❌ [DECK_ANALYZE] Failed to parse plan JSON:', planText.substring(0, 500));
      throw new Error(`Claude returned invalid JSON: ${parseError.message}`);
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

  } catch (error) {
    console.error('❌ [DECK_ANALYZE] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 500
      }
    );
  }
});
