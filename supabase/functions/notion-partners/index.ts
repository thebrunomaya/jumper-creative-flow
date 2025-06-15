
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
    const DB_PARCEIROS_ID = "163db609-4968-80bb-8113-f8381aace362" // ID da DB_Parceiros no Notion (formato com hífens)
    
    if (!NOTION_TOKEN) {
      throw new Error('NOTION_API_KEY not configured')
    }

    console.log('Fetching partners from Notion DB:', DB_PARCEIROS_ID)

    const response = await fetch(`https://api.notion.com/v1/databases/${DB_PARCEIROS_ID}/query`, {
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
    console.log('Successfully fetched partners:', data.results?.length || 0)
    
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
