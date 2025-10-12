/**
 * j_hub_optimization_create_share
 * Creates a public shareable link for an optimization recording
 * Generates unique slug and hashes password
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateShareRequest {
  recording_id: string;
  expires_days?: number; // null = never expires
}

function generateSlug(accountName: string, recordedAt: string): string {
  // Convert account name to slug (lowercase, remove special chars)
  const accountSlug = accountName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Trim dashes

  // Format date as DDmmmYYYY (e.g., 10out2025)
  const date = new Date(recordedAt);
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const dateSlug = `${day}${month}${year}`;

  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);

  return `${accountSlug}-${dateSlug}-${randomSuffix}`;
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
    const { recording_id, expires_days } = body;

    if (!recording_id) {
      return new Response(JSON.stringify({ error: 'recording_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has permission to this recording (must be owner or admin)
    const { data: recording, error: recordingError } = await supabase
      .from('j_ads_optimization_recordings')
      .select('*, j_hub_notion_db_accounts!inner(notion_id, "Conta")')
      .eq('id', recording_id)
      .single();

    if (recordingError || !recording) {
      return new Response(JSON.stringify({ error: 'Recording not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user role (only Gestors/Admins can create shares)
    const { data: userData } = await supabase
      .from('j_hub_users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const isStaff = userData?.role === 'staff';

    if (!isAdmin && !isStaff) {
      return new Response(JSON.stringify({ error: 'Only staff members can create share links' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique slug
    const accountName = recording.j_hub_notion_db_accounts?.["Conta"] || 'optimization';
    const slug = generateSlug(accountName, recording.recorded_at);

    // Calculate expiration date
    let expiresAt: string | null = null;
    if (expires_days && expires_days > 0) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expires_days);
      expiresAt = expirationDate.toISOString();
    }

    // Update recording with share data
    const { error: updateError } = await supabase
      .from('j_ads_optimization_recordings')
      .update({
        public_slug: slug,
        password_hash: null,
        share_enabled: true,
        share_expires_at: expiresAt,
        share_created_at: new Date().toISOString(),
      })
      .eq('id', recording_id);

    if (updateError) {
      console.error('Error updating recording:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to create share' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return success with URL
    const baseUrl = Deno.env.get('SITE_URL') || 'https://ads.jumper.studio';
    const publicUrl = `${baseUrl}/optimization/${slug}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        slug: slug,
        expires_at: expiresAt,
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
