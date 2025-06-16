
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreativeSubmissionData {
  id: string;
  client: string;
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

const uploadFileToNotion = async (
  fileName: string,
  base64Data: string,
  mimeType: string,
  notionToken: string
): Promise<string> => {
  // Convert base64 to blob
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  // Upload file to Notion
  const formData = new FormData();
  formData.append('file', blob, fileName);

  const uploadResponse = await fetch('https://api.notion.com/v1/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28'
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('File upload error:', errorText);
    throw new Error(`Failed to upload file: ${uploadResponse.status}`);
  }

  const uploadResult = await uploadResponse.json();
  return uploadResult.url;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY')
    const DB_CRIATIVOS_ID = "20edb6094968807eac5fe7920c517077"
    
    console.log('=== CREATIVE SUBMISSION ===')
    console.log('Submitting creative at:', new Date().toISOString())
    
    if (!NOTION_TOKEN) {
      console.error('NOTION_API_KEY not found in environment variables')
      throw new Error('NOTION_API_KEY not configured')
    }

    const creativeData: CreativeSubmissionData = await req.json()
    console.log('Creative data received:', creativeData)

    // Upload files to Notion and get URLs
    const uploadedFiles: Array<{ name: string; url: string; format?: string }> = [];
    
    if (creativeData.filesInfo && creativeData.filesInfo.length > 0) {
      console.log(`Uploading ${creativeData.filesInfo.length} files...`);
      
      for (const fileInfo of creativeData.filesInfo) {
        if (fileInfo.base64Data) {
          try {
            const fileUrl = await uploadFileToNotion(
              fileInfo.name,
              fileInfo.base64Data,
              fileInfo.type,
              NOTION_TOKEN
            );
            
            uploadedFiles.push({
              name: fileInfo.name,
              url: fileUrl,
              format: fileInfo.format
            });
            
            console.log(`✅ File uploaded: ${fileInfo.name}`);
          } catch (uploadError) {
            console.error(`❌ Failed to upload ${fileInfo.name}:`, uploadError);
            // Continue with other files, don't fail the entire submission
          }
        }
      }
    }

    // Create the creative record in Notion
    const notionUrl = `https://api.notion.com/v1/pages`
    
    const notionPayload = {
      parent: {
        database_id: DB_CRIATIVOS_ID
      },
      properties: {
        "ID do Anúncio": {
          title: [
            {
              text: {
                content: creativeData.id
              }
            }
          ]
        },
        "Conta": {
          relation: [
            {
              id: creativeData.client
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

    // Add uploaded files URLs to the payload if available
    if (uploadedFiles.length > 0) {
      const fileLinks = uploadedFiles.map(file => `${file.name}: ${file.url}`).join('\n');
      notionPayload.properties["Arquivos Enviados"] = {
        rich_text: [
          {
            text: {
              content: fileLinks
            }
          }
        ]
      };
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
    
    return new Response(
      JSON.stringify({
        success: true,
        creativeId: creativeData.id,
        notionPageId: notionResult.id,
        uploadedFiles: uploadedFiles.length,
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
