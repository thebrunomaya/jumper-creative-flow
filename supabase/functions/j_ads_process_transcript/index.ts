import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recording_id } = await req.json();
    
    if (!recording_id) {
      throw new Error('recording_id is required');
    }

    console.log('📝 Processing transcript into topics for:', recording_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update status to processing_transcript
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ transcription_status: 'processing_transcript' })
      .eq('id', recording_id);

    // Fetch recording
    const { data: recording, error: recError } = await supabase
      .from('j_ads_optimization_recordings')
      .select('*')
      .eq('id', recording_id)
      .single();

    if (recError || !recording) {
      throw new Error('Recording not found');
    }

    // Fetch transcript
    const { data: transcript, error: transError } = await supabase
      .from('j_ads_optimization_transcripts')
      .select('*')
      .eq('recording_id', recording_id)
      .single();

    if (transError || !transcript) {
      throw new Error('Transcript not found');
    }

    // Fetch account context
    const { data: accountData } = await supabase
      .from('j_ads_notion_db_accounts')
      .select('Conta, Objetivos, "Contexto para Otimização"')
      .eq('id', recording.account_id)
      .single();

    const accountName = accountData?.Conta || 'Conta';
    const objectives = recording.selected_objectives?.join(', ') || accountData?.Objetivos || 'não especificados';
    const accountContext = accountData?.['Contexto para Otimização'] || '';

    // Fetch last 3 optimizations from this account for historical context
    const { data: previousOptimizations } = await supabase
      .from('j_ads_optimization_context')
      .select(`
        summary,
        actions_taken,
        created_at,
        j_ads_optimization_recordings!inner(recorded_at, recorded_by)
      `)
      .eq('account_id', recording.account_id)
      .neq('recording_id', recording_id)
      .order('created_at', { ascending: false })
      .limit(3);

    let historicalContext = '';
    if (previousOptimizations && previousOptimizations.length > 0) {
      console.log(`📚 Including ${previousOptimizations.length} previous optimizations as context`);
      historicalContext = '\n\nHISTÓRICO RECENTE (últimas otimizações):\n';
      previousOptimizations.forEach((opt, idx) => {
        const recordDate = new Date(opt.j_ads_optimization_recordings.recorded_at).toLocaleDateString('pt-BR');
        historicalContext += `\n${idx + 1}. ${recordDate} - ${opt.summary.substring(0, 150)}...\n`;
        if (opt.actions_taken && opt.actions_taken.length > 0) {
          historicalContext += `   Principais ações: ${opt.actions_taken.length} ação(ões)\n`;
        }
      });
    }

    // Prepare prompt for AI processing
    const systemPrompt = `Você é um especialista em organizar transcrições de gestores de tráfego pago.

Sua tarefa é transformar uma transcrição bruta em tópicos organizados cronologicamente, facilitando a revisão e posterior análise estruturada.

IMPORTANTE: Retorne APENAS o texto organizado em tópicos, sem introdução ou conclusão adicional.

Formato esperado:

### 🎯 [Timestamp/Momento] - Título da Ação/Observação
**O que foi feito:** Descrição clara da ação ou observação
**Métricas citadas:** CPM R$ X, ROAS Y, CTR Z% (se mencionadas)
**Motivo/Contexto:** Por que tomou essa decisão

Use emojis relevantes (📊 📈 📉 ⚠️ ✅ 🔄 etc.) para facilitar a leitura.
Mantenha a ordem temporal dos eventos.
Cite TODAS as métricas numéricas mencionadas.
Se o gestor mencionar campanhas/ads específicos, cite os nomes.`;

    const platform = recording.platform === 'google' ? 'Google Ads' : 'Meta Ads';

    const userPrompt = `CONTEXTO DA CONTA:
- Nome: ${accountName}
- Plataforma: ${platform}
- Objetivos: ${objectives}
${accountContext ? `- Contexto adicional: ${accountContext}` : ''}
${historicalContext}

TRANSCRIÇÃO BRUTA:
${transcript.full_text}

Organize esta transcrição em tópicos cronológicos seguindo o formato especificado.`;

    console.log('🤖 Calling Claude Sonnet 4.5 to process transcript...');

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
    }

    const anthropicData = await anthropicResponse.json();
    const processedText = anthropicData.content[0].text;

    console.log('✅ Processed transcript into topics');

    // Update transcript with processed text
    const { error: updateError } = await supabase
      .from('j_ads_optimization_transcripts')
      .update({ processed_text: processedText })
      .eq('recording_id', recording_id);

    if (updateError) {
      console.error('Failed to update transcript:', updateError);
      throw updateError;
    }

    // Update recording status to completed
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ transcription_status: 'completed' })
      .eq('id', recording_id);

    console.log('✅ Transcript processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        processed_text: processedText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-transcript:', error);
    
    // Update status to completed (raw transcript is still OK)
    const { recording_id } = await req.json().catch(() => ({}));
    if (recording_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('j_ads_optimization_recordings')
        .update({ transcription_status: 'completed' })
        .eq('id', recording_id);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
