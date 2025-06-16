
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreativeSubmissionData {
  client: string;
  managerId?: string; // Add manager ID
  partner: string;
  platform: string;
  campaignObjective?: string;
  creativeType?: string;
  objective?: string;
  mainText: string;
  headline: string;
  description: string;
  destinationUrl: string;
  callToAction: string;
  observations: string;
  filesInfo: Array<{
    name: string;
    type: string;
    size: number;
    format?: string;
    variationIndex?: number;
    base64Data?: string;
  }>;
}

const uploadFileToSupabase = async (
  fileName: string,
  base64Data: string,
  mimeType: string,
  supabase: any
): Promise<string> => {
  console.log(`🔄 Starting upload for file: ${fileName}, type: ${mimeType}, size: ${base64Data.length} chars`);
  
  // Convert base64 to blob
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create unique filename with timestamp
  const timestamp = Date.now();
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${timestamp}-${fileName}`;

  console.log(`📤 Uploading to Supabase with filename: ${uniqueFileName}`);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('creative-files')
    .upload(uniqueFileName, bytes, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    console.error('❌ Supabase storage error:', error);
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }

  console.log(`✅ File uploaded successfully:`, data);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('creative-files')
    .getPublicUrl(uniqueFileName);

  console.log(`🔗 Generated public URL: ${urlData.publicUrl}`);
  return urlData.publicUrl;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const DB_CRIATIVOS_ID = "20edb6094968807eac5fe7920c517077"
    
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
    console.log('Creative data received:', {
      managerId: creativeData.managerId,
      filesCount: creativeData.filesInfo?.length || 0,
      fileNames: creativeData.filesInfo?.map(f => f.name) || []
    })

    // Upload files to Supabase Storage and get URLs
    const uploadedFiles: Array<{ name: string; url: string; format?: string }> = [];
    
    if (creativeData.filesInfo && creativeData.filesInfo.length > 0) {
      console.log(`📁 Processing ${creativeData.filesInfo.length} files for upload...`);
      
      for (const fileInfo of creativeData.filesInfo) {
        console.log(`🔍 Processing file: ${fileInfo.name}, has base64: ${!!fileInfo.base64Data}`);
        
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
            
            console.log(`✅ File uploaded to Supabase: ${fileInfo.name} -> ${fileUrl}`);
          } catch (uploadError) {
            console.error(`❌ Failed to upload ${fileInfo.name}:`, uploadError);
            // Continue with other files, don't fail the entire submission
          }
        } else {
          console.log(`⚠️ Skipping ${fileInfo.name} - no base64 data found`);
        }
      }
      
      console.log(`📊 Upload summary: ${uploadedFiles.length}/${creativeData.filesInfo.length} files uploaded successfully`);
    } else {
      console.log('📁 No files to upload');
    }

    // Create the creative record in Notion
    const notionUrl = `https://api.notion.com/v1/pages`
    
    const notionPayload = {
      parent: {
        database_id: DB_CRIATIVOS_ID
      },
      properties: {
        "Conta": {
          relation: [
            {
              id: creativeData.client
            }
          ]
        },
        "Gerente": {
          relation: [
            {
              id: creativeData.managerId || ""
            }
          ]
        },
        "Plataforma": {
          select: {
            name: creativeData.platform === 'meta' ? 'Meta Ads' : 'Google Ads'
          }
        },
        "Formato do Anúncio": {
          multi_select: [
            {
              name: creativeData.creativeType === 'single' ? 'Imagem' : 
                   creativeData.creativeType === 'carousel' ? 'Carrossel' : 'Imagem'
            }
          ]
        },
        "Objetivo do anúncio": {
          rich_text: [
            {
              text: {
                content: creativeData.campaignObjective || creativeData.objective || ''
              }
            }
          ]
        },
        "Texto principal": {
          rich_text: [
            {
              text: {
                content: creativeData.mainText
              }
            }
          ]
        },
        "Título": {
          rich_text: [
            {
              text: {
                content: creativeData.headline
              }
            }
          ]
        },
        "Descrição": {
          rich_text: [
            {
              text: {
                content: creativeData.description || ''
              }
            }
          ]
        },
        "Link de destino": {
          url: creativeData.destinationUrl
        },
        "Call-to-Action": {
          select: {
            name: creativeData.callToAction
          }
        },
        "Copy A": {
          rich_text: [
            {
              text: {
                content: creativeData.observations || ''
              }
            }
          ]
        },
        "Status": {
          select: {
            name: "Pendente"
          }
        }
      }
    }

    // Add uploaded files to the "Arquivos" property in the correct format
    if (uploadedFiles.length > 0) {
      notionPayload.properties["Arquivos"] = {
        files: uploadedFiles.map(file => ({
          name: file.name,
          external: {
            url: file.url
          }
        }))
      };
      console.log(`📎 Added ${uploadedFiles.length} files to Arquivos property`);
    }

    console.log('Sending to Notion:', JSON.stringify(notionPayload, null, 2))

    const response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionPayload)
    })

    console.log('Notion response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Notion API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    const notionResult = await response.json()
    console.log('✅ Creative successfully created in Notion!')
    console.log('Notion page ID:', notionResult.id)
    
    // Extract the creative ID from Notion's unique_id property
    const creativeId = `CRT-${notionResult.properties.ID.unique_id.number}`;
    console.log('Generated creative ID:', creativeId);
    
    return new Response(
      JSON.stringify({
        success: true,
        creativeId: creativeId,
        notionPageId: notionResult.id,
        uploadedFiles: uploadedFiles.length,
        fileUrls: uploadedFiles.map(f => f.url),
        message: 'Criativo enviado com sucesso para o Notion!'
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
