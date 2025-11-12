import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { validateEnvironment } from '../_shared/env-validation.ts';
import { fetchWithRetry, fetchTextWithRetry } from '../_shared/fetch-with-retry.ts';
import { loadTemplateHTML, extractStyleBlock } from '../_shared/template-utils.ts';
import { formatPatternCatalogForPrompt, formatPlanForGenerationPrompt } from '../_shared/pattern-catalog.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let deckId: string | null = null;

  try {
    // UTF-8 decoder (shared across all text decoding operations)
    const decoder = new TextDecoder('utf-8');

    // Validate environment variables
    const env = validateEnvironment();

    // Extract authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body with explicit UTF-8 decoding
    const bodyBytes = await req.arrayBuffer();
    const bodyText = decoder.decode(bodyBytes);
    const body = JSON.parse(bodyText);

    const {
      title,
      markdown_source,
      type,
      brand_identity,
      template_id,
      account_id,
    } = body;

    // Enhanced input validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and cannot be empty');
    }

    if (!markdown_source || typeof markdown_source !== 'string' || markdown_source.trim().length < 10) {
      throw new Error('Markdown source must contain meaningful content (minimum 10 characters)');
    }

    if (markdown_source.length > 500000) {
      throw new Error('Markdown source too large (maximum 500KB)');
    }

    const validTypes = ['report', 'mediaplan', 'pitch'];
    if (!type || !validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    const validBrands = ['jumper', 'koko', 'tyaro', 'general'];
    if (!brand_identity || !validBrands.includes(brand_identity)) {
      throw new Error(`Invalid brand_identity: ${brand_identity}. Must be one of: ${validBrands.join(', ')}`);
    }

    if (!template_id || typeof template_id !== 'string' || template_id.trim().length === 0) {
      throw new Error('Template ID is required and cannot be empty');
    }

    console.log('🎨 [DECK_GENERATE] Starting deck generation:', {
      title,
      type,
      brand_identity,
      template_id,
      account_id: account_id || 'none'
    });

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // 1. Create deck record in database (status: processing)
    const { data: deck, error: createError } = await supabase
      .from('j_hub_decks')
      .insert({
        user_id: user.id,
        account_id: account_id || null,
        title,
        type,
        brand_identity,
        template_id,
        markdown_source,
        html_output: null,
        file_url: null,
        slug: null,
        is_public: false,
      })
      .select()
      .single();

    if (createError || !deck) {
      throw new Error(`Failed to create deck record: ${createError?.message}`);
    }

    deckId = deck.id;
    console.log('✅ [DECK_GENERATE] Deck record created:', deckId);

    // 2. Load template HTML from public/decks/examples/
    console.log('📄 [DECK_GENERATE] Loading template:', template_id);

    // Template files are served as static assets from Vercel (production) or Vite dev server (local)
    // Detect environment based on SUPABASE_URL
    const isLocal = env.SUPABASE_URL.includes('127.0.0.1') || env.SUPABASE_URL.includes('localhost');
    const baseUrl = isLocal
      ? 'http://localhost:8080'  // Vite dev server
      : 'https://hub.jumper.studio';  // Vercel production
    const templateUrl = `${baseUrl}/decks/templates/${template_id}.html`;

    console.log('🔗 [DECK_GENERATE] Template URL:', templateUrl, `(${isLocal ? 'LOCAL' : 'PRODUCTION'})`);

    let templateHtml: string;
    try {
      console.log('🔄 [DECK_GENERATE] Fetching template with retry logic (3 attempts, 30s timeout)...');
      templateHtml = await fetchTextWithRetry(templateUrl, {
        headers: {
          'Accept': 'text/html; charset=utf-8',
        },
        maxRetries: 3,
        timeoutMs: 30000,
      });

      console.log('✅ [DECK_GENERATE] Template loaded:', templateHtml.length, 'chars');
    } catch (templateError) {
      console.error('❌ [DECK_GENERATE] Template load failed after retries:', templateError);
      throw new Error(`Failed to load template ${template_id}: ${templateError.message}`);
    }

    // 3. Load design system from public/decks/identities/{brand}/design-system.md
    console.log('🎨 [DECK_GENERATE] Loading design system:', brand_identity);

    const designSystemUrl = `${baseUrl}/decks/identities/${brand_identity}/design-system.md`;
    console.log('🔗 [DECK_GENERATE] Design System URL:', designSystemUrl);

    let designSystem: string;
    try {
      console.log('🔄 [DECK_GENERATE] Fetching design system with retry logic (3 attempts, 30s timeout)...');
      designSystem = await fetchTextWithRetry(designSystemUrl, {
        headers: {
          'Accept': 'text/markdown; charset=utf-8',
        },
        maxRetries: 3,
        timeoutMs: 30000,
      });

      console.log('✅ [DECK_GENERATE] Design system loaded:', designSystem.length, 'chars');
    } catch (dsError) {
      console.error('❌ [DECK_GENERATE] Design system load failed after retries:', dsError);
      throw new Error(`Failed to load design system ${brand_identity}: ${dsError.message}`);
    }

    // 4. Get account context if account_id provided
    let accountContext = '';
    let accountName = '';

    if (account_id) {
      const { data: accountData } = await supabase
        .from('j_hub_notion_db_accounts')
        .select('Conta, Objetivos, "Contexto para Transcrição"')
        .eq('notion_id', account_id)
        .maybeSingle();

      if (accountData) {
        accountName = accountData.Conta || '';
        accountContext = accountData['Contexto para Transcrição'] || '';
        console.log('✅ [DECK_GENERATE] Account context loaded:', accountName);
      }
    }

    // ========================================================================
    // STAGE 1: CONTENT ANALYSIS (Call j_hub_deck_analyze)
    // ========================================================================
    console.log('📋 [DECK_GENERATE] Stage 1: Analyzing content and proposing slide patterns...');

    const analyzeResponse = await fetchWithRetry(
      `${env.SUPABASE_URL}/functions/v1/j_hub_deck_analyze`,
      {
        method: 'POST',
        headers: {
          'authorization': authHeader,
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          markdown_source: markdown_source,
          deck_type: type, // report/mediaplan/pitch
          template_id: template_id
        }),
        maxRetries: 3,
        timeoutMs: 45000, // 45s for analysis
      }
    );

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error('❌ [DECK_GENERATE] Content analysis failed:', errorText);
      throw new Error(`Content analysis failed (Stage 1): ${errorText}`);
    }

    const analyzeBytes = await analyzeResponse.arrayBuffer();
    const analyzeText = decoder.decode(analyzeBytes);
    const analyzeData = JSON.parse(analyzeText);

    if (!analyzeData.success || !analyzeData.plan) {
      throw new Error('Content analysis returned invalid response');
    }

    const { plan, pattern_metadata } = analyzeData;

    console.log('✅ [DECK_GENERATE] Stage 1 complete:', {
      total_slides: plan.total_slides,
      diversity_score: plan.pattern_diversity_score,
      tokens_used: analyzeData.tokens_used?.total || 0
    });

    // Log pattern distribution for debugging
    const patternCounts: Record<string, number> = {};
    plan.slides.forEach((slide: any) => {
      const pattern = slide.recommended_pattern;
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    });
    console.log('📊 [DECK_GENERATE] Pattern distribution:', patternCounts);

    // ========================================================================
    // STAGE 2: AUTO-APPROVE PLAN (future: add UI for review)
    // ========================================================================
    const approvedPlan = plan;
    console.log('✅ [DECK_GENERATE] Stage 2: Plan auto-approved (no user review for now)');

    // ========================================================================
    // STAGE 3: HTML GENERATION (Guided by approved plan + CSS-only template)
    // ========================================================================
    console.log('🎨 [DECK_GENERATE] Stage 3: Generating HTML following approved plan...');

    // Extract CSS from template (CSS-Only strategy for token efficiency)
    const fullTemplate = templateHtml; // Already loaded from lines 130-145
    const templateCSS = extractStyleBlock(fullTemplate);

    console.log('📄 [DECK_GENERATE] Template processed:', {
      template_id,
      full_size_kb: (fullTemplate.length / 1024).toFixed(1),
      css_only_kb: (templateCSS.length / 1024).toFixed(1),
      token_savings: `${(((fullTemplate.length - templateCSS.length) / fullTemplate.length) * 100).toFixed(0)}%`
    });

    // 5. Build Claude prompt for GUIDED HTML generation
    const systemPrompt = `You are a professional presentation designer creating beautiful HTML presentations that strictly follow brand identity guidelines.

⚠️ CRITICAL: You are generating HTML based on an APPROVED SLIDE PLAN.
You MUST follow the plan exactly - use the specified pattern for each slide.

Your task is to transform markdown content into a complete, production-ready HTML presentation following EXCLUSIVELY the design system provided for the selected brand identity.

CRITICAL INSTRUCTIONS:

0. ⚠️ MANDATORY: FOLLOW THE APPROVED PLAN STRICTLY
   - An expert content analyzer has created an optimal slide-by-slide plan for you
   - For each slide in the plan, use EXACTLY the recommended pattern
   - If slide says pattern "timeline", you MUST use Timeline pattern CSS (.timeline-container)
   - If slide says pattern "statement-slide-reverse", you MUST use Statement Reverse pattern
   - DO NOT improvise, DO NOT change patterns, DO NOT skip slides from the plan
   - Pattern fidelity is MANDATORY - the plan was carefully optimized for content matching

1. ⚠️ MANDATORY: READ AND APPLY THE COMPLETE DESIGN SYSTEM from identities/${brand_identity}/design-system.md
   - This is your ONLY source of truth for colors, fonts, spacing, and visual style
   - DO NOT use colors, fonts, or patterns from other identities
   - DO NOT mix design systems - use ONLY the ${brand_identity} identity guidelines

2. USE the CSS patterns from ${template_id}.html (CSS provided below)
   - Complete CSS is provided - use it exactly as-is
   - Copy pattern structures from CSS (class names, nesting)
   - DO NOT modify CSS rules or invent new classes
   - Adapt content to match the markdown source while maintaining pattern structure

3. GENERATE a complete, standalone HTML file with:
   - Complete <head> with <meta charset="UTF-8"> as FIRST tag (CRITICAL for UTF-8 encoding)
   - All CSS embedded (no external dependencies)
   - Font loading with ABSOLUTE URLs from design system
   - Image sources with ABSOLUTE URLs: https://hub.jumper.studio/decks/identities/${brand_identity}/...
   - Logo sources with ABSOLUTE URLs: https://hub.jumper.studio/decks/identities/${brand_identity}/logos/...
   - NEVER use relative paths (no /decks/..., always use full https:// URLs with domain)
   - All animations and interactions specified in design system
   - Responsive design (mobile-first)
   - Keyboard navigation (arrow keys, spacebar)

4. FOLLOW THE DESIGN SYSTEM STRICTLY:
   - Use ONLY colors defined in ${brand_identity} design system
   - Use ONLY fonts specified in ${brand_identity} design system
   - Use ONLY spacing/padding defined in ${brand_identity} design system
   - Use ONLY animation styles from ${brand_identity} design system
   - If ${brand_identity} === 'jumper': Use grays + orange (#FA4721), Haffer font, organic gradients
   - If ${brand_identity} === 'koko': Use black/white + yellow (#F2C541) + pink (#FF0080), AlternateGothic/Playfair, Koko Dust textures
   - If ${brand_identity} === 'general': Follow generic guidelines, use system fonts

5. DECK TYPE specific structure:
   ${type === 'report' ? '- Reports: Cover → Results → Insights → Recommendations (7-10 slides)' : ''}
   ${type === 'plan' ? '- Plans: Cover → Strategy → Timeline → Budget → KPIs (7-10 slides)' : ''}
   ${type === 'pitch' ? '- Pitches: Problem → Solution → Proof → Proposal → CTA (7-10 slides)' : ''}

6. ASSET PATHS (CRITICAL - URLs MUST BE ABSOLUTE):
   ⚠️ MANDATORY: ALL asset URLs MUST use full HTTPS URLs starting with https://hub.jumper.studio/

   CORRECT EXAMPLES (COPY THESE EXACTLY):
   ✅ src: url('https://hub.jumper.studio/decks/identities/${brand_identity}/fonts/HafferVF.ttf')
   ✅ background-image: url('https://hub.jumper.studio/decks/identities/${brand_identity}/gradients/organic-01.png')
   ✅ <img src="https://hub.jumper.studio/decks/identities/${brand_identity}/logos/jumper-white.png">

   WRONG EXAMPLES (NEVER USE THESE):
   ❌ url('/decks/...')  → WRONG - missing domain
   ❌ url('../fonts/...')  → WRONG - relative path
   ❌ url('fonts/...')  → WRONG - relative path

   WHY THIS MATTERS:
   - HTML is served from Supabase Storage domain (different from hub.jumper.studio)
   - Relative paths resolve to wrong domain → 404 errors
   - Fonts fail to load → fallback to system fonts (no Haffer)
   - Gradients fail to load → empty divs (no visual impact)
   - Logo fails to load → broken image

   VALIDATION: Search your output for url(' and src=" and verify ALL start with https://

7. QUALITY STANDARDS:
   - Every slide must be perfectly centered (flexbox + auto margins)
   - Typography sizes must NOT exceed maximums in design system
   - Use backgrounds/gradients as specified in design system (frequency and style)
   - All content must fit in safe zones defined in design system
   - Apply brand-specific animation styles (Jumper = smooth, Koko = aggressive, General = minimal)

7.1. TEXT FORMATTING FOR CARDS (CRITICAL for Koko Classic):
   - Card paragraph text MUST be concise (max 60 characters per paragraph)
   - Break long sentences into multiple short sentences or bullet points
   - Avoid complex compound sentences in card descriptions
   - Use line breaks (<br>) to separate ideas instead of long paragraphs
   - Example WRONG: "EH campaigns showed $7.47 CPA vs account avg of $0.87 by Week 3."
   - Example CORRECT: "EH campaigns: $7.47 CPA<br>Account avg: $0.87<br>Week 3 performance"
   - Prioritize readability: SHORT sentences, CLEAR structure, NO text overflow

7.2. AUTOMATIC CONTENT DENSITY ADAPTATION (CRITICAL - Prevent Overflow):

   ⚠️ MANDATORY: Analyze content density BEFORE generating each slide and apply appropriate adjustments.

   🎯 DENSITY DETECTION CRITERIA:

   A) COUNT these elements per slide:
      - Cards/boxes: Each counts as 2 points
      - Bullet points: Each counts as 1 point
      - Paragraphs: Each counts as 1 point
      - Table rows: Each counts as 1 point

   B) DENSITY LEVELS:
      - NORMAL (0-10 points): Use design system defaults
      - MEDIUM (11-16 points): Apply medium density adjustments
      - HIGH (17-24 points): Apply high density adjustments
      - ULTRA (25+ points): Apply ultra-dense adjustments OR split slide

   📐 AUTOMATIC ADJUSTMENTS BY DENSITY LEVEL:

   NORMAL DENSITY (0-10 points):
   ✅ Use design system defaults:
      - Body text: 16px | Card titles: 20px | Section titles: 72px
      - Card padding: 18px | Grid gap: 24px | Line height: 1.6

   MEDIUM DENSITY (11-16 points):
   ⚙️ Reduce sizes by ~15%:
      - Body text: 14px | Card titles: 18px | Section titles: 56px
      - Card padding: 14px | Grid gap: 16px | Line height: 1.5

   HIGH DENSITY (17-24 points):
   ⚙️ Reduce sizes by ~25%:
      - Body text: 13px | Card titles: 16px | Section titles: 48px
      - Card padding: 12px | Grid gap: 12px | Line height: 1.4

   ULTRA DENSITY (25+ points):
   🚨 FIRST TRY ultra-compact sizing:
      - Body text: 12px | Card titles: 14px | Section titles: 42px
      - Card padding: 10px | Grid gap: 10px | Line height: 1.3

   🚨 IF STILL OVERFLOWS: Split into multiple slides
      - Example: "RESULTS (PART 1)" + "RESULTS (PART 2)"
      - Each slide max 12 points density
      - Add navigation hints: "Continued →" or "← Previous"

   💡 CONTENT SUMMARIZATION STRATEGY:

   When markdown provides excessive detail (>20 bullet points per topic):
   1. Identify KEY insights (top 6-8 items)
   2. Group similar items: "Campaigns 1-4 showed similar CPA ($0.40-0.45)"
   3. Move detailed breakdowns to separate "Details" or "Appendix" slides
   4. Preserve ALL data but reorganize for didactic flow

   🔍 OVERFLOW VALIDATION (Before finalizing each slide):

   Mental checklist:
   [ ] Estimated content height < 70vh? (safe zone = 800px max)
   [ ] Content doesn't overlap top marquee? (112px from top clear)
   [ ] Content doesn't overlap bottom marquee? (144px from bottom clear)
   [ ] Text readable at chosen font size? (min 12px)
   [ ] Cards have breathing room? (min 10px padding)

   IF ANY CHECK FAILS → Apply next density level OR split slide

   🎯 PRIORITY ORDER (Decision Tree):
   1. TRY: Apply appropriate density level (MEDIUM/HIGH/ULTRA)
   2. IF STILL OVERFLOWS: Summarize content (group similar items)
   3. IF STILL OVERFLOWS: Split into multiple slides
   4. NEVER: Let content overflow viewport or overlap marquees

8. UTF-8 ENCODING (CRITICAL):
   - ALWAYS preserve Brazilian Portuguese characters: á é í ó ú ã õ ç
   - Ensure <meta charset="UTF-8"> is FIRST tag in <head>
   - DO NOT escape or break UTF-8 characters
   - Test: "Relatório" should render correctly, NOT "RelatÃ³rio"

9. OUTPUT:
   - Return ONLY the complete HTML (no markdown fences, no explanations)
   - HTML must be production-ready (can be opened directly in browser)
   - Include closing slide with clear CTA and next steps

10. ⚠️⚠️⚠️ DATA FIDELITY (CRITICAL - ZERO TOLERANCE FOR HALLUCINATION) ⚠️⚠️⚠️:

   🚨 MANDATORY RULES - VIOLATION IS UNACCEPTABLE:

   ✅ WHAT YOU CAN DO:
   - Reorganize data for better didactic flow (e.g., most important metrics first)
   - Format numbers with commas, currency symbols, percentages (R$ 1.234,56, 45.2%, etc.)
   - Group related data into visual blocks or cards
   - Create charts/graphs from numerical data provided in markdown
   - Translate technical terms if context is clear
   - Simplify wording while preserving meaning (e.g., "Custo por Lead" → "Investimento por Lead")

   ❌ WHAT YOU CANNOT DO (NEVER):
   - Invent numbers that don't exist in markdown (e.g., if markdown says "Brasil: 120 conversões", don't add "Argentina: 80 conversões")
   - Change country names or add countries not mentioned (e.g., markdown says "Brasil, Chile" → don't add "México")
   - Fabricate metrics not provided (e.g., if markdown has CPA but no ROAS, don't calculate/invent ROAS)
   - Alter numerical values (e.g., markdown says "42% CTR" → don't round to "40%" or "45%")
   - Add campaign names, product names, or any proper nouns not in markdown
   - Create trends or comparisons not explicitly stated (e.g., don't say "crescimento de 20%" if markdown doesn't mention growth)
   - Invent dates, periods, or timeframes (e.g., if markdown says "Outubro 2024", don't add "vs Setembro 2024")

   ⚠️ EXAMPLES OF VIOLATIONS (NEVER DO THIS):

   BAD EXAMPLE 1 - Inventing countries:
   Markdown: "Tráfego por país: Brasil (450 cliques), Chile (280 cliques)"
   WRONG OUTPUT: Adding "Argentina (320 cliques)" because it "makes sense geographically"
   CORRECT OUTPUT: Show ONLY Brasil and Chile as provided

   BAD EXAMPLE 2 - Fabricating metrics:
   Markdown: "CPA: R$ 87,50 | Conversões: 342"
   WRONG OUTPUT: Calculating "ROAS: 4.2x" or "ROI: 320%" not mentioned in markdown
   CORRECT OUTPUT: Show ONLY CPA and Conversões as provided

   BAD EXAMPLE 3 - Inventing comparisons:
   Markdown: "Outubro: 1.234 leads"
   WRONG OUTPUT: Adding "Setembro: 987 leads (↑25% crescimento)"
   CORRECT OUTPUT: Show ONLY Outubro data as provided

   BAD EXAMPLE 4 - Altering numbers:
   Markdown: "CTR: 2.34%"
   WRONG OUTPUT: Rounding to "2.3%" or "2%" for "cleaner visuals"
   CORRECT OUTPUT: Keep exact value "2.34%"

   🔍 VALIDATION CHECKLIST (Mental check before outputting):
   [ ] Every country/location name appears in markdown?
   [ ] Every metric value matches markdown exactly?
   [ ] Every campaign/product name exists in markdown?
   [ ] Every date/period is from markdown?
   [ ] No calculations performed on data not explicitly requested?
   [ ] No trends/comparisons added beyond what markdown states?

   💡 WHEN IN DOUBT:
   If you're unsure if a data point is in the markdown → DON'T INCLUDE IT
   Better to have fewer slides with accurate data than more slides with fabricated data

   🎯 WHY THIS MATTERS:
   These decks are presented to REAL CLIENTS making BUSINESS DECISIONS based on this data.
   Fabricated data destroys trust, can lead to wrong decisions, and damages professional reputation.
   There is ZERO tolerance for data hallucination in this system.

OUTPUT LANGUAGE: HTML with Brazilian Portuguese content (UTF-8 encoded)`;

    const userPrompt = `==============================================
DECK CONFIGURATION
==============================================
Title: ${title}
Type: ${type}
Brand Identity: ${brand_identity}
Template: ${template_id}
${accountName ? `Account: ${accountName}` : ''}

==============================================
APPROVED SLIDE PLAN (FOLLOW EXACTLY)
==============================================
${formatPlanForGenerationPrompt(approvedPlan)}

==============================================
CSS PATTERNS (USE THESE EXACT STYLES)
==============================================
<style>
${templateCSS}
</style>

==============================================
BRAND COLORS (FROM DESIGN SYSTEM)
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
${markdown_source}

==============================================
TASK
==============================================
Generate COMPLETE HTML presentation following the approved plan above.

For each slide in the plan:
1. Use the recommended pattern (e.g., timeline → .timeline-container CSS)
2. Replace template content with data from markdown source
3. Maintain all CSS structure and classes from patterns above
4. Use brand colors/fonts from design system

OUTPUT FORMAT: Complete standalone HTML file (no markdown fences, no explanations)`;

    console.log('🤖 [DECK_GENERATE] Calling Claude Sonnet 4.5 for HTML generation...');
    console.log('📏 [DECK_GENERATE] Markdown length:', markdown_source.length, 'chars');

    // 6. Call Claude API to generate HTML (with retry logic)
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
        max_tokens: 16000, // Large enough for complete HTML presentations
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
      maxRetries: 3,
      timeoutMs: 120000, // 2 minutes for HTML generation
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

    // Force UTF-8 decoding of Claude response
    console.log('📦 [DECK_GENERATE] Parsing Claude response...');
    const claudeBytes = await claudeResponse.arrayBuffer();
    const claudeText = decoder.decode(claudeBytes);
    const claudeData = JSON.parse(claudeText);

    const latency = Date.now() - startTime;
    console.log('⏱️ [DECK_GENERATE] Claude API latency:', {
      latency_ms: latency,
      latency_seconds: (latency / 1000).toFixed(1),
      input_tokens: claudeData.usage?.input_tokens || 0,
      output_tokens: claudeData.usage?.output_tokens || 0
    });

    // Validate Claude API response structure
    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('❌ [DECK_GENERATE] Invalid Claude response structure:', claudeData);
      throw new Error('Invalid Claude API response: missing content array');
    }

    if (!claudeData.content[0] || !claudeData.content[0].text) {
      console.error('❌ [DECK_GENERATE] Invalid Claude response structure:', claudeData.content[0]);
      throw new Error('Invalid Claude API response: missing text in content[0]');
    }

    let htmlOutput = claudeData.content[0].text.trim();

    // Sanity check: HTML should not be empty or suspiciously short
    if (htmlOutput.length < 100) {
      console.error('❌ [DECK_GENERATE] Claude returned suspiciously short HTML:', htmlOutput.length, 'chars');
      throw new Error('Claude returned suspiciously short HTML output (less than 100 characters)');
    }
    const latency = Date.now() - startTime;

    // Clean up markdown fences if Claude included them (shouldn't, but safe fallback)
    htmlOutput = htmlOutput.replace(/^```html\n/, '').replace(/\n```$/, '').trim();

    console.log('✅ [DECK_GENERATE] HTML generated');
    console.log('📏 [DECK_GENERATE] HTML length:', htmlOutput.length, 'chars');
    console.log('⏱️ [DECK_GENERATE] Latency:', latency, 'ms');
    console.log('🎫 [DECK_GENERATE] Tokens used:', (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0));

    // Validate: Check for relative paths in generated HTML
    console.log('🔍 [DECK_GENERATE] Validating asset paths...');

    const relativePathPatterns = [
      /url\(['"]\/decks\//gi,           // url('/decks/...)
      /url\(['"]\.\.?\//gi,              // url('../...) or url('./...)
      /src=['"]\/decks\//gi,             // src="/decks/..."
      /src=['"]\.\.?\//gi,               // src="../..." or src=".../..."
    ];

    let hasRelativePaths = false;
    const relativePathExamples: string[] = [];

    relativePathPatterns.forEach(pattern => {
      const matches = htmlOutput.match(pattern);
      if (matches) {
        hasRelativePaths = true;
        relativePathExamples.push(...matches.slice(0, 3)); // First 3 examples
      }
    });

    if (hasRelativePaths) {
      console.error('❌ [DECK_GENERATE] VALIDATION FAILED: Relative paths detected:', relativePathExamples);
      throw new Error(`Generated HTML contains relative paths (must be absolute HTTPS URLs). Examples: ${relativePathExamples.join(', ')}`);
    }

    console.log('✅ [DECK_GENERATE] Validation passed: All paths are absolute');

    // 7. Upload HTML to Supabase Storage (decks/{user_id}/{deck_id}.html)
    const fileName = `${user.id}/${deckId}.html`;

    // Explicitly encode as UTF-8 to prevent mojibake
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(htmlOutput);
    const htmlBlob = new Blob([htmlBytes], { type: 'text/html; charset=utf-8' });

    console.log('📤 [DECK_GENERATE] Uploading to storage:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('decks')
      .upload(fileName, htmlBlob, {
        contentType: 'text/html; charset=utf-8',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [DECK_GENERATE] Upload failed:', uploadError);
      throw new Error(`Failed to upload HTML to storage: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('decks')
      .getPublicUrl(fileName);

    console.log('✅ [DECK_GENERATE] Uploaded to:', publicUrl);

    // 8. Update deck record with HTML output, file URL, and generation plan
    const { error: updateError } = await supabase
      .from('j_hub_decks')
      .update({
        html_output: htmlOutput,      // Cache in database for quick preview
        file_url: publicUrl,           // Storage URL for serving to clients
        generation_plan: approvedPlan, // Save plan for debugging and analytics
      })
      .eq('id', deckId);

    console.log('💾 [DECK_GENERATE] Generation plan saved to database:', {
      total_slides: approvedPlan.total_slides,
      diversity_score: approvedPlan.pattern_diversity_score
    });

    if (updateError) {
      console.error('❌ [DECK_GENERATE] Update failed:', updateError);
      throw new Error(`Failed to update deck record: ${updateError.message}`);
    }

    // 8.5. Create v1 in deck_versions table (auto-versioning)
    console.log('📌 [DECK_GENERATE] Creating version 1...');

    const { error: versionError } = await supabase
      .from('j_hub_deck_versions')
      .insert({
        deck_id: deckId,
        version_number: 1,
        html_output: htmlOutput,
        refinement_prompt: null, // v1 is original generation (no refinement)
        changes_summary: 'Initial generation from markdown source',
        version_type: 'original', // v1 is always original
      });

    if (versionError) {
      console.error('⚠️ [DECK_GENERATE] Version creation failed:', versionError);
      // Non-fatal error - deck still works without versioning
      // But log for debugging
    } else {
      console.log('✅ [DECK_GENERATE] Version 1 created successfully');

      // Update deck to set current_version = 1
      const { error: currentVersionError } = await supabase
        .from('j_hub_decks')
        .update({ current_version: 1 })
        .eq('id', deckId);

      if (currentVersionError) {
        console.error('⚠️ [DECK_GENERATE] Current version update failed:', currentVersionError);
      }
    }

    // 9. Count slides (rough estimate by counting <div class="slide">)
    const slideCount = (htmlOutput.match(/<div[^>]*class="[^"]*slide[^"]*"/g) || []).length;

    console.log('✅ [DECK_GENERATE] Deck generation completed successfully');

    // Calculate total tokens (Stage 1 + Stage 3)
    const stage1Tokens = analyzeData.tokens_used?.total || 0;
    const stage3Tokens = (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0);
    const totalTokens = stage1Tokens + stage3Tokens;

    return new Response(
      JSON.stringify({
        success: true,
        deck_id: deckId,
        html_url: publicUrl,
        slide_count: slideCount,
        tokens_used: totalTokens,
        tokens_breakdown: {
          stage1_analysis: stage1Tokens,
          stage3_generation: stage3Tokens,
          total: totalTokens
        },
        pattern_diversity_score: approvedPlan.pattern_diversity_score,
        patterns_used: Object.keys(patternCounts).length,
        latency_ms: latency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ [DECK_GENERATE] Error:', error);

    // Try to mark deck as failed if we have deckId
    if (deckId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('j_hub_decks')
          .update({
            html_output: null,
            file_url: `ERROR: ${error.message}`,
          })
          .eq('id', deckId);
      } catch (updateError) {
        console.error('❌ [DECK_GENERATE] Failed to update error status:', updateError);
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
