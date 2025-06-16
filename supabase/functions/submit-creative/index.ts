

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
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const NOTION_TOKEN = Deno.env.get('NOTION_API_KEY')
    const DB_CRIATIVOS_ID = "20edb6094968807eac5fe7920c517077" // Updated to new ID
    
    console.log('=== CREATIVE SUBMISSION ===')
    console.log('Submitting creative at:', new Date().toISOString())
    
    if (!NOTION_TOKEN) {
      console.error('NOTION_API_KEY not found in environment variables')
      throw new Error('NOTION_API_KEY not configured')
    }

    const creativeData: CreativeSubmissionData = await req.json()
    console.log('Creative data received:', creativeData)

    // Create the creative record in Notion
    const notionUrl = `https://api.notion.com/v1/pages`
    
    const notionPayload = {
      parent: {
        database_id: DB_CRIATIVOS_ID
      },
      properties: {
        "ID": {
          title: [
            {
              text: {
                content: creativeData.id
              }
            }
          ]
        },
        "Cliente": {
          rich_text: [
            {
              text: {
                content: creativeData.client
              }
            }
          ]
        },
        "Plataforma": {
          select: {
            name: creativeData.platform === 'meta' ? 'Meta Ads' : 'Google Ads'
          }
        },
        "Tipo": {
          select: {
            name: creativeData.creativeType || 'single'
          }
        },
        "Objetivo": {
          select: {
            name: creativeData.objective || 'sales'
          }
        },
        "Texto Principal": {
          rich_text: [
            {
              text: {
                content: creativeData.mainText
              }
            }
          ]
        },
        "Headline": {
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
        "URL Destino": {
          url: creativeData.destinationUrl
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
                content: creativeData.observations || ''
              }
            }
          ]
        },
        "Status": {
          select: {
            name: "Pendente"
          }
        },
        "Data Envio": {
          date: {
            start: new Date().toISOString().split('T')[0]
          }
        },
        "Arquivos": {
          rich_text: [
            {
              text: {
                content: creativeData.filesInfo.map(file => 
                  `${file.name} (${file.format || 'unknown'})${file.variationIndex ? ` - Mídia ${file.variationIndex}` : ''}`
                ).join(', ')
              }
            }
          ]
        }
      }
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

