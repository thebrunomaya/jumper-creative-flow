
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const DB_CONTAS_ID = "162db609-4968-808b-bcbe-d40fef7370d1" // ID correto da DB_Contas no Notion
    
    console.log('=== NOTION CLIENTS DEBUG ===')
    console.log('NOTION_TOKEN exists:', !!NOTION_TOKEN)
    console.log('NOTION_TOKEN length:', NOTION_TOKEN?.length || 0)
    console.log('DB_CONTAS_ID:', DB_CONTAS_ID)
    
    if (!NOTION_TOKEN) {
      console.error('NOTION_API_KEY not found in environment variables')
      throw new Error('NOTION_API_KEY not configured')
    }

    const notionUrl = `https://api.notion.com/v1/databases/${DB_CONTAS_ID}/query`
    console.log('Making request to:', notionUrl)

    const response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        sorts: [
          {
            property: 'Name',
            direction: 'ascending'
          }
        ]
      })
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Notion API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched clients count:', data.results?.length || 0)
    console.log('Sample client data:', data.results?.[0] || 'No results')
    
    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
    console.error('Error in notion-clients function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
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
