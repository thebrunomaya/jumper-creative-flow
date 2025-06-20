
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== GET USER DRAFTS ===');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get URL parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    // Build query
    let query = supabase
      .from('creative_drafts')
      .select('*')
      .eq('manager_id', user.id)
      .order('updated_at', { ascending: false });

    // Add status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data: drafts, error: draftsError } = await query;

    if (draftsError) {
      console.error('Error fetching drafts:', draftsError);
      throw new Error('Failed to fetch drafts');
    }

    console.log(`✅ Found ${drafts.length} drafts for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        drafts: drafts
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-user-drafts:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
