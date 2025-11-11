/**
 * Edge Function: j_hub_deck_template_read
 *
 * Fetches a specific template HTML from Storage bucket.
 * Admin-only access for template management.
 *
 * Request body:
 * - template_id: Template filename without extension (e.g., "koko-classic")
 *
 * Returns:
 * - template_id: Filename without extension
 * - html_content: Full HTML content
 * - size: File size in bytes
 * - file_path: Full path in Storage
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

    // Parse request body
    const { template_id } = await req.json();

    if (!template_id) {
      return new Response(
        JSON.stringify({ error: 'Missing template_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct file path
    const filePath = `templates/${template_id}.html`;

    console.log(`📖 Reading template: ${filePath} for admin user ${user.email}`);

    // Download file from Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('decks')
      .download(filePath);

    if (downloadError) {
      console.error('Storage download error:', downloadError);
      return new Response(
        JSON.stringify({
          error: 'Failed to download template',
          details: downloadError.message,
          template_id,
          file_path: filePath
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert Blob to text with explicit UTF-8 encoding
    const arrayBuffer = await fileData.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const htmlContent = decoder.decode(arrayBuffer);

    const size = htmlContent.length;

    console.log(`✅ Successfully read template ${template_id} (${size} bytes)`);

    return new Response(
      JSON.stringify({
        template_id,
        html_content: htmlContent,
        size,
        file_path: filePath
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
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
