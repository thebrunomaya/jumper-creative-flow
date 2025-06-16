
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreativeSubmissionData {
  client: string;
  managerId?: string;
  partner: string;
  platform: string;
  campaignObjective?: string;
  creativeType?: string;
  objective?: string;
  mainTexts: string[]; // Changed to array
  titles: string[]; // Changed to array  
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

const createNotionCreative = async (
  creativeData: CreativeSubmissionData,
  variationFiles: Array<{ name: string; url: string; format?: string }>,
  variationIndex: number,
  NOTION_TOKEN: string,
  DB_CRIATIVOS_ID: string
) => {
  const notionUrl = `https://api.notion.com/v1/pages`;
  
  // Validate URL before sending to Notion
  if (!creativeData.destinationUrl || creativeData.destinationUrl.trim() === '') {
    console.error('❌ CRITICAL: destinationUrl is empty or missing!');
    throw new Error('URL de destino é obrigatória');
  }

  let validatedUrl = creativeData.destinationUrl.trim();
  
  // Ensure URL has proper protocol
  if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
    validatedUrl = 'https://' + validatedUrl;
    console.log('🔧 Added https:// protocol to URL:', validatedUrl);
  }

  // Test URL validity
  try {
    new URL(validatedUrl);
    console.log('✅ URL validation passed:', validatedUrl);
  } catch (urlError) {
    console.error('❌ Invalid URL format:', validatedUrl, urlError);
    throw new Error(`URL inválida: ${validatedUrl}`);
  }

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
              content: creativeData.mainTexts.join(' | ')  // Join multiple main texts
            }
          }
        ]
      },
      "Título": {
        rich_text: [
          {
            text: {
              content: creativeData.titles.join(' | ')  // Join multiple titles
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
        url: validatedUrl
      },
      "Call-to-Action": {
        select: {
          name: creativeData.callToAction
        }
      },
      "Observações": {
        rich_text: [
          {
            text: {
              content: (creativeData.observations || '') + (variationIndex > 1 ? ` (Variação ${variationIndex})` : '')
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
  };

  // Add uploaded files to the "Arquivos" property
  if (variationFiles.length > 0) {
    notionPayload.properties["Arquivos"] = {
      files: variationFiles.map(file => ({
        name: file.name,
        external: {
          url: file.url
        }
      }))
    };
    console.log(`📎 Added ${variationFiles.length} files to Arquivos property for variation ${variationIndex}`);
  }

  console.log(`📤 Sending variation ${variationIndex} to Notion`);

  const response = await fetch(notionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify(notionPayload)
  });

  console.log(`📨 Notion response status for variation ${variationIndex}:`, response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Notion API error for variation ${variationIndex}:`, {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Notion API error for variation ${variationIndex}: ${response.status} - ${errorText}`);
  }

  const notionResult = await response.json();
  console.log(`✅ Creative variation ${variationIndex} successfully created in Notion!`);
  console.log(`📄 Notion page ID for variation ${variationIndex}:`, notionResult.id);
  
  // Extract the creative ID from Notion's unique_id property
  const creativeId = `CRT-${notionResult.properties.ID.unique_id.number}`;
  console.log(`🆔 Generated creative ID for variation ${variationIndex}:`, creativeId);
  
  return {
    creativeId,
    notionPageId: notionResult.id,
    variationIndex
  };
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
    console.log('🔍 Creative data received:')
    console.log('- managerId:', creativeData.managerId)
    console.log('- destinationUrl:', creativeData.destinationUrl)
    console.log('- observations:', creativeData.observations)

    // Group files by variation index
    const filesByVariation = new Map<number, Array<{name: string; type: string; size: number; format?: string; base64Data?: string}>>();
    
    if (creativeData.filesInfo && creativeData.filesInfo.length > 0) {
      console.log(`📁 Processing ${creativeData.filesInfo.length} files for upload...`);
      
      creativeData.filesInfo.forEach(fileInfo => {
        const variationIndex = fileInfo.variationIndex || 1;
        if (!filesByVariation.has(variationIndex)) {
          filesByVariation.set(variationIndex, []);
        }
        filesByVariation.get(variationIndex)!.push(fileInfo);
      });
      
      console.log(`📊 Files grouped into ${filesByVariation.size} variations`);
    }

    const createdCreatives: Array<{
      creativeId: string;
      notionPageId: string;
      variationIndex: number;
      uploadedFiles: Array<{ name: string; url: string; format?: string }>;
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
          NOTION_TOKEN,
          DB_CRIATIVOS_ID
        );
        
        createdCreatives.push({
          ...creativeResult,
          uploadedFiles
        });
        
        console.log(`✅ Created creative ${creativeResult.creativeId} for variation ${variationIndex}`);
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
          uploadedFiles: c.uploadedFiles.length
        })),
        totalCreatives: createdCreatives.length,
        creativeIds: createdCreatives.map(c => c.creativeId),
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
