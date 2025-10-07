import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recording_id, instruction } = await req.json();

    if (!recording_id || !instruction) {
      throw new Error('recording_id and instruction are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Fetching transcript for recording:', recording_id);

    // Fetch current transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('j_ads_optimization_transcripts')
      .select('full_text')
      .eq('recording_id', recording_id)
      .single();

    if (transcriptError || !transcript) {
      console.error('❌ Transcript error:', transcriptError);
      throw new Error('Transcript not found');
    }

    console.log('📝 Current text length:', transcript.full_text.length);
    console.log('📋 Instruction:', instruction);

    // Call OpenAI to apply surgical correction
    const systemPrompt = `Você é um corretor cirúrgico de transcrições de áudio.

REGRAS ABSOLUTAS:
1. Aplique APENAS as correções solicitadas pelo usuário
2. Mantenha TODO o resto do texto EXATAMENTE igual
3. Não reformule, não melhore, não adicione pontuação extra
4. Não corrija erros que não foram mencionados nas instruções
5. Mantenha a estrutura e quebras de linha originais
6. Se a instrução for vaga ou ambígua, faça a menor alteração possível

Retorne APENAS o texto corrigido, sem comentários ou explicações.`;

    const userPrompt = `Texto atual:
${transcript.full_text}

Instruções de correção:
${instruction}`;

    console.log('🤖 Calling OpenAI for correction...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const correctedText = openaiData.choices[0].message.content;

    console.log('✅ Correction completed, new length:', correctedText.length);

    return new Response(
      JSON.stringify({ corrected_text: correctedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in correct-transcription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});