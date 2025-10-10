/**
 * j_ads_view_shared_optimization
 * Validates password and returns optimization data for public viewing
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyPassword } from '../_shared/password-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ViewShareRequest {
  slug: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const body: ViewShareRequest = await req.json();
    const { slug, password } = body;

    if (!slug || !password) {
      return new Response(JSON.stringify({ error: 'slug and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find recording by slug
    const { data: recording, error: recordingError } = await supabase
      .from('j_ads_optimization_recordings')
      .select(`
        *,
        j_ads_notion_db_accounts!inner(
          notion_id,
          "Conta"
        )
      `)
      .eq('public_slug', slug)
      .eq('share_enabled', true)
      .single();

    if (recordingError || !recording) {
      return new Response(JSON.stringify({ error: 'Share link not found or disabled' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if share has expired
    if (recording.share_expires_at) {
      const expirationDate = new Date(recording.share_expires_at);
      if (expirationDate < new Date()) {
        return new Response(JSON.stringify({ error: 'Share link has expired' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate password
    console.log('DEBUG - Password validation:', {
      providedPasswordLength: password.length,
      storedHashLength: recording.password_hash?.length || 0,
      hashPreview: recording.password_hash?.substring(0, 20) + '...',
    });

    const passwordMatch = await verifyPassword(password, recording.password_hash);

    console.log('DEBUG - Password match result:', passwordMatch);

    if (!passwordMatch) {
      console.error('Password validation failed');
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Password is correct - fetch ONLY AI analysis (not transcript or audio)
    // Get context (AI analysis) - this is the only data shared publicly
    const { data: contextData } = await supabase
      .from('j_ads_optimization_context')
      .select('*')
      .eq('recording_id', recording.id)
      .maybeSingle();

    // Return only public-facing data (NO transcript, NO audio)
    return new Response(
      JSON.stringify({
        success: true,
        recording: {
          id: recording.id,
          account_name: recording.j_ads_notion_db_accounts?.["Conta"] || 'N/A',
          recorded_at: recording.recorded_at,
          recorded_by: recording.recorded_by,
          objectives: recording.objectives,
          platforms: recording.platforms,
        },
        context: contextData ? {
          summary: contextData.summary,
          actions_taken: contextData.actions_taken,
          metrics_mentioned: contextData.metrics_mentioned,
          strategy: contextData.strategy,
          timeline: contextData.timeline,
          confidence_level: contextData.confidence_level,
        } : null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
