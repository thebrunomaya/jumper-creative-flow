
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
    console.log('=== CREATE DRAFT CREATIVE ===');
    
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

    const requestData = await req.json();
    console.log('Request data:', requestData);

    const { client, platform, campaignObjective, creativeType } = requestData;

    if (!client) {
      throw new Error('Client is required');
    }

    // Generate creative ID
    const { data: creativeIdData, error: idError } = await supabase
      .rpc('generate_creative_id');

    if (idError) {
      console.error('Error generating creative ID:', idError);
      throw new Error('Failed to generate creative ID');
    }

    const creativeId = creativeIdData;
    console.log('Generated creative ID:', creativeId);

    // Create draft record
    const { data: draftData, error: draftError } = await supabase
      .from('creative_drafts')
      .insert({
        creative_id: creativeId,
        manager_id: user.id,
        client_id: client,
        platform: platform || null,
        campaign_objective: campaignObjective || null,
        creative_type: creativeType || null,
        form_data: requestData,
        status: 'DRAFT'
      })
      .select()
      .single();

    if (draftError) {
      console.error('Error creating draft:', draftError);
      throw new Error('Failed to create draft');
    }

    console.log('✅ Draft created successfully:', draftData);

    return new Response(
      JSON.stringify({
        success: true,
        creativeId: creativeId,
        draftId: draftData.id
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in create-draft-creative:', error);
    
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
