/**
 * Edge Function: j_hub_deck_template_list
 *
 * Lists all available deck templates from public /decks/templates/ directory.
 * Admin-only access for template management.
 *
 * Returns:
 * - template_id: Filename without extension
 * - file_path: Public URL path
 * - brand_identity: 'jumper' or 'koko' (extracted from filename)
 * - size: File size in bytes (fetched from HEAD request)
 * - last_modified: ISO timestamp (from Last-Modified header)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded list of templates (from /public/decks/templates/)
const TEMPLATE_FILES = [
  'general-animated-gradients.html',
  'general-apple-keynote-style-light.html',
  'general-apple-keynote-style.html',
  'general-apple-minimal.html',
  'general-black-neon-glow.html',
  'general-blue-background-modal.html',
  'general-brutalist.html',
  'general-cluely-3d-style.html',
  'general-cluely-style.html',
  'general-cyberpunk-neon.html',
  'general-dark-glowing-style.html',
  'general-dark-mode-pro.html',
  'general-editorial-magazine.html',
  'general-glassmorphism.html',
  'general-hand-drawn-sketch.html',
  'general-isometric-3d.html',
  'general-liquid-metal.html',
  'general-memphis-design.html',
  'general-minimalist-clean.html',
  'general-modern-modal-style.html',
  'general-modern-saas-dark.html',
  'general-modern-tech-startup.html',
  'general-neumorphism.html',
  'general-old-vide-game.html',
  'general-old-video-game2.html',
  'general-retro-synthwave.html',
  'general-simple-colors-style.html',
  'general-swiss-design.html',
  'general-terminal-code.html',
  'general-white-with-pops-of-color.html',
  'jumper-flare.html',
  'koko-classic.html',
  'koko-rebel.html',
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('j_hub_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build template list with metadata
    const templates = await Promise.all(
      TEMPLATE_FILES.map(async (filename) => {
        const templateId = filename.replace('.html', '');
        const publicUrl = `https://hub.jumper.studio/decks/templates/${filename}`;

        // Extract brand identity from filename
        let brandIdentity: 'jumper' | 'koko' = 'jumper';
        if (templateId.includes('koko')) {
          brandIdentity = 'koko';
        }

        // Fetch file metadata via HEAD request
        let size = 0;
        let lastModified = new Date().toISOString();

        try {
          const response = await fetch(publicUrl, { method: 'HEAD' });
          if (response.ok) {
            size = parseInt(response.headers.get('content-length') || '0', 10);
            lastModified = response.headers.get('last-modified') || lastModified;
          }
        } catch (error) {
          console.warn(`Failed to fetch metadata for ${filename}:`, error);
        }

        return {
          template_id: templateId,
          file_path: `/decks/templates/${filename}`,
          brand_identity: brandIdentity,
          size,
          last_modified: lastModified,
        };
      })
    );

    console.log(`✅ Listed ${templates.length} templates for admin user ${user.email}`);

    return new Response(
      JSON.stringify({ templates }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
