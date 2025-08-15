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

    // Resolve manager ID if needed (convert Supabase user ID to Notion ID)
    if (creativeData.managerId) {
      console.log('🔍 Original manager ID received:', creativeData.managerId);
      
      // First, try to get user email from auth.users using the managerId (Supabase user ID)
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(creativeData.managerId);
      
      if (authUser?.user?.email) {
        console.log(`📧 Found user email: ${authUser.user.email} for user ID: ${creativeData.managerId}`);
        
        // Use email to find corresponding manager in j_ads_notion_managers
        const { data: managerData, error: managerError } = await supabase
          .from('j_ads_notion_managers')
          .select('notion_id, name, email')
          .eq('email', authUser.user.email)
          .single();

        if (managerData) {
          console.log(`✅ Bridge successful! Email ${authUser.user.email} -> Notion ID: ${managerData.notion_id} (${managerData.name})`);
          creativeData.managerId = managerData.notion_id;
        } else {
          console.warn(`⚠️ No manager found in j_ads_notion_managers for email: ${authUser.user.email}. Will proceed without manager.`);
          creativeData.managerId = undefined;
        }
      } else {
        // Fallback: try to find by notion_id directly (in case frontend already sends Notion ID)
        const { data: notionManagerData, error: notionError } = await supabase
          .from('j_ads_notion_managers')
          .select('notion_id, name')
          .eq('notion_id', creativeData.managerId)
          .single();

        if (notionManagerData) {
          console.log(`✅ Manager ID is already a valid Notion ID: ${creativeData.managerId} (${notionManagerData.name})`);
        } else {
          console.warn(`⚠️ Could not resolve manager ID ${creativeData.managerId}. Auth error: ${authError?.message}. Will proceed without manager.`);
          creativeData.managerId = undefined;
        }
      }
    }

    // Database ID for the "DB Criativos" notion database
    const DB_CRIATIVOS_DATABASE_ID = "20edb6094968807eac5fe7920c517077";

    console.log('📋 Processing creative submission');
    console.log('📋 Full creative data received:', JSON.stringify({
      ...creativeData,
      filesInfo: creativeData.filesInfo.map(f => ({ ...f, base64Data: f.base64Data ? '[TRUNCATED]' : undefined }))
    }, null, 2));

    // Fetch client data for account information (needed for account name and ID)
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
    console.log('📊 Using DB Criativos database ID:', DB_CRIATIVOS_DATABASE_ID);

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
          } else if (fileInfo.url) {
            // File already uploaded, use existing URL
            console.log(`🔗 Using existing file URL: ${fileInfo.name} -> ${fileInfo.url}`);
            uploadedFiles.push({
              name: fileInfo.name,
              url: fileInfo.url,
              format: fileInfo.format
            });
          } else if (fileInfo.instagramUrl) {
            console.log(`🔗 Using Instagram URL: ${fileInfo.instagramUrl}`);
            uploadedFiles.push({
              name: fileInfo.name,
              url: fileInfo.instagramUrl,
              format: fileInfo.format
            });
          } else {
            console.warn(`⚠️ No valid URL or base64 data found for file: ${fileInfo.name}`);
          }
        } catch (error) {
          console.error(`❌ Failed to process file ${fileInfo.name}:`, error);
          throw new Error(`Failed to process file ${fileInfo.name}: ${error.message}`);
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
          DB_CRIATIVOS_DATABASE_ID,
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