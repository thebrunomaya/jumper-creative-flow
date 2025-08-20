
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
    
    console.log('=== NOTION CLIENTS CONNECTION ===')
    console.log('NOTION_TOKEN exists:', !!NOTION_TOKEN)
    console.log('DB_CONTAS_ID:', DB_CONTAS_ID)
    console.log('Fetching all clients at:', new Date().toISOString())
    
    if (!NOTION_TOKEN) {
      console.error('NOTION_API_KEY not found in environment variables')
      throw new Error('NOTION_API_KEY not configured')
    }

    // Query the database to get all pages
    const notionUrl = `https://api.notion.com/v1/databases/${DB_CONTAS_ID}/query`
    console.log('Querying database at:', notionUrl)

    const response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        // Remove page_size limit to get all results
      })
    })

    console.log('Query response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Notion API query error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Notion API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Successfully fetched clients!')
    console.log('Total results:', data.results?.length || 0)
    
    if (data.results && data.results.length > 0) {
      console.log('Sample client data - first result properties:', Object.keys(data.results[0].properties || {}))
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        results: data.results,
        total_count: data.results?.length || 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  } catch (error) {
    console.error('❌ Error in notion-clients function:', error)
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
