
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CreativeSubmissionData, CreativeResult } from './types.ts'
import { uploadFileToSupabase } from './file-upload.ts'
import { createNotionCreative } from './notion-client.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const DB_CRIATIVOS_ID = "20edb6094968807eac5fe7920c517077"
    const DB_CONTAS_ID = "162db6094968808bbcbed40fef7370d1"
    
    console.log('=== CREATIVE SUBMISSION ===')
    console.log('Submitting creative at:', new Date().toISOString())
    
    if (!NOTION_TOKEN) {
      console.error('NOTION_API_KEY not found in environment variables')
      throw new Error('NOTION_API_KEY not configured')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing')
      throw new Error('Supabase configuration not found')
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const creativeData: CreativeSubmissionData = await req.json()
    console.log('🔍 Creative data received:')
    console.log('- platform:', creativeData.platform)
    console.log('- creativeName:', creativeData.creativeName)
    console.log('- managerId:', creativeData.managerId)
    console.log('- destinationUrl:', creativeData.destinationUrl)
    console.log('- cta:', creativeData.cta)
    console.log('- callToAction:', creativeData.callToAction)
    console.log('- observations:', creativeData.observations)
    console.log('- existingPost:', creativeData.existingPost)
    
    // Log Google Ads specific fields
    if (creativeData.platform === 'google') {
      console.log('=== Google Ads Specific Fields ===')
      console.log('- googleCampaignType:', creativeData.googleCampaignType)
      console.log('- headlines:', creativeData.headlines?.length || 0, 'items')
      console.log('- descriptions:', creativeData.descriptions?.length || 0, 'items')
      console.log('- businessName:', creativeData.businessName)
      console.log('- path1:', creativeData.path1)
      console.log('- path2:', creativeData.path2)
      console.log('- merchantId:', creativeData.merchantId)
      console.log('- appStoreUrl:', creativeData.appStoreUrl)
    }

    // Fetch client data from Notion to get account name and ID
    console.log('🔍 Fetching client data from Notion...');
    const clientResponse = await fetch(`https://api.notion.com/v1/pages/${creativeData.client}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!clientResponse.ok) {
      throw new Error(`Failed to fetch client data: ${clientResponse.status}`);
    }

    const clientData = await clientResponse.json();
    const clientName = clientData.properties.Conta?.title?.[0]?.plain_text || 'Unknown Client';
    console.log('✅ Client data fetched:', clientName);
    console.log('🔍 Client data structure:', JSON.stringify(clientData.properties, null, 2));

    // Group files by variation index (or file type for Google Ads)
    const filesByVariation = new Map<number, Array<{name: string; type: string; size: number; format?: string; base64Data?: string; fileType?: string}>>();
    
    if (creativeData.filesInfo && creativeData.filesInfo.length > 0) {
      console.log(`📁 Processing ${creativeData.filesInfo.length} files for upload...`);
      
      if (creativeData.platform === 'google') {
        // For Google Ads, group all files under variation 1 since we don't use variations
        console.log('📊 Google Ads: Grouping all files under single creative');
        filesByVariation.set(1, creativeData.filesInfo.map(fileInfo => ({
          ...fileInfo,
          fileType: fileInfo.fileType
        })));
      } else {
        // For Meta Ads, use existing variation logic
        creativeData.filesInfo.forEach(fileInfo => {
          const variationIndex = fileInfo.variationIndex || 1;
          if (!filesByVariation.has(variationIndex)) {
            filesByVariation.set(variationIndex, []);
          }
          filesByVariation.get(variationIndex)!.push(fileInfo);
        });
      }
      
      console.log(`📊 Files grouped into ${filesByVariation.size} ${creativeData.platform === 'google' ? 'creative' : 'variations'}`);
    }

    const totalVariations = filesByVariation.size;
    const createdCreatives: Array<{
      creativeId: string;
      notionPageId: string;
      variationIndex: number;
      uploadedFiles: Array<{ name: string; url: string; format?: string }>;
      fullCreativeName: string;
    }> = [];

    // Process each variation
    for (const [variationIndex, files] of filesByVariation.entries()) {
      console.log(`🔄 Processing variation ${variationIndex} with ${files.length} files`);
      
      const uploadedFiles: Array<{ name: string; url: string; format?: string }> = [];
      
      // Upload files for this variation
      for (const fileInfo of files) {
        console.log(`🔍 Processing file: ${fileInfo.name} for variation ${variationIndex}, has base64: ${!!fileInfo.base64Data}`);
        
        if (fileInfo.base64Data) {
          try {
            const fileUrl = await uploadFileToSupabase(
              fileInfo.name,
              fileInfo.base64Data,
              fileInfo.type,
              supabase
            );
            
            uploadedFiles.push({
              name: fileInfo.name,
              url: fileUrl,
              format: fileInfo.format
            });
            
            console.log(`✅ File uploaded to Supabase for variation ${variationIndex}: ${fileInfo.name} -> ${fileUrl}`);
          } catch (uploadError) {
            console.error(`❌ Failed to upload ${fileInfo.name} for variation ${variationIndex}:`, uploadError);
            // Continue with other files, don't fail the entire submission
          }
        } else {
          console.log(`⚠️ Skipping ${fileInfo.name} for variation ${variationIndex} - no base64 data found`);
        }
      }
      
      // Create Notion creative for this variation
      try {
        const creativeResult = await createNotionCreative(
          creativeData,
          uploadedFiles,
          variationIndex,
          totalVariations,
          NOTION_TOKEN,
          DB_CRIATIVOS_ID,
          clientData
        );
        
        createdCreatives.push({
          ...creativeResult,
          uploadedFiles
        });
        
        console.log(`✅ Created creative ${creativeResult.creativeId} for variation ${variationIndex}`);
        console.log(`📝 Full creative name: ${creativeResult.fullCreativeName}`);
      } catch (notionError) {
        console.error(`❌ Failed to create Notion creative for variation ${variationIndex}:`, notionError);
        throw notionError; // Fail the entire submission if any variation fails
      }
    }

    console.log(`🎉 Successfully created ${createdCreatives.length} creatives!`);
    
    return new Response(
      JSON.stringify({
        success: true,
        createdCreatives: createdCreatives.map(c => ({
          creativeId: c.creativeId,
          notionPageId: c.notionPageId,
          variationIndex: c.variationIndex,
          uploadedFiles: c.uploadedFiles.length,
          fullCreativeName: c.fullCreativeName
        })),
        totalCreatives: createdCreatives.length,
        creativeIds: createdCreatives.map(c => c.creativeId),
        creativeNames: createdCreatives.map(c => c.fullCreativeName),
        message: `${createdCreatives.length} criativo(s) enviado(s) com sucesso para o Notion!`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
    console.error('❌ Error in submit-creative function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  }
})
