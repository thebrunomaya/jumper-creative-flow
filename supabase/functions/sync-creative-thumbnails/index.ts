/**
 * Edge Function: sync-creative-thumbnails
 *
 * Downloads thumbnails from Meta CDN and stores them permanently in Supabase Storage.
 * This prevents thumbnails from expiring (Meta URLs expire in 1-7 days).
 *
 * Usage:
 * - Called via cron job or manually
 * - Processes creatives that have thumbnail_url but no thumbnail_storage_url
 * - Stores in: storage/criativos/thumbnails/{account_id}/{creative_id}.jpg
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreativeRow {
  creative_id: string;
  account_id: string;
  thumbnail_url: string;
}

interface SyncResult {
  creative_id: string;
  account_id: string;
  status: 'success' | 'skipped' | 'error';
  storage_url?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get parameters from request body or use defaults
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50; // Process up to 50 at a time
    const accountId = body.account_id || null; // Optional: filter by account

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find creatives that need thumbnail sync
    // Group by creative_id to avoid duplicates (same creative across multiple days)
    let query = supabase
      .from('j_rep_metaads_bronze')
      .select('creative_id, account_id, thumbnail_url')
      .not('creative_id', 'is', null)
      .not('thumbnail_url', 'is', null)
      .is('thumbnail_storage_url', null)
      .order('creative_id')
      .limit(limit * 3); // Fetch more to account for duplicates

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data: rawCreatives, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    if (!rawCreatives || rawCreatives.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No creatives need thumbnail sync',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate by creative_id (keep first occurrence)
    const seenCreativeIds = new Set<string>();
    const creatives: CreativeRow[] = [];

    for (const row of rawCreatives) {
      if (!seenCreativeIds.has(row.creative_id)) {
        seenCreativeIds.add(row.creative_id);
        creatives.push(row as CreativeRow);
        if (creatives.length >= limit) break;
      }
    }

    console.log(`Processing ${creatives.length} creatives for thumbnail sync`);

    const results: SyncResult[] = [];

    for (const creative of creatives) {
      const result = await syncThumbnail(supabase, creative);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    };

    return new Response(
      JSON.stringify({
        message: 'Thumbnail sync completed',
        summary,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Sync a single creative's thumbnail
 */
async function syncThumbnail(
  supabase: ReturnType<typeof createClient>,
  creative: CreativeRow
): Promise<SyncResult> {
  const { creative_id, account_id, thumbnail_url } = creative;

  try {
    // Check if already synced (double check)
    const { data: existing } = await supabase
      .from('j_rep_metaads_bronze')
      .select('thumbnail_storage_url')
      .eq('creative_id', creative_id)
      .not('thumbnail_storage_url', 'is', null)
      .limit(1)
      .single();

    if (existing?.thumbnail_storage_url) {
      return {
        creative_id,
        account_id,
        status: 'skipped',
        storage_url: existing.thumbnail_storage_url,
      };
    }

    // Download image from Meta CDN
    console.log(`Downloading thumbnail for creative ${creative_id}`);
    const imageResponse = await fetch(thumbnail_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JumperBot/1.0)',
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`Failed to download: HTTP ${imageResponse.status}`);
    }

    // Get content type and determine extension
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const extension = getExtensionFromContentType(contentType);

    // Read image as array buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Upload to Supabase Storage
    const storagePath = `thumbnails/${account_id}/${creative_id}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('criativos')
      .upload(storagePath, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('criativos')
      .getPublicUrl(storagePath);

    // Update all records with this creative_id
    const { error: updateError } = await supabase
      .from('j_rep_metaads_bronze')
      .update({ thumbnail_storage_url: publicUrl })
      .eq('creative_id', creative_id);

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }

    console.log(`Synced creative ${creative_id} -> ${publicUrl}`);

    return {
      creative_id,
      account_id,
      status: 'success',
      storage_url: publicUrl,
    };

  } catch (error) {
    console.error(`Error syncing ${creative_id}:`, error);
    return {
      creative_id,
      account_id,
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[contentType] || 'jpg';
}
