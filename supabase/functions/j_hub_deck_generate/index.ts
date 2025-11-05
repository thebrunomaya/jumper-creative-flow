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

  let deckId: string | null = null;

  try {
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
    const decoder = new TextDecoder('utf-8');
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

    // Template files are served as static assets, we need to fetch them
    const templateUrl = `${supabaseUrl.replace('/rest/v1', '')}/storage/v1/object/public/decks/examples/${template_id}.html`;

    let templateHtml: string;
    try {
      const templateResponse = await fetch(templateUrl, {
        headers: {
          'Accept': 'text/html; charset=utf-8',
        },
      });
      if (!templateResponse.ok) {
        // Fallback: Try loading from local file path if in dev
        throw new Error(`Template not found in storage: ${template_id}`);
      }

      // Force UTF-8 decoding with TextDecoder
      const templateBytes = await templateResponse.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      templateHtml = decoder.decode(templateBytes);

      console.log('✅ [DECK_GENERATE] Template loaded:', templateHtml.length, 'chars');
    } catch (templateError) {
      console.error('❌ [DECK_GENERATE] Template load failed:', templateError);
      throw new Error(`Failed to load template ${template_id}: ${templateError.message}`);
    }

    // 3. Load design system from public/decks/identities/{brand}/design-system.md
    console.log('🎨 [DECK_GENERATE] Loading design system:', brand_identity);

    const designSystemUrl = `${supabaseUrl.replace('/rest/v1', '')}/storage/v1/object/public/decks/identities/${brand_identity}/design-system.md`;

    let designSystem: string;
    try {
      const dsResponse = await fetch(designSystemUrl, {
        headers: {
          'Accept': 'text/markdown; charset=utf-8',
        },
      });
      if (!dsResponse.ok) {
        throw new Error(`Design system not found in storage: ${brand_identity}`);
      }

      // Force UTF-8 decoding with TextDecoder
      const dsBytes = await dsResponse.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
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
    const systemPrompt = `You are a professional presentation designer creating beautiful, Apple-inspired HTML presentations for Jumper Studio clients.

Your task is to transform markdown content into a complete, production-ready HTML presentation following the exact design system and template structure provided.

CRITICAL INSTRUCTIONS:

1. READ AND APPLY the complete design system from identities/${brand_identity}/design-system.md
2. USE the template structure from ${template_id}.html as inspiration for layout patterns
3. GENERATE a complete, standalone HTML file with:
   - Complete <head> with <meta charset="UTF-8"> as FIRST tag (CRITICAL for UTF-8 encoding)
   - All CSS embedded (no external dependencies)
   - Font loading with ABSOLUTE URLs: https://hub.jumper.studio/decks/identities/${brand_identity}/fonts/HafferVF.ttf
   - Image sources with ABSOLUTE URLs: https://hub.jumper.studio/decks/identities/${brand_identity}/gradients/...
   - Logo sources with ABSOLUTE URLs: https://hub.jumper.studio/decks/identities/${brand_identity}/logos/...
   - NEVER use relative paths (no /decks/..., always use full https:// URLs with domain)
   - All animations and interactions
   - Responsive design (mobile-first)
   - Keyboard navigation (arrow keys, spacebar)

4. FOLLOW these mandatory design principles:
   - Sophisticated minimalism (90% grays, 5% orange, 5% semantic colors)
   - Strategic orange usage (#FA4721) for CTAs and key highlights only
   - Professional typography hierarchy (clamp() for responsive sizing)
   - Sequential animations (fadeInUp, stagger delays)
   - Safe padding zones (max 80px vertical, 120px horizontal)
   - Split layout for gradients (never full-bleed with gray text)

5. DECK TYPE specific structure:
   ${type === 'report' ? '- Reports: Cover → Results → Insights → Recommendations (7-10 slides)' : ''}
   ${type === 'plan' ? '- Plans: Cover → Strategy → Timeline → Budget → KPIs (7-10 slides)' : ''}
   ${type === 'pitch' ? '- Pitches: Problem → Solution → Proof → Proposal → CTA (7-10 slides)' : ''}

6. ASSET PATHS (CRITICAL - URLs MUST BE ABSOLUTE):
   - Font loading example:
     @font-face {
       font-family: 'Haffer';
       src: url('https://hub.jumper.studio/decks/identities/${brand_identity}/fonts/HafferVF.ttf') format('truetype');
     }
   - Gradient background example:
     background-image: url('https://hub.jumper.studio/decks/identities/${brand_identity}/gradients/organic-01.png')
   - Logo image example:
     <img src="https://hub.jumper.studio/decks/identities/${brand_identity}/logos/${brand_identity}-white.png" alt="Logo">
   - CRITICAL: ALL asset URLs MUST start with https://hub.jumper.studio (NEVER use /decks/... relative paths)
   - Reason: HTML is served from different domain, relative paths will fail to load

7. QUALITY STANDARDS:
   - Every slide must be perfectly centered (flexbox + auto margins)
   - Typography sizes must NOT exceed maximums in design system
   - Gradients only on 2-3 slides maximum (cover, closing, 1 hero)
   - All content must fit in safe zones (no cutoff)
   - Performance colors for metrics (excellent/good/warning/critical)

8. OUTPUT:
   - Return ONLY the complete HTML (no markdown fences, no explanations)
   - HTML must be production-ready (can be opened directly in browser)
   - Include closing slide with clear CTA and next steps

OUTPUT LANGUAGE: HTML with Brazilian Portuguese content`;

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
    const decoder = new TextDecoder('utf-8');
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
