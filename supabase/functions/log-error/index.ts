import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { 
      error_type, 
      message, 
      stack_trace, 
      url, 
      user_email, 
      user_agent, 
      component_name, 
      severity = 'error',
      metadata = {}
    } = await req.json()

    // Validação dos campos obrigatórios
    if (!error_type || !message) {
      console.error('Missing required fields:', { error_type, message })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: error_type and message' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('=== ERROR LOG SUBMISSION ===')
    console.log('Error Type:', error_type)
    console.log('Message:', message.substring(0, 100) + '...')
    console.log('User Email:', user_email)
    console.log('Severity:', severity)

    // Inserir log no banco
    const { data, error } = await supabase
      .from('error_logs')
      .insert({
        error_type,
        message,
        stack_trace,
        url,
        user_email,
        user_agent,
        component_name,
        severity,
        metadata
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save error log',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ Error log saved successfully:', data?.[0]?.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        log_id: data?.[0]?.id,
        message: 'Error logged successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in log-error function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})