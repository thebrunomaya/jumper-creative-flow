
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
    
    console.log('=== NOTION CLIENTS CONNECTION TEST ===')
    console.log('NOTION_TOKEN exists:', !!NOTION_TOKEN)
    console.log('NOTION_TOKEN length:', NOTION_TOKEN?.length || 0)
    console.log('DB_CONTAS_ID:', DB_CONTAS_ID)
    console.log('Testing connection at:', new Date().toISOString())
    
    if (!NOTION_TOKEN) {
      console.error('NOTION_API_KEY not found in environment variables')
      throw new Error('NOTION_API_KEY not configured')
    }

    // First, let's try to get the database info to see its structure
    const dbInfoUrl = `https://api.notion.com/v1/databases/${DB_CONTAS_ID}`
    console.log('Getting database info from:', dbInfoUrl)
    
    const dbInfoResponse = await fetch(dbInfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    })

    if (!dbInfoResponse.ok) {
      const errorText = await dbInfoResponse.text()
      console.error('Database info request failed:', {
        status: dbInfoResponse.status,
        statusText: dbInfoResponse.statusText,
        body: errorText
      })
      throw new Error(`Database info error: ${dbInfoResponse.status} - ${errorText}`)
    }

    const dbInfo = await dbInfoResponse.json()
    console.log('✅ Database connection successful!')
    console.log('Database title:', dbInfo.title?.[0]?.plain_text || 'No title')
    console.log('Database properties:', Object.keys(dbInfo.properties || {}))

    // Now try to query the database
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
        page_size: 10 // Limit to 10 results for testing
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
      console.log('First result properties:', Object.keys(data.results[0].properties || {}))
      console.log('Sample client data structure:', JSON.stringify(data.results[0], null, 2))
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        database_info: {
          title: dbInfo.title?.[0]?.plain_text || 'No title',
          properties: Object.keys(dbInfo.properties || {})
        },
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
