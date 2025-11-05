/**
 * j_hub_deck_create_share
 * Creates a public shareable link for a deck
 * Generates unique slug and optionally hashes password
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { hashPassword } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateShareRequest {
  deck_id: string;
  password?: string; // Optional password protection
}

function generateSlug(deckTitle: string, createdAt: string): string {
  // Convert deck title to slug (lowercase, remove special chars)
  const titleSlug = deckTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Trim dashes

  // Format date as DDmmmYYYY (e.g., 10out2025)
  const date = new Date(createdAt);
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const dateSlug = `${day}${month}${year}`;

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return `${titleSlug}-${dateSlug}-${randomSuffix}`;
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

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: CreateShareRequest = await req.json();
    const { deck_id, password } = body;

    if (!deck_id) {
      return new Response(JSON.stringify({ error: 'deck_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if deck exists
    const { data: deck, error: deckError } = await supabase
      .from('j_hub_decks')
      .select('*')
      .eq('id', deck_id)
      .single();

    if (deckError || !deck) {
      return new Response(JSON.stringify({ error: 'Deck not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user role (staff can share any deck they have access to, users can only share their own)
    const { data: userData } = await supabase
      .from('j_hub_users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const isStaff = userData?.role === 'staff';
    const isOwner = deck.user_id === user.id;

    if (!isAdmin && !isStaff && !isOwner) {
      return new Response(JSON.stringify({ error: 'You do not have permission to share this deck' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique slug
    const slug = generateSlug(deck.title, deck.created_at);

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await hashPassword(password);
      console.log('🔒 [DECK_CREATE_SHARE] Password protection enabled');
    }

    // Update deck with share data
    const { error: updateError } = await supabase
      .from('j_hub_decks')
      .update({
        slug: slug,
        is_public: true,
        password_hash: passwordHash,
      })
      .eq('id', deck_id);

    if (updateError) {
      console.error('❌ [DECK_CREATE_SHARE] Error updating deck:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to create share' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return success with URL
    const baseUrl = Deno.env.get('SITE_URL') || 'https://hub.jumper.studio';
    const publicUrl = `${baseUrl}/decks/share/${slug}`;

    console.log('✅ [DECK_CREATE_SHARE] Share link created:', publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        slug: slug,
        password_protected: !!password,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ [DECK_CREATE_SHARE] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
