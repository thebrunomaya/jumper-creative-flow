
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
    const DB_CONTAS_ID = "18bdb609-4968-8021-8ca5-d71ff12660ab" // ID da DB_Contas no Notion (formato com hífens)
    
    if (!NOTION_TOKEN) {
      throw new Error('NOTION_API_KEY not configured')
    }

    console.log('Fetching clients from Notion DB:', DB_CONTAS_ID)

    const response = await fetch(`https://api.notion.com/v1/databases/${DB_CONTAS_ID}/query`, {
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

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Notion API error:', response.status, errorText)
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched clients:', data.results?.length || 0)
    
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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
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
