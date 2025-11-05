/**
 * j_hub_deck_view_shared
 * Validates password (if required) and returns deck HTML for public viewing
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyPassword } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ViewShareRequest {
  slug: string;
  password?: string; // Optional password if deck is protected
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const body: ViewShareRequest = await req.json();
    const { slug, password } = body;

    console.log('🔍 [DECK_VIEW_SHARED] Request received:', { slug, hasPassword: !!password });

    if (!slug) {
      return new Response(JSON.stringify({ error: 'slug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find deck by slug
    const { data: deck, error: deckError } = await supabase
      .from('j_hub_decks')
      .select(`
        *,
        j_hub_users!inner(
          email
        ),
        j_hub_notion_db_accounts(
          notion_id,
          "Conta"
        )
      `)
      .eq('slug', slug)
      .eq('is_public', true)
      .single();

    console.log('🔍 [DECK_VIEW_SHARED] Deck lookup:', {
      found: !!deck,
      error: deckError?.message
    });

    if (deckError || !deck) {
      return new Response(JSON.stringify({ error: 'Deck not found or not public' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if password is required
    if (deck.password_hash) {
      console.log('🔒 [DECK_VIEW_SHARED] Password protection enabled');

      if (!password) {
        return new Response(JSON.stringify({
          success: false,
          password_required: true,
          message: 'This deck is password protected'
        }), {
          status: 200, // 200 to indicate valid slug, but needs password
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify password
      const passwordMatch = await verifyPassword(password, deck.password_hash);

      if (!passwordMatch) {
        console.log('❌ [DECK_VIEW_SHARED] Invalid password');
        return new Response(JSON.stringify({
          success: false,
          password_required: true,
          error: 'Invalid password'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ [DECK_VIEW_SHARED] Password validated successfully');
    }

    // Return deck data (HTML + metadata)
    console.log('✅ [DECK_VIEW_SHARED] Returning deck data');

    return new Response(
      JSON.stringify({
        success: true,
        password_required: false,
        deck: {
          id: deck.id,
          title: deck.title,
          type: deck.type,
          brand_identity: deck.brand_identity,
          account_name: deck.j_hub_notion_db_accounts?.["Conta"] || null,
          html_output: deck.html_output,
          file_url: deck.file_url,
          created_at: deck.created_at,
          created_by: deck.j_hub_users?.email || 'Unknown',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ [DECK_VIEW_SHARED] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
