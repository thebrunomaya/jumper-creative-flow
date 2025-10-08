import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

// Helper to generate account context from Notion data
function generateAccountContext(accountData: any): string {
  const parts: string[] = [];

  if (accountData['Quais são os produtos/serviços que deseja divulgar?']) {
    const produtos = accountData['Quais são os produtos/serviços que deseja divulgar?'];
    parts.push(`Produtos: ${produtos.substring(0, 100)}`);
  }

  if (accountData['Quem é o cliente ideal? (Persona)']) {
    const persona = accountData['Quem é o cliente ideal? (Persona)'];
    parts.push(`Persona: ${persona.substring(0, 100)}`);
  }

  if (accountData['Ticket médio atual (valor médio por venda ou contrato).']) {
    parts.push(`Ticket: ${accountData['Ticket médio atual (valor médio por venda ou contrato).']}`);
  }

  if (accountData['Seus principais diferenciais competitivos.']) {
    const dif = accountData['Seus principais diferenciais competitivos.'];
    parts.push(`Diferenciais: ${dif.substring(0, 80)}`);
  }

  if (accountData['Quais são as maiores dores e objeções desses clientes?']) {
    const dores = accountData['Quais são as maiores dores e objeções desses clientes?'];
    parts.push(`Dores: ${dores.substring(0, 80)}`);
  }

  return parts.join(', ').substring(0, 500);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let reqRecordingId: string | null = null;

  try {
    const body = await req.json();
    const { recording_id } = body;
    reqRecordingId = recording_id ?? null;
    
    if (!recording_id) {
      throw new Error('recording_id is required');
    }

    console.log('🎙️ Starting transcription for recording:', recording_id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get recording details
    const { data: recording, error: recordingError } = await supabase
      .from('j_ads_optimization_recordings')
      .select('*')
      .eq('id', recording_id)
      .single();

    if (recordingError || !recording) {
      throw new Error(`Recording not found: ${recordingError?.message}`);
    }

    console.log('✅ Recording found:', recording.audio_file_path);

    // 1.5. Build account context - Priority: override_context > Notion > auto-generated
    let accountContextFinal = '';
    let accountName = 'Conta não identificada';

    // Priority 1: Check if user edited context for this recording
    if (recording.override_context) {
      accountContextFinal = recording.override_context;
      console.log('📝 Using override context from user');
    }

    // Fetch Notion account data for name and context
    const { data: accountData } = await supabase
      .from('j_ads_notion_db_accounts')
      .select('*')
      .eq('notion_id', recording.account_id)
      .maybeSingle();

    if (accountData) {
      // Extract account name (always needed for prompt)
      accountName = accountData.Conta || accountName;

      // If no override context, get from Notion
      if (!recording.override_context) {
        // Priority 2: Use dedicated "Contexto para Otimização" column
        if (accountData['Contexto para Otimização']) {
          accountContextFinal = accountData['Contexto para Otimização'];
          console.log('📝 Using context from Notion (dedicated column)');
        } else {
          // Priority 3: Generate automatically from existing fields
          accountContextFinal = generateAccountContext(accountData);
          console.log('📝 Using auto-generated context from Notion fields');
        }
      }
    }

    // 2. Update status to processing
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ transcription_status: 'processing' })
      .eq('id', recording_id);

    // 3. Download audio from storage
    const filePath = recording.audio_file_path as string; // Path relative to bucket root (may include nested folder "optimizations/")
    console.log('📥 Downloading from bucket: optimizations, path:', filePath);
    
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('optimizations')
      .download(filePath);

    if (downloadError || !audioData) {
      console.error('❌ Download error:', downloadError);
      throw new Error(`Failed to download audio: ${downloadError?.message || 'No data returned'}`);
    }

    console.log('✅ Audio downloaded, size:', audioData.size, 'bytes');

    // 4. Fetch custom transcription prompts based on platform & objectives
    let customPrompts = '';
    if (recording.platform && recording.selected_objectives && recording.selected_objectives.length > 0) {
      const { data: prompts } = await supabase
        .from('j_ads_optimization_prompts')
        .select('prompt_text')
        .eq('platform', recording.platform)
        .in('objective', recording.selected_objectives)
        .eq('prompt_type', 'transcription');
      
      if (prompts && prompts.length > 0) {
        customPrompts = prompts.map(p => p.prompt_text).join('\n');
        console.log('📝 Using custom transcription prompts');
      }
    }

    // 5. Build optimized Whisper prompt (max ~1000 chars)
    const platformName = recording.platform === 'google' ? 'Google Ads' : 'Meta Ads';

    // Platform-specific terms (only English/technical terms)
    const platformTerms = recording.platform === 'google'
      ? 'Performance Max, pMax, landing page'
      : 'pixel, remarketing, lookalike, feed, stories, reels, CBO, landing page';

    // Build minimal prompt with essential context
    let finalPrompt = `Transcrição de análise de tráfego pago (media buying) em português brasileiro.

Conta: ${accountName}
Plataforma: ${platformName}

Siglas de métricas: ROAS, CPA, CTR, CPM, CPC, CVR, CPL, AOV, LTV, MER.

Termos técnicos: ${platformTerms}.`;

    // Add context if available (with size control)
    if (customPrompts) {
      // Replace {context} variable in custom prompts
      const renderedPrompts = customPrompts.replace(/{context}/g, accountContextFinal || '');
      const contextSection = `\n\n${renderedPrompts}`;

      // Control total size (~1000 chars max)
      if ((finalPrompt.length + contextSection.length) <= 1000) {
        finalPrompt += contextSection;
      } else {
        // Truncate context to fit
        const availableSpace = 1000 - finalPrompt.length - 12; // Reserve for "\n\nContexto: "
        if (availableSpace > 50) {
          finalPrompt += `\n\nContexto: ${renderedPrompts.substring(0, availableSpace)}`;
        }
      }
    } else if (accountContextFinal) {
      const contextSection = `\n\nContexto: ${accountContextFinal}`;

      // Control total size (~1000 chars max)
      if ((finalPrompt.length + contextSection.length) <= 1000) {
        finalPrompt += contextSection;
      } else {
        // Truncate context to fit
        const availableSpace = 1000 - finalPrompt.length - 12; // Reserve for "\n\nContexto: "
        if (availableSpace > 50) {
          finalPrompt += `\n\nContexto: ${accountContextFinal.substring(0, availableSpace)}`;
        }
      }
    }

    console.log('🎯 Prompt final para Whisper:', finalPrompt);
    console.log('📏 Tamanho do prompt:', finalPrompt.length, 'caracteres');

    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json'); // Get segments with timestamps
    formData.append('prompt', finalPrompt);

    console.log('🔄 Sending to OpenAI Whisper...');

    // 5. Call OpenAI Whisper API
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${whisperResponse.status} - ${errorText}`);
    }

    const transcription = await whisperResponse.json();
    
    console.log('✅ Transcription completed');
    console.log('📝 Text length:', transcription.text?.length || 0);
    console.log('🔢 Segments:', transcription.segments?.length || 0);


    // 7. Process transcription into organized topics using Claude Sonnet 4.5
    console.log('📝 Processing transcription into topics with Claude Sonnet 4.5...');
    
    let processedText = null;
    try {
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!anthropicKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      const systemPrompt = 'Você é um assistente especializado em organizar transcrições de análises de tráfego pago (media buying) em relatórios estruturados e contextualizados.';

      const userPrompt = `Organize a seguinte transcrição de otimização em um relatório estruturado com markdown.

## Contexto da Conta
- **Conta:** ${accountName}
- **Plataforma:** ${platformName}
- **Gestor:** ${accountData?.Gestor || 'Não informado'}
- **Gerente:** ${accountData?.Gerente || 'Não informado'}
- **Parceiro:** ${accountData?.Parceiro || 'Não informado'}
- **Objetivos:** ${recording.selected_objectives?.join(', ') || 'Não especificado'}
- **Data:** ${new Date(recording.recorded_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
- **Gravado por:** ${recording.recorded_by}

${accountContextFinal ? `## Sobre a Conta\n${accountContextFinal}\n\n` : ''}## Transcrição
${transcription.text}

---
Organize as otimizações em tópicos claros, destacando métricas, ações tomadas e próximos passos.`;

      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (claudeResponse.ok) {
        const claudeData = await claudeResponse.json();
        processedText = claudeData.content[0]?.text || null;
        console.log('✅ Transcription processed into topics');
      } else {
        const errorText = await claudeResponse.text();
        console.warn('⚠️ Failed to process transcription into topics:', errorText);
      }
    } catch (processError) {
      console.warn('⚠️ Error processing transcription:', processError);
      // Continue without processed text
    }

    // 8. Store transcription in database (both raw and processed)
    const { error: insertError } = await supabase
      .from('j_ads_optimization_transcripts')
      .insert({
        recording_id,
        full_text: transcription.text,
        processed_text: processedText,
        original_text: transcription.text,
        language: transcription.language || 'pt',
        confidence_score: null,
        segments: transcription.segments || null,
        revised_at: null,
        revised_by: null,
      });

    if (insertError) {
      throw new Error(`Failed to save transcript: ${insertError.message}`);
    }

    // 9. Update recording status to completed (analysis remains 'pending')
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ 
        transcription_status: 'completed',
        analysis_status: 'pending' // User will manually trigger analysis
      })
      .eq('id', recording_id);

    console.log('✅ Transcription saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        text: transcription.text,
        language: transcription.language,
        segments: transcription.segments?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Transcription error:', error);

    // Try to update status to failed if we have recording_id
    try {
      if (reqRecordingId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('j_ads_optimization_recordings')
          .update({ transcription_status: 'failed' })
          .eq('id', reqRecordingId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
