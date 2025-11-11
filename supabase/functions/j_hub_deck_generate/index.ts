import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`Fetch timeout after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let deckId: string | null = null;

  try {
    // UTF-8 decoder (shared across all text decoding operations)
    const decoder = new TextDecoder('utf-8');

    // Extract authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Validate required fields
    if (!title || !markdown_source || !type || !brand_identity || !template_id) {
      throw new Error('Missing required fields: title, markdown_source, type, brand_identity, template_id');
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
    const isLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');
    const baseUrl = isLocal
      ? 'http://localhost:8080'  // Vite dev server
      : 'https://hub.jumper.studio';  // Vercel production
    const templateUrl = `${baseUrl}/decks/templates/${template_id}.html`;

    console.log('🔗 [DECK_GENERATE] Template URL:', templateUrl, `(${isLocal ? 'LOCAL' : 'PRODUCTION'})`);

    let templateHtml: string;
    try {
      console.log('🔄 [DECK_GENERATE] Fetching template with 30s timeout...');
      const templateResponse = await fetchWithTimeout(templateUrl, {
        headers: {
          'Accept': 'text/html; charset=utf-8',
        },
      }, 30000);

      console.log('📡 [DECK_GENERATE] Template response status:', templateResponse.status);

      if (!templateResponse.ok) {
        throw new Error(`Template HTTP ${templateResponse.status}: ${template_id}`);
      }

      // Force UTF-8 decoding with TextDecoder
      const templateBytes = await templateResponse.arrayBuffer();
      templateHtml = decoder.decode(templateBytes);

      console.log('✅ [DECK_GENERATE] Template loaded:', templateHtml.length, 'chars');
    } catch (templateError) {
      console.error('❌ [DECK_GENERATE] Template load failed:', templateError);
      throw new Error(`Failed to load template ${template_id}: ${templateError.message}`);
    }

    // 3. Load design system from public/decks/identities/{brand}/design-system.md
    console.log('🎨 [DECK_GENERATE] Loading design system:', brand_identity);

    const designSystemUrl = `${baseUrl}/decks/identities/${brand_identity}/design-system.md`;
    console.log('🔗 [DECK_GENERATE] Design System URL:', designSystemUrl);

    let designSystem: string;
    try {
      console.log('🔄 [DECK_GENERATE] Fetching design system with 30s timeout...');
      const dsResponse = await fetchWithTimeout(designSystemUrl, {
        headers: {
          'Accept': 'text/markdown; charset=utf-8',
        },
      }, 30000);

      console.log('📡 [DECK_GENERATE] Design system response status:', dsResponse.status);

      if (!dsResponse.ok) {
        throw new Error(`Design system HTTP ${dsResponse.status}: ${brand_identity}`);
      }

      // Force UTF-8 decoding with TextDecoder
      const dsBytes = await dsResponse.arrayBuffer();
      designSystem = decoder.decode(dsBytes);

      console.log('✅ [DECK_GENERATE] Design system loaded:', designSystem.length, 'chars');
    } catch (dsError) {
      console.error('❌ [DECK_GENERATE] Design system load failed:', dsError);
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

    // 5. Build Claude prompt for deck generation
    const systemPrompt = `You are a professional presentation designer creating beautiful HTML presentations that strictly follow brand identity guidelines.

Your task is to transform markdown content into a complete, production-ready HTML presentation following EXCLUSIVELY the design system provided for the selected brand identity.

CRITICAL INSTRUCTIONS:

1. ⚠️ MANDATORY: READ AND APPLY THE COMPLETE DESIGN SYSTEM from identities/${brand_identity}/design-system.md
   - This is your ONLY source of truth for colors, fonts, spacing, and visual style
   - DO NOT use colors, fonts, or patterns from other identities
   - DO NOT mix design systems - use ONLY the ${brand_identity} identity guidelines

2. USE the template structure from ${template_id}.html as inspiration for layout patterns
   - Copy slide patterns and component structures
   - Adapt content to match the markdown source
   - Maintain responsive behavior and animations from template

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
Template Inspiration: ${template_id}
${accountName ? `Account: ${accountName}` : ''}

==============================================
DESIGN SYSTEM (SOURCE OF TRUTH)
==============================================
${designSystem}

==============================================
TEMPLATE STRUCTURE (INSPIRATION ONLY)
==============================================
${templateHtml.substring(0, 10000)}
[Template truncated for prompt efficiency - use full template structure patterns]

${accountContext ? `
==============================================
ACCOUNT CONTEXT
==============================================
${accountContext}
` : ''}

==============================================
CONTENT TO TRANSFORM INTO PRESENTATION
==============================================
${markdown_source}

==============================================
TASK
==============================================
Generate a complete, production-ready HTML presentation following ALL design system rules and template patterns.

OUTPUT FORMAT: Complete standalone HTML file (no markdown fences, no explanations)`;

    console.log('🤖 [DECK_GENERATE] Calling Claude Sonnet 4.5 for HTML generation...');
    console.log('📏 [DECK_GENERATE] Markdown length:', markdown_source.length, 'chars');

    // 6. Call Claude API to generate HTML
    const startTime = Date.now();
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
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
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ [DECK_GENERATE] Claude API error:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    // Force UTF-8 decoding of Claude response
    const claudeBytes = await claudeResponse.arrayBuffer();
    const claudeText = decoder.decode(claudeBytes);
    const claudeData = JSON.parse(claudeText);

    let htmlOutput = claudeData.content[0].text;
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

    // 8. Update deck record with HTML output and file URL
    const { error: updateError } = await supabase
      .from('j_hub_decks')
      .update({
        html_output: htmlOutput, // Cache in database for quick preview
        file_url: publicUrl,     // Storage URL for serving to clients
      })
      .eq('id', deckId);

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

    return new Response(
      JSON.stringify({
        success: true,
        deck_id: deckId,
        html_url: publicUrl,
        slide_count: slideCount,
        tokens_used: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0),
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
