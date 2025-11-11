/**
 * Edge Function: j_hub_deck_template_list
 *
 * Lists all available deck templates from Storage bucket.
 * Admin-only access for template management.
 *
 * Returns:
 * - template_id: Filename without extension
 * - file_path: Full path in Storage
 * - brand_identity: 'jumper' or 'koko' (extracted from path)
 * - size: File size in bytes
 * - last_modified: ISO timestamp
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    // List all files in decks/templates/ folder
    const { data: files, error: listError } = await supabase
      .storage
      .from('decks')
      .list('templates', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (listError) {
      console.error('Storage list error:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to list templates', details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter only HTML files and extract metadata
    const templates = files
      .filter(file => file.name.endsWith('.html'))
      .map(file => {
        const templateId = file.name.replace('.html', '');

        // Extract brand identity from filename patterns
        let brandIdentity: 'jumper' | 'koko' = 'jumper';
        if (templateId.includes('koko') || templateId.toLowerCase().includes('koko')) {
          brandIdentity = 'koko';
        }

        return {
          template_id: templateId,
          file_path: `templates/${file.name}`,
          brand_identity: brandIdentity,
          size: file.metadata?.size || 0,
          last_modified: file.metadata?.lastModified || file.created_at,
        };
      });

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
