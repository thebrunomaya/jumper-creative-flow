import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { validateEnvironment } from '../_shared/env-validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * j_hub_deck_upload_html - Upload pre-made HTML deck directly
 *
 * This function allows uploading a ready-made HTML presentation,
 * skipping the 3-stage generation pipeline (analysis → review → generation).
 *
 * Use case: When you have an HTML deck created externally (e.g., by Claude Code)
 * and want to host it on the hub.jumper.studio deck system.
 */
serve(async (req) => {
  console.log('📨 [DECK_UPLOAD_HTML] Request received:', {
    method: req.method,
    url: req.url,
  });

  if (req.method === 'OPTIONS') {
    console.log('✅ [DECK_UPLOAD_HTML] Responding to OPTIONS (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    console.log('🔒 [DECK_UPLOAD_HTML] Validating environment variables...');
    const env = validateEnvironment();
    console.log('✅ [DECK_UPLOAD_HTML] Environment validation passed');

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('👤 [DECK_UPLOAD_HTML] User authenticated:', user.email);

    // Parse request body
    console.log('📦 [DECK_UPLOAD_HTML] Parsing request body...');
    const bodyBytes = await req.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const bodyText = decoder.decode(bodyBytes);
    const body = JSON.parse(bodyText);

    const {
      title,
      html_content,
      type = 'pitch',
      brand_identity = 'jumper',
      template_id = 'custom-upload',
      account_id,
    } = body;

    console.log('📋 [DECK_UPLOAD_HTML] Request validated:', {
      title,
      type,
      brand_identity,
      template_id,
      account_id,
      html_length: html_content?.length || 0,
    });

    // Validate required fields
    if (!title) {
      throw new Error('Missing required field: title');
    }

    if (!html_content) {
      throw new Error('Missing required field: html_content');
    }

    // Basic HTML validation
    if (!html_content.includes('<html') && !html_content.includes('<!DOCTYPE')) {
      throw new Error('Invalid HTML: must contain <html> or <!DOCTYPE> tag');
    }

    const validTypes = ['report', 'pitch', 'plan'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    const validBrands = ['jumper', 'koko', 'general'];
    if (!validBrands.includes(brand_identity)) {
      throw new Error(`Invalid brand_identity: ${brand_identity}. Must be one of: ${validBrands.join(', ')}`);
    }

    // Create deck record in database with all stages completed
    console.log('💾 [DECK_UPLOAD_HTML] Creating deck record...');
    const { data: newDeck, error: insertError } = await supabase
      .from('j_hub_decks')
      .insert({
        title,
        markdown_source: `# ${title}\n\nDeck criado via upload direto de HTML.\n\nTipo: ${type}\nIdentidade: ${brand_identity}`,
        type,
        brand_identity,
        template_id,
        account_id: account_id || null,
        user_id: user.id,
        // Skip all stages - mark as completed
        analysis_status: 'completed',
        review_status: 'completed',
        generation_status: 'completed',
        // Store HTML output
        html_output: html_content,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ [DECK_UPLOAD_HTML] Database insert error:', insertError);
      throw new Error(`Failed to create deck: ${insertError.message}`);
    }

    if (!newDeck?.id) {
      throw new Error('Deck created but no ID returned');
    }

    const deckId = newDeck.id;
    console.log('✅ [DECK_UPLOAD_HTML] Deck record created:', deckId);

    // Upload HTML to Supabase Storage
    console.log('📤 [DECK_UPLOAD_HTML] Uploading HTML to Storage...');
    const fileName = `${deckId}.html`;
    const htmlBlob = new Blob([html_content], { type: 'text/html; charset=utf-8' });

    const { error: uploadError } = await supabase.storage
      .from('decks')
      .upload(fileName, htmlBlob, {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ [DECK_UPLOAD_HTML] Storage upload error:', uploadError);
      // Don't fail completely - deck is created, just without Storage URL
      console.log('⚠️ [DECK_UPLOAD_HTML] Continuing without Storage URL (html_output is saved)');
    } else {
      // Get public URL and update deck
      const { data: publicUrlData } = supabase.storage
        .from('decks')
        .getPublicUrl(fileName);

      const fileUrl = publicUrlData?.publicUrl;
      console.log('✅ [DECK_UPLOAD_HTML] File uploaded:', fileUrl);

      // Update deck with file_url
      const { error: updateError } = await supabase
        .from('j_hub_decks')
        .update({ file_url: fileUrl })
        .eq('id', deckId);

      if (updateError) {
        console.error('⚠️ [DECK_UPLOAD_HTML] Failed to update file_url:', updateError);
      }
    }

    console.log('✅ [DECK_UPLOAD_HTML] Deck upload completed successfully');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        deck_id: deckId,
        message: 'HTML deck uploaded successfully. Ready for preview and sharing.',
        editor_url: `/decks/${deckId}/editor`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ [DECK_UPLOAD_HTML] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to upload HTML deck',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 500,
      }
    );
  }
});
