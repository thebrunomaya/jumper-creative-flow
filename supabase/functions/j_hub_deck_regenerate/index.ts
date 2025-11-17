import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { validateEnvironment } from '../_shared/env-validation.ts';
import { fetchTextWithRetry } from '../_shared/fetch-with-retry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // UTF-8 decoder
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
      deck_id,
      markdown_source,
    } = body;

    // Enhanced input validation
    if (!deck_id || typeof deck_id !== 'string' || deck_id.trim().length === 0) {
      throw new Error('Deck ID is required and cannot be empty');
    }

    if (!markdown_source || typeof markdown_source !== 'string' || markdown_source.trim().length < 10) {
      throw new Error('Markdown source must contain meaningful content (minimum 10 characters)');
    }

    if (markdown_source.length > 500000) {
      throw new Error('Markdown source too large (maximum 500KB)');
    }

    console.log('🔄 [DECK_REGENERATE] Starting deck regeneration:', {
      deck_id,
      markdown_length: markdown_source.length,
    });

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // 1. Fetch current deck data
    console.log('📄 [DECK_REGENERATE] Fetching current deck...');

    const { data: deckData, error: deckError } = await supabase
      .from('j_hub_decks')
      .select('*')
      .eq('id', deck_id)
      .single();

    if (deckError || !deckData) {
      throw new Error(`Deck not found: ${deckError?.message}`);
    }

    // Check permissions (user must own deck or be admin/staff)
    const { data: userData } = await supabase
      .from('j_hub_users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role || 'client';
    const canEdit = userRole === 'admin' || userRole === 'staff' || deckData.user_id === user.id;

    if (!canEdit) {
      throw new Error('You do not have permission to edit this deck');
    }

    console.log('✅ [DECK_REGENERATE] Permission granted:', userRole);

    // 2. Get next version number atomically (prevents race conditions)
    console.log('📊 [DECK_REGENERATE] Getting next version number with locking...');
    const { data: newVersionNumber, error: versionError } = await supabase
      .rpc('get_next_version_number', { p_deck_id: deck_id });

    if (versionError || !newVersionNumber) {
      console.error('❌ [DECK_REGENERATE] Failed to get version number:', versionError);
      throw new Error(`Failed to get version number: ${versionError?.message}`);
    }

    console.log('📊 [DECK_REGENERATE] New version number:', newVersionNumber);

    // 3. Use deck's existing configuration (type, brand_identity, template_id, account_id)
    const { type, brand_identity, template_id, account_id, title } = deckData;

    // Map template IDs to v2 versions with external CSS (token optimization)
    const templateIdWithExternalCSS = template_id === 'koko-classic'
      ? 'koko-classic-v2'
      : template_id;

    console.log('🎨 [DECK_REGENERATE] Regenerating with configuration:', {
      type,
      brand_identity,
      template_id: templateIdWithExternalCSS,
      account_id: account_id || 'none'
    });

    // 4. Load template HTML from public/decks/templates/
    console.log('📄 [DECK_REGENERATE] Loading template:', templateIdWithExternalCSS);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const isLocal = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');
    const baseUrl = isLocal ? 'http://localhost:8080' : 'https://hub.jumper.studio';
    const templateUrl = `${baseUrl}/decks/templates/${templateIdWithExternalCSS}.html`;

    console.log('🔗 [DECK_REGENERATE] Template URL:', templateUrl, `(${isLocal ? 'LOCAL' : 'PRODUCTION'})`);

    let templateHtml: string;
    try {
      console.log('🔄 [DECK_REGENERATE] Fetching template with retry logic (3 attempts, 30s timeout)...');
      templateHtml = await fetchTextWithRetry(templateUrl, {
        headers: { 'Accept': 'text/html; charset=utf-8' },
        maxRetries: 3,
        timeoutMs: 30000,
      });

      console.log('✅ [DECK_REGENERATE] Template loaded:', templateHtml.length, 'chars');
    } catch (templateError) {
      console.error('❌ [DECK_REGENERATE] Template load failed after retries:', templateError);
      throw new Error(`Failed to load template ${templateIdWithExternalCSS}: ${templateError.message}`);
    }

    console.log('✅ [DECK_REGENERATE] Template loaded:', {
      size_kb: (templateHtml.length / 1024).toFixed(1),
      uses_external_css: templateIdWithExternalCSS.includes('-v2')
    });

    // 5. Get account context if account_id provided
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
        console.log('✅ [DECK_REGENERATE] Account context loaded:', accountName);
      }
    }

    // 6. Build Claude prompt for deck generation
    const systemPrompt = `You are a professional presentation designer creating beautiful HTML presentations that strictly follow brand identity guidelines.

Your task is to transform markdown content into a complete, production-ready HTML presentation using the provided template structure.

CRITICAL INSTRUCTIONS:

1. ⚠️ MANDATORY: EXTERNAL CSS STYLESHEET
   - Template uses external CSS at: https://hub.jumper.studio/decks/templates/${templateIdWithExternalCSS}.css
   - This CSS contains ALL styles: colors, fonts, spacing, patterns, animations
   - Your HTML must include the <link> tag in <head>
   - Do NOT embed <style> tags or inline styles
   - Use CSS class names from the template structure

2. USE the template structure from ${templateIdWithExternalCSS}.html as your guide:
   - Copy slide patterns and component structures
   - Adapt content to match the markdown source
   - Use the exact CSS class names shown in template
   - Maintain responsive behavior

3. GENERATE a complete, standalone HTML file with:
   - Complete <head> with <meta charset="UTF-8"> as FIRST tag (CRITICAL for UTF-8 encoding)
   - External CSS link: <link rel="stylesheet" href="https://hub.jumper.studio/decks/templates/${templateIdWithExternalCSS}.css">
   - Font loading handled by external CSS (do not include font tags)
   - Image sources with ABSOLUTE URLs: https://hub.jumper.studio/decks/identities/${brand_identity}/...
   - Logo sources with ABSOLUTE URLs: https://hub.jumper.studio/decks/identities/${brand_identity}/logos/...
   - NEVER use relative paths (no /decks/..., always use full https:// URLs with domain)
   - Responsive design (mobile-first)
   - Keyboard navigation (arrow keys, spacebar)

4. BRAND IDENTITY GUIDELINES:
   - If ${brand_identity} === 'jumper': Use grays + orange (#FA4721), Haffer font, organic gradients
   - If ${brand_identity} === 'koko': Use black/white + yellow (#F2C541) + pink (#FF0080), AlternateGothic/Playfair, Koko Dust textures
   - If ${brand_identity} === 'general': Follow generic guidelines, use system fonts
   - Colors and fonts are defined in external CSS - use class names, not inline styles

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
Template: ${templateIdWithExternalCSS}
${accountName ? `Account: ${accountName}` : ''}

==============================================
EXTERNAL CSS STYLESHEET
==============================================
All styles are loaded from external CSS file:
<link rel="stylesheet" href="https://hub.jumper.studio/decks/templates/${templateIdWithExternalCSS}.css">

This CSS file contains:
- Complete design system (colors, fonts, spacing)
- All slide patterns (hero, content, charts, timeline, etc)
- All components (cards, metrics, emphasis boxes)
- Responsive breakpoints and animations

Do NOT embed CSS or use inline styles. Use class names from template.

==============================================
TEMPLATE STRUCTURE (HTML ONLY - CSS IS EXTERNAL)
==============================================
${templateHtml.substring(0, 15000)}
[Template truncated to 15KB - shows all HTML patterns. CSS is external, not included here]

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
Generate a complete, production-ready HTML presentation using the template structure and external CSS.

CRITICAL: Include <link> tag for external CSS in <head>:
<link rel="stylesheet" href="https://hub.jumper.studio/decks/templates/${templateIdWithExternalCSS}.css">

Key points:
- Copy HTML structure from template
- Use CSS class names exactly as shown
- Do NOT embed <style> tags (CSS is external)
- Do NOT use inline styles (use classes instead)
- Replace template content with data from markdown
- Maintain semantic HTML structure

OUTPUT FORMAT: Complete standalone HTML file (no markdown fences, no explanations)`;

    console.log('🤖 [DECK_REGENERATE] Calling Claude Sonnet 4.5 for HTML generation...');
    console.log('📏 [DECK_REGENERATE] Markdown length:', markdown_source.length, 'chars');

    // 8. Call Claude API to generate HTML
    const startTime = Date.now();
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ [DECK_REGENERATE] Claude API error:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeBytes = await claudeResponse.arrayBuffer();
    const claudeText = decoder.decode(claudeBytes);
    const claudeData = JSON.parse(claudeText);

    // Validate Claude API response structure
    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('❌ [DECK_REGENERATE] Invalid Claude response structure:', claudeData);
      throw new Error('Invalid Claude API response: missing content array');
    }

    if (!claudeData.content[0] || !claudeData.content[0].text) {
      console.error('❌ [DECK_REGENERATE] Invalid Claude response structure:', claudeData.content[0]);
      throw new Error('Invalid Claude API response: missing text in content[0]');
    }

    let htmlOutput = claudeData.content[0].text.trim();

    // Sanity check: HTML should not be empty or suspiciously short
    if (htmlOutput.length < 100) {
      console.error('❌ [DECK_REGENERATE] Claude returned suspiciously short HTML:', htmlOutput.length, 'chars');
      throw new Error('Claude returned suspiciously short HTML output (less than 100 characters)');
    }
    const latency = Date.now() - startTime;

    // Clean up markdown fences if Claude included them
    htmlOutput = htmlOutput.replace(/^```html\n/, '').replace(/\n```$/, '').trim();

    console.log('✅ [DECK_REGENERATE] HTML generated');
    console.log('📏 [DECK_REGENERATE] HTML length:', htmlOutput.length, 'chars');
    console.log('⏱️ [DECK_REGENERATE] Latency:', latency, 'ms');
    console.log('🎫 [DECK_REGENERATE] Tokens used:', (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0));

    // 9. Validate: Check for relative paths in generated HTML
    console.log('🔍 [DECK_REGENERATE] Validating asset paths...');

    const relativePathPatterns = [
      /url\(['"]\/decks\//gi,
      /url\(['"]\.\.?\//gi,
      /src=['"]\/decks\//gi,
      /src=['"]\.\.?\//gi,
    ];

    let hasRelativePaths = false;
    const relativePathExamples: string[] = [];

    relativePathPatterns.forEach(pattern => {
      const matches = htmlOutput.match(pattern);
      if (matches) {
        hasRelativePaths = true;
        relativePathExamples.push(...matches.slice(0, 3));
      }
    });

    if (hasRelativePaths) {
      console.error('❌ [DECK_REGENERATE] VALIDATION FAILED: Relative paths detected:', relativePathExamples);
      throw new Error(`Generated HTML contains relative paths (must be absolute HTTPS URLs). Examples: ${relativePathExamples.join(', ')}`);
    }

    console.log('✅ [DECK_REGENERATE] Validation passed: All paths are absolute');

    // 10. Upload HTML to Supabase Storage
    // ⚠️ CRITICAL FIX: Use .upload() with string instead of .update() with Blob
    // Blob + .update() causes Storage to serve with Content-Type: text/plain → mojibakes
    // String + .upload() correctly sets Content-Type: text/html; charset=utf-8
    const fileName = `${deck_id}.html`;

    console.log('📤 [DECK_REGENERATE] Uploading to storage:', fileName);

    const { error: uploadError } = await supabase.storage
      .from('decks')
      .upload(fileName, htmlOutput, {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ [DECK_REGENERATE] Upload failed:', uploadError);
      throw new Error(`Failed to upload HTML to storage: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('decks')
      .getPublicUrl(fileName);

    console.log('✅ [DECK_REGENERATE] Uploaded to:', publicUrl);

    // 11. Create new version in deck_versions table
    console.log('📌 [DECK_REGENERATE] Creating version', newVersionNumber, '...');

    const { error: versionError } = await supabase
      .from('j_hub_deck_versions')
      .insert({
        deck_id: deck_id,
        version_number: newVersionNumber,
        html_output: htmlOutput,
        refinement_prompt: null, // Regeneration doesn't use refinement prompt
        changes_summary: 'Deck regenerated from updated markdown source',
        version_type: 'regenerated', // Regeneration creates 'regenerated' versions
      });

    if (versionError) {
      console.error('❌ [DECK_REGENERATE] Version creation failed:', versionError);
      throw new Error(`Failed to create version: ${versionError.message}`);
    }

    console.log('✅ [DECK_REGENERATE] Version', newVersionNumber, 'created');

    // 12. Update deck record with regenerated HTML and new current_version
    const { error: updateError } = await supabase
      .from('j_hub_decks')
      .update({
        markdown_source: markdown_source, // Update with new markdown
        html_output: htmlOutput,
        file_url: publicUrl,
        current_version: newVersionNumber,
        is_refined: true, // Mark as refined (has versions > 1)
        updated_at: new Date().toISOString(),
      })
      .eq('id', deck_id);

    if (updateError) {
      console.error('❌ [DECK_REGENERATE] Deck update failed:', updateError);
      throw new Error(`Failed to update deck: ${updateError.message}`);
    }

    // 13. Count slides
    const slideCount = (htmlOutput.match(/<div[^>]*class="[^"]*slide[^"]*"/g) || []).length;

    console.log('✅ [DECK_REGENERATE] Deck regeneration completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        deck_id: deck_id,
        new_version: newVersionNumber,
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
    console.error('❌ [DECK_REGENERATE] Error:', error);

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
