import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { validateEnvironment } from '../_shared/env-validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('📨 [DECK_CREATE] Request received:', {
    method: req.method,
    url: req.url,
  });

  if (req.method === 'OPTIONS') {
    console.log('✅ [DECK_CREATE] Responding to OPTIONS (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    console.log('🔒 [DECK_CREATE] Validating environment variables...');
    const env = validateEnvironment();
    console.log('✅ [DECK_CREATE] Environment validation passed');

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

    console.log('👤 [DECK_CREATE] User authenticated:', user.email);

    // Parse request body
    console.log('📦 [DECK_CREATE] Parsing request body...');
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

    console.log('📋 [DECK_CREATE] Request validated:', {
      title,
      type,
      brand_identity,
      template_id,
      account_id,
      markdown_length: markdown_source?.length || 0,
    });

    // Validate required fields
    if (!title || !markdown_source || !type || !brand_identity || !template_id) {
      throw new Error('Missing required fields: title, markdown_source, type, brand_identity, template_id');
    }

    const validTypes = ['report', 'pitch', 'plan'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    }

    const validBrands = ['jumper', 'koko'];
    if (!validBrands.includes(brand_identity)) {
      throw new Error(`Invalid brand_identity: ${brand_identity}. Must be one of: ${validBrands.join(', ')}`);
    }

    if (markdown_source.length < 100) {
      throw new Error('Markdown source must be at least 100 characters');
    }

    // Create deck record in database
    console.log('💾 [DECK_CREATE] Creating deck record...');
    const { data: newDeck, error: insertError } = await supabase
      .from('j_hub_decks')
      .insert({
        title,
        markdown_source,
        type,
        brand_identity,
        template_id,
        account_id: account_id || null,
        user_id: user.id,
        analysis_status: 'pending',
        review_status: 'pending',
        generation_status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ [DECK_CREATE] Database insert error:', insertError);
      throw new Error(`Failed to create deck: ${insertError.message}`);
    }

    if (!newDeck?.id) {
      throw new Error('Deck created but no ID returned');
    }

    console.log('✅ [DECK_CREATE] Deck created successfully:', newDeck.id);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        deck_id: newDeck.id,
        message: 'Deck created successfully. Ready for Stage 1 (Content Analysis).',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ [DECK_CREATE] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create deck',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 500,
      }
    );
  }
});
