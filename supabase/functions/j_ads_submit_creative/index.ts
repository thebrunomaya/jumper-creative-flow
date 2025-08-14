import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CreativeSubmissionData } from './types.ts';
import { uploadFileToSupabase } from './file-upload.ts';
import { createNotionCreative } from './notion-client.ts';

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
    console.log('🚀 J_ADS Submit Creative function started');

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY')!;

    if (!NOTION_TOKEN) {
      console.error('❌ NOTION_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Notion API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const body = await req.json();
    console.log('📥 Received request body:', JSON.stringify(body, null, 2));

    const creativeData: CreativeSubmissionData = body;

    // Skip managerId validation - permissions are handled by j_ads_admin_actions
    console.log('📋 Processing creative submission (managerId validation skipped)');

    // Fetch client data from Notion
    console.log('🔍 Fetching client data from Notion for client:', creativeData.client);
    
    const clientResponse = await fetch(`https://api.notion.com/v1/pages/${creativeData.client}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (!clientResponse.ok) {
      console.error('❌ Failed to fetch client data from Notion:', clientResponse.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch client data from Notion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientData = await clientResponse.json();
    console.log('✅ Client data fetched successfully');

    // Get DB_CRIATIVOS_ID from client properties
    const DB_CRIATIVOS_ID = clientData.properties?.['DB CRIATIVOS']?.relation?.[0]?.id;
    if (!DB_CRIATIVOS_ID) {
      console.error('❌ DB CRIATIVOS relation not found in client data');
      return new Response(
        JSON.stringify({ error: 'Client is not properly configured (missing DB CRIATIVOS)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Using DB_CRIATIVOS_ID:', DB_CRIATIVOS_ID);

    // Group files by variation index
    const variationGroups = new Map<number, Array<{ name: string; type: string; size: number; format?: string; base64Data?: string; instagramUrl?: string }>>();

    for (const fileInfo of creativeData.filesInfo) {
      const variationIndex = fileInfo.variationIndex ?? 0;
      if (!variationGroups.has(variationIndex)) {
        variationGroups.set(variationIndex, []);
      }
      variationGroups.get(variationIndex)!.push(fileInfo);
    }

    console.log(`📁 Processing ${variationGroups.size} variation(s)`);

    const results = [];

    // Process each variation
    for (const [variationIndex, files] of variationGroups) {
      console.log(`🔄 Processing variation ${variationIndex} with ${files.length} files`);

      const uploadedFiles = [];

      // Upload files to Supabase Storage
      for (const fileInfo of files) {
        try {
          if (fileInfo.base64Data) {
            console.log(`📤 Uploading file: ${fileInfo.name}`);
            const publicUrl = await uploadFileToSupabase(
              fileInfo.name,
              fileInfo.base64Data,
              fileInfo.type,
              supabase
            );
            
            uploadedFiles.push({
              name: fileInfo.name,
              url: publicUrl,
              format: fileInfo.format
            });
          } else if (fileInfo.instagramUrl) {
            console.log(`🔗 Using Instagram URL: ${fileInfo.instagramUrl}`);
            uploadedFiles.push({
              name: fileInfo.name,
              url: fileInfo.instagramUrl,
              format: fileInfo.format
            });
          }
        } catch (error) {
          console.error(`❌ Failed to upload file ${fileInfo.name}:`, error);
          throw new Error(`Failed to upload file ${fileInfo.name}: ${error.message}`);
        }
      }

      // Create Notion creative for this variation
      try {
        const result = await createNotionCreative(
          creativeData,
          uploadedFiles,
          variationIndex,
          variationGroups.size,
          NOTION_TOKEN,
          DB_CRIATIVOS_ID,
          clientData
        );
        
        results.push(result);
        console.log(`✅ Variation ${variationIndex} created successfully with ID: ${result.creativeId}`);
      } catch (error) {
        console.error(`❌ Failed to create Notion creative for variation ${variationIndex}:`, error);
        throw new Error(`Failed to create Notion creative for variation ${variationIndex}: ${error.message}`);
      }
    }

    console.log(`🎉 Successfully processed ${results.length} creative variation(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${results.length} creative variation(s)`,
        results: results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ J_ADS Submit Creative function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})