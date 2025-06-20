
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
    console.log('=== UPDATE DRAFT CREATIVE ===');
    
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
    console.log('Update request data:', requestData);

    const { creativeId, formData, status } = requestData;

    if (!creativeId) {
      throw new Error('Creative ID is required');
    }

    // Update draft record
    const { data: draftData, error: draftError } = await supabase
      .from('creative_drafts')
      .update({
        form_data: formData,
        status: status || 'IN_PROGRESS',
        last_accessed: new Date().toISOString(),
        // Update other fields from form data if provided
        platform: formData.platform || null,
        campaign_objective: formData.campaignObjective || null,
        creative_type: formData.creativeType || null,
        client_id: formData.client || null
      })
      .eq('creative_id', creativeId)
      .eq('manager_id', user.id)
      .select()
      .single();

    if (draftError) {
      console.error('Error updating draft:', draftError);
      throw new Error('Failed to update draft');
    }

    console.log('✅ Draft updated successfully:', draftData);

    return new Response(
      JSON.stringify({
        success: true,
        draft: draftData
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in update-draft-creative:', error);
    
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
