import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { validateEnvironment } from '../_shared/env-validation.ts';
import { fetchWithRetry } from '../_shared/fetch-with-retry.ts';
import { loadPatternMetadata } from '../_shared/template-utils.ts';
import { formatPatternCatalogForPrompt, formatPlanForGenerationPrompt } from '../_shared/pattern-catalog.ts';
import { diagnoseEncoding, logEncodingDiagnostics } from '../_shared/encoding-diagnostics.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * j_hub_deck_generate - Stage 3: HTML Generation
 *
 * REFACTORED: Now only handles Stage 3 (HTML generation)
 * Assumes Stage 1 (analysis) has already completed and generation_plan exists
 *
 * Flow:
 * 1. Load deck from DB (must have generation_plan)
 * 2. Update generation_status = 'processing'
 * 3. Generate HTML using approved plan
 * 4. Upload to Storage
 * 5. Update generation_status = 'completed'
 * 6. Log API call to j_hub_deck_api_logs
 *
 * TIMEOUT: 300 seconds (5 minutes) to handle complex HTML generation
 * Claude Sonnet 4.5 can take 180-240s for large decks with 20+ slides
 */
Deno.serve({
  signal: AbortSignal.timeout(300000),  // 300 seconds = 5 minutes
}, async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let deckId: string | null = null;

  try {
    const decoder = new TextDecoder('utf-8');
    const env = validateEnvironment();

    // Extract authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const bodyBytes = await req.arrayBuffer();
    const bodyText = decoder.decode(bodyBytes);
    const body = JSON.parse(bodyText);

    const { deck_id } = body;

    if (!deck_id || typeof deck_id !== 'string') {
      throw new Error('deck_id is required');
    }

    deckId = deck_id;

    console.log('🎨 [DECK_GENERATE] Stage 3: Starting HTML generation for deck:', deck_id);

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // ========================================================================
    // LOAD DECK FROM DB (must have generation_plan from Stage 1)
    // ========================================================================
    const { data: deck, error: loadError } = await supabase
      .from('j_hub_decks')
      .select('*')
      .eq('id', deck_id)
      .single();

    if (loadError || !deck) {
      throw new Error(`Deck not found: ${deck_id}`);
    }

    // Validate deck belongs to user (security)
    if (deck.user_id !== user.id) {
      throw new Error('Unauthorized: Deck belongs to another user');
    }

    // Validate Stage 1 completed
    if (!deck.generation_plan || deck.analysis_status !== 'completed') {
      throw new Error('Stage 1 (Content Analysis) not completed. Please run j_hub_deck_analyze first.');
    }

    console.log('✅ [DECK_GENERATE] Deck loaded:', {
      title: deck.title,
      type: deck.type,
      template_id: deck.template_id,
      analysis_status: deck.analysis_status,
      generation_status: deck.generation_status,
      total_slides: deck.generation_plan.total_slides
    });

    // 🔍 DIAGNOSTIC 1: Check markdown source encoding
    const markdownDiagnostics = diagnoseEncoding(deck.markdown_source, 'markdown_source_from_db');
    logEncodingDiagnostics(markdownDiagnostics);

    // ========================================================================
    // DETECT STUCK STATUS (processing for >10 minutes = stuck from timeout)
    // ========================================================================
    if (deck.generation_status === 'processing') {
      const updatedAt = new Date(deck.updated_at);
      const now = new Date();
      const minutesSinceUpdate = (now.getTime() - updatedAt.getTime()) / 1000 / 60;

      if (minutesSinceUpdate > 10) {
        console.warn('⚠️ [DECK_GENERATE] Deck stuck in processing for', minutesSinceUpdate.toFixed(1), 'minutes - allowing retry');
        // Reset to 'pending' to allow retry
        await supabase
          .from('j_hub_decks')
          .update({
            generation_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', deck_id);
      } else {
        throw new Error(`Deck is already being processed (started ${minutesSinceUpdate.toFixed(1)} minutes ago). Please wait.`);
      }
    }

    // ========================================================================
    // UPDATE STATUS: generation_status = 'processing'
    // ========================================================================
    const { error: statusError } = await supabase
      .from('j_hub_decks')
      .update({ generation_status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', deck_id);

    if (statusError) {
      console.error('Failed to update generation_status:', statusError);
    }

    // ========================================================================
    // LOAD TEMPLATE & PATTERN METADATA
    // ========================================================================
    // Map template IDs to v2 versions with external CSS (token optimization)
    const templateIdWithExternalCSS = deck.template_id === 'koko-classic'
      ? 'koko-classic-v2'
      : deck.template_id;

    console.log('📄 [DECK_GENERATE] Loading template:', {
      original: deck.template_id,
      using: templateIdWithExternalCSS
    });

    const pattern_metadata = await loadPatternMetadata(deck.template_id);

    console.log('📄 [DECK_GENERATE] Template configuration:', {
      template_id: templateIdWithExternalCSS,
      uses_external_css: templateIdWithExternalCSS.includes('-v2'),
      pattern_count: pattern_metadata.patterns?.length || 0
    });

    // ========================================================================
    // LOAD ACCOUNT CONTEXT (optional)
    // ========================================================================
    let accountName: string | null = null;
    let accountContext = '';

    if (deck.account_id) {
      const { data: account } = await supabase
        .from('j_hub_notion_db_accounts')
        .select('name')
        .eq('id', deck.account_id)
        .single();

      if (account) {
        accountName = account.name;
        accountContext = `Account: ${account.name}`;
        console.log('✅ [DECK_GENERATE] Account context loaded:', accountName);
      }
    }

    // ========================================================================
    // STAGE 3: HTML GENERATION (guided by approved plan)
    // ========================================================================
    const approvedPlan = deck.generation_plan;

    console.log('🎨 [DECK_GENERATE] Stage 3: Generating HTML following approved plan...');

    // Build system prompt
    const systemPrompt = `You are an expert presentation designer creating HTML presentations.

**Your Role:**
Transform markdown data into beautiful, interactive HTML slides following a PRE-APPROVED SLIDE PLAN.

**Critical Rules:**

0. ⚠️ MANDATORY: FOLLOW THE APPROVED PLAN EXACTLY
   - For each slide in the plan, use EXACTLY the recommended pattern
   - If slide says pattern "timeline", you MUST use Timeline pattern CSS (.timeline-container)
   - DO NOT improvise, DO NOT change patterns

1. STRUCTURE:
   - Generate ${approvedPlan.total_slides} slides (no more, no less)
   - Each slide must follow the plan's recommended pattern
   - Use the provided CSS classes (styles are loaded via external CSS link)
   - Template uses external CSS at: https://hub.jumper.studio/decks/templates/${templateIdWithExternalCSS}.css

2. UTF-8 ENCODING (CRITICAL):
   - Ensure <meta charset="UTF-8"> is FIRST tag in <head>
   - DO NOT escape or break UTF-8 characters
   - Test: "Relatório" should render correctly, NOT "RelatÃ³rio"

3. GRADIENT BACKGROUNDS (MANDATORY FOR COVER/CLOSING SLIDES):
   ⚠️ CRITICAL: For split layout slides, you MUST use gradient IMAGE URLs, NOT CSS gradients!

   - For "cover-split-gradient-right" pattern (Cover slide):
     <div class="slide-split-gradient" style="background-image: url('https://hub.jumper.studio/decks/identities/jumper/gradients/organic-01.png');"></div>

   - For "closing-split-gradient-left" pattern (Closing slide):
     <div class="slide-split-gradient" style="background-image: url('https://hub.jumper.studio/decks/identities/jumper/gradients/organic-02.png');"></div>

   DO NOT use: background: linear-gradient(...)
   ALWAYS use: background-image: url('https://hub.jumper.studio/decks/identities/jumper/gradients/...')

4. OUTPUT:
   - Return ONLY the complete HTML (no markdown fences, no explanations)
   - HTML must be production-ready (can be opened directly in browser)

5. OPTIMIZATION:
   - Remove ALL CSS comments to save tokens
   - Keep CSS minified and compact
   - Focus output tokens on <body> content, not CSS documentation

OUTPUT FORMAT: Complete standalone HTML file (no markdown fences, no explanations)`;

    // Build user prompt
    const userPrompt = `==============================================
DECK CONFIGURATION
==============================================
Title: ${deck.title}
Type: ${deck.type}
Template: ${templateIdWithExternalCSS}
${accountName ? `Account: ${accountName}` : ''}

==============================================
APPROVED SLIDE PLAN (FOLLOW EXACTLY)
==============================================
${formatPlanForGenerationPrompt(approvedPlan)}

==============================================
EXTERNAL CSS STYLESHEET
==============================================
The template uses external CSS linked in <head>:
<link rel="stylesheet" href="https://hub.jumper.studio/decks/templates/${templateIdWithExternalCSS}.css">

This CSS file contains all styles for:
- Design system (colors, fonts, spacing)
- Slide patterns (hero, content, charts, etc)
- Components (cards, timelines, metrics)
- Responsive adjustments
- Animations and transitions

Use the CSS classes from the approved plan patterns. The styles are already defined.

==============================================
BRAND COLORS (FROM DESIGN SYSTEM IN CSS)
==============================================
Yellow: #F5C542
Pink: #FF0080
Black: #000000
White: #FFFFFF
Gray: #BDBDBD

${accountContext ? `
==============================================
ACCOUNT CONTEXT
==============================================
${accountContext}
` : ''}

==============================================
MARKDOWN SOURCE (DATA ONLY - NO HALLUCINATION)
==============================================
${deck.markdown_source}

==============================================
TASK
==============================================
Generate COMPLETE HTML presentation following the approved plan above.

CRITICAL: Include <link> tag for external CSS in <head>:
<link rel="stylesheet" href="https://hub.jumper.studio/decks/templates/${templateIdWithExternalCSS}.css">

For each slide in the plan:
1. Use the recommended pattern (e.g., timeline → .timeline-container CSS)
2. Replace template content with data from markdown source
3. Use CSS class names that match the patterns (classes are defined in external CSS)
4. Apply brand colors via CSS variables and classes

IMPORTANT:
- Do NOT embed <style> tags (CSS is external)
- Do NOT inline styles (use CSS classes instead)
- Focus all output on semantic HTML structure and content

OUTPUT FORMAT: Complete standalone HTML file (no markdown fences, no explanations)`;

    console.log('🤖 [DECK_GENERATE] Calling Claude Sonnet 4.5 for HTML generation...');
    console.log('📏 [DECK_GENERATE] Markdown length:', deck.markdown_source.length, 'chars');
    console.log('📊 [DECK_GENERATE] Stage 3 prompt size estimate:', {
      system_prompt_chars: systemPrompt.length,
      user_prompt_chars: userPrompt.length,
      system_tokens: Math.ceil(systemPrompt.length / 4),
      user_tokens: Math.ceil(userPrompt.length / 4),
      total_tokens_estimate: Math.ceil((systemPrompt.length + userPrompt.length) / 4)
    });

    // Call Claude API
    const startTime = Date.now();
    const claudeResponse = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000, // Need full capacity for complete HTML
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
      maxRetries: 1,  // Reduced to 1 retry to avoid cumulative timeout (1 retry = max 480s total)
      timeoutMs: 240000, // Increased to 240s (4 minutes) for complex deck generation
      retryOn5xx: true,
    });

    console.log('✅ [DECK_GENERATE] Claude API responded:', {
      status: claudeResponse.status,
      statusText: claudeResponse.statusText
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ [DECK_GENERATE] Claude API error:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText.substring(0, 200)}`);
    }

    // Parse response (use .text() for proper UTF-8 handling)
    console.log('📦 [DECK_GENERATE] Parsing Claude response...');
    const claudeText = await claudeResponse.text();  // ✅ Automatic UTF-8 decode, prevents double-decoding
    const claudeData = JSON.parse(claudeText);

    const latency = Date.now() - startTime;
    console.log('⏱️ [DECK_GENERATE] Claude API latency:', {
      latency_ms: latency,
      latency_seconds: (latency / 1000).toFixed(1),
      input_tokens: claudeData.usage?.input_tokens || 0,
      output_tokens: claudeData.usage?.output_tokens || 0
    });

    // Validate response structure
    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('❌ [DECK_GENERATE] Invalid Claude response structure:', claudeData);
      throw new Error('Invalid Claude API response: missing content array');
    }

    if (!claudeData.content[0] || !claudeData.content[0].text) {
      console.error('❌ [DECK_GENERATE] Invalid Claude response structure:', claudeData.content[0]);
      throw new Error('Invalid Claude API response: missing text in content[0]');
    }

    let htmlOutput = claudeData.content[0].text.trim();

    // Sanity check
    if (htmlOutput.length < 100) {
      console.error('❌ [DECK_GENERATE] Claude returned suspiciously short HTML:', htmlOutput.length, 'chars');
      throw new Error('Claude returned suspiciously short HTML output (less than 100 characters)');
    }

    // Clean up markdown fences if included
    htmlOutput = htmlOutput.replace(/^```html\n/, '').replace(/\n```$/, '').trim();

    console.log('✅ [DECK_GENERATE] HTML generated');
    console.log('📏 [DECK_GENERATE] HTML length:', htmlOutput.length, 'chars');

    // 🔍 DIAGNOSTIC 2: Check Claude API response encoding
    const claudeResponseDiagnostics = diagnoseEncoding(htmlOutput, 'claude_api_response');
    logEncodingDiagnostics(claudeResponseDiagnostics);

    // ========================================================================
    // VALIDATION: Check for common issues
    // ========================================================================
    const validationErrors: string[] = [];

    // Check 1: UTF-8 corruption patterns (mojibake)
    const corruptionPatterns = ['Ã³', 'Ã§', 'Ã£', 'Ãª', 'Ã ', 'Ã©'];
    const hasCorruption = corruptionPatterns.some(pattern => htmlOutput.includes(pattern));
    if (hasCorruption) {
      validationErrors.push('UTF-8 encoding corruption detected (mojibake characters found)');
    }

    // Check 2: Gradient URLs for cover/closing slides
    const planHasCoverSlide = approvedPlan.slides.some((s: any) =>
      s.recommended_pattern === 'cover-split-gradient-right'
    );
    const planHasClosingSlide = approvedPlan.slides.some((s: any) =>
      s.recommended_pattern === 'closing-split-gradient-left'
    );

    if (planHasCoverSlide && !htmlOutput.includes('organic-01.png')) {
      validationErrors.push('Cover slide missing organic-01.png gradient URL');
    }

    if (planHasClosingSlide && !htmlOutput.includes('organic-02.png')) {
      validationErrors.push('Closing slide missing organic-02.png gradient URL');
    }

    // Check 3: CSS gradient fallback (should NOT be used for cover/closing)
    const hasCssGradient = htmlOutput.includes('linear-gradient');
    if (hasCssGradient && (planHasCoverSlide || planHasClosingSlide)) {
      validationErrors.push('CSS gradient detected on cover/closing slide - should use gradient image URLs instead');
    }

    if (validationErrors.length > 0) {
      console.error('⚠️ [DECK_GENERATE] Validation warnings:', validationErrors);
      // Log but don't fail - these are warnings that help us catch issues
    } else {
      console.log('✅ [DECK_GENERATE] Validation passed');
    }

    // ========================================================================
    // UPLOAD TO STORAGE
    // ========================================================================
    console.log('📤 [DECK_GENERATE] Uploading HTML to Storage...');

    // 🔍 DIAGNOSTIC 3: Check encoding before upload
    const beforeUploadDiagnostics = diagnoseEncoding(htmlOutput, 'before_storage_upload');
    logEncodingDiagnostics(beforeUploadDiagnostics);

    const fileName = `${deck_id}.html`;
    const { error: uploadError } = await supabase.storage
      .from('decks')
      .upload(fileName, htmlOutput, {
        contentType: 'text/html; charset=utf-8',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ [DECK_GENERATE] Storage upload failed:', uploadError);
      throw new Error(`Failed to upload HTML to storage: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('decks')
      .getPublicUrl(fileName);

    console.log('✅ [DECK_GENERATE] Uploaded to:', publicUrl);

    // ========================================================================
    // UPDATE DATABASE: Save HTML + URL + Status = 'completed'
    // ========================================================================
    const { error: updateError } = await supabase
      .from('j_hub_decks')
      .update({
        html_output: htmlOutput,
        file_url: publicUrl,
        generation_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', deck_id);

    if (updateError) {
      console.error('❌ [DECK_GENERATE] Failed to update deck:', updateError);
      throw new Error(`Failed to save HTML output: ${updateError.message}`);
    }

    // ========================================================================
    // LOG API CALL TO j_hub_deck_api_logs
    // ========================================================================
    const { error: logError } = await supabase
      .from('j_hub_deck_api_logs')
      .insert({
        deck_id: deck_id,
        stage: 'generation',
        prompt_sent: systemPrompt + '\n\n' + userPrompt,
        response_received: htmlOutput.substring(0, 1000) + '... [truncated]',
        tokens_used: {
          input: claudeData.usage?.input_tokens || 0,
          output: claudeData.usage?.output_tokens || 0,
          total: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)
        },
        latency_ms: latency,
        model_used: 'claude-sonnet-4-5-20250929',
        success: true
      });

    if (logError) {
      console.error('⚠️ [DECK_GENERATE] Failed to log API call:', logError);
      // Don't throw - logging is non-critical
    }

    console.log('🎉 [DECK_GENERATE] Deck generation complete!');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        deck_id: deck_id,
        file_url: publicUrl,
        html_length: htmlOutput.length,
        tokens_used: {
          input: claudeData.usage?.input_tokens || 0,
          output: claudeData.usage?.output_tokens || 0,
          total: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0)
        },
        latency_ms: latency,
        generation_status: 'completed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ [DECK_GENERATE] Error:', error);

    // Update status to 'failed' if we have deck_id
    if (deckId) {
      try {
        const env = validateEnvironment();
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        await supabase
          .from('j_hub_decks')
          .update({
            generation_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', deckId);

        // Log failed API call
        await supabase
          .from('j_hub_deck_api_logs')
          .insert({
            deck_id: deckId,
            stage: 'generation',
            success: false,
            error_message: error.message
          });
      } catch (logError) {
        console.error('Failed to update error status:', logError);
      }
    }

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
