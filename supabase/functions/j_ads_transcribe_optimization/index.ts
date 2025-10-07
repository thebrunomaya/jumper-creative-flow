import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

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

    // 4. Convert blob to file for OpenAI
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json'); // Get segments with timestamps

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

    // 6. Store transcription in database
    const { error: insertError } = await supabase
      .from('j_ads_optimization_transcripts')
      .insert({
        recording_id,
        full_text: transcription.text,
        language: transcription.language || 'pt',
        confidence_score: null, // Whisper doesn't provide overall confidence
        segments: transcription.segments || null,
      });

    if (insertError) {
      throw new Error(`Failed to save transcript: ${insertError.message}`);
    }

    // 7. Update recording status to completed
    await supabase
      .from('j_ads_optimization_recordings')
      .update({ 
        transcription_status: 'completed',
        analysis_status: 'pending' // Ready for AI analysis next
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
