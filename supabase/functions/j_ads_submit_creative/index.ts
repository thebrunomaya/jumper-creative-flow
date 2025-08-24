import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types - inline para evitar problemas de import
interface CreativeSubmissionData {
  client: string;
  managerId?: string;
  partner: string;
  platform: string;
  campaignObjective?: string;
  creativeType?: string;
  objective?: string;
  creativeName: string;
  mainTexts: string[];
  titles: string[];
  description: string;
  destination?: string;
  cta?: string;
  destinationUrl: string;
  callToAction: string;
  observations: string;
  existingPost?: {
    instagramUrl: string;
    valid: boolean;
  };
  filesInfo: Array<{
    name: string;
    type: string;
    size: number;
    format?: string;
    variationIndex?: number;
    base64Data?: string;
    url?: string;
    instagramUrl?: string;
  }>;
}

interface CreativeResult {
  creativeId: string;
  notionPageId: string;
  variationIndex: number;
  fullCreativeName: string;
}

// Utility functions - inline
const generateUniqueId = () => {
  return crypto.randomUUID();
};

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
    console.log('🚀 J_ADS Submit Creative function started');

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables and initialize Supabase client FIRST
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // First authenticate user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Authenticated user: ${user.email} (${user.id})`);

    // Now create service client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase client initialized successfully');

    // Parse request body
    const body = await req.json();
    console.log('📥 Received request body:', JSON.stringify(body, null, 2));

    const creativeData: CreativeSubmissionData = body;

    console.log('📋 Processing creative submission for user:', user.email);

    // Get or generate submission ID
    const existingSubmissionId = body.submissionId as string | undefined;
    const submissionId = existingSubmissionId || generateUniqueId();
    console.log('🆔 Submission ID:', submissionId, existingSubmissionId ? '(updating existing)' : '(creating new)');

    // Process files (simplified - just store file info for now)
    const processedFiles: any[] = [];
    
    if (creativeData.filesInfo && creativeData.filesInfo.length > 0) {
      console.log(`📁 Processing ${creativeData.filesInfo.length} files...`);
      
      for (let i = 0; i < creativeData.filesInfo.length; i++) {
        const fileInfo = creativeData.filesInfo[i];
        
        // For now, just log the file info (actual upload would happen here)
        console.log(`📄 File ${i + 1}: ${fileInfo.name} (${fileInfo.type}, ${fileInfo.size} bytes)`);
        
        processedFiles.push({
          submission_id: submissionId,
          variation_index: fileInfo.variationIndex || 0,
          file_name: fileInfo.name,
          file_type: fileInfo.type,
          file_size: fileInfo.size,
          file_path: `pending-upload/${submissionId}/${fileInfo.name}`, // Placeholder
          created_at: new Date().toISOString()
        });
      }
    }

    // Create submission record
    console.log('💾 Creating submission record...');
    
    // Minimal submission data - use only essential fields  
    const submissionData = {
      id: submissionId,
      user_id: user.id, // ✅ CORREÇÃO CRÍTICA: Usar sempre o user.id do JWT
      manager_id: null, // ✅ manager_id fica null até a publicação no Notion
      client: creativeData.client, // ✅ CORREÇÃO: Campo client principal
      partner: creativeData.partner,
      platform: creativeData.platform,
      creative_type: creativeData.creativeType,
      campaign_objective: creativeData.campaignObjective,
      status: 'pending', // Set correct status for submitted creatives
      payload: {
        ...creativeData,
        managerEmail: user.email, // ✅ Bridge field para conversão futura
        managerUserId: user.id,   // ✅ Rastreabilidade
      },
      result: {
        submissionId,
        status: 'submitted', 
        message: 'Creative submitted successfully for review',
        timestamp: new Date().toISOString(),
        // Store all creative data in result JSON field
        creative: {
          name: creativeData.creativeName || 'Unnamed Creative',
          client: creativeData.client || 'Unknown Client',
          managerEmail: user.email, // ✅ Usar email do usuário autenticado
          texts: creativeData.mainTexts || [],
          titles: creativeData.titles || [],
          description: creativeData.description || '',
          cta: creativeData.callToAction || '',
          url: creativeData.destinationUrl || '',
          files: creativeData.filesInfo?.length || 0
        }
      }
    };

    let submission;
    let submissionError;
    
    if (existingSubmissionId) {
      // Update existing draft to submitted
      console.log('📝 Updating existing submission:', existingSubmissionId);
      const { data, error } = await supabase
        .from('j_ads_creative_submissions')
        .update({
          ...submissionData,
          status: 'pending', // Change from draft to pending
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubmissionId)
        .eq('user_id', user.id) // Security: only update own submissions
        .select()
        .single();
      submission = data;
      submissionError = error;
    } else {
      // Create new submission
      console.log('🆕 Creating new submission');
      const { data, error } = await supabase
        .from('j_ads_creative_submissions')
        .insert(submissionData)
        .select()
        .single();
      submission = data;
      submissionError = error;
    }

    if (submissionError) {
      console.error('❌ Failed to create submission:', submissionError);
      throw new Error(`Failed to create submission: ${submissionError.message}`);
    }

    console.log('✅ Submission created successfully:', submission.id);

    // Insert file records if any
    if (processedFiles.length > 0) {
      console.log('📁 Creating file records...');
      
      const { error: filesError } = await supabase
        .from('j_ads_creative_files')
        .insert(processedFiles);

      if (filesError) {
        console.warn('⚠️ Warning: Failed to create some file records:', filesError);
        // Don't throw - submission was successful, file records are secondary
      } else {
        console.log(`✅ Created ${processedFiles.length} file records`);
      }
    }

    // Return success response
    const response = {
      success: true,
      submissionId: submission.id,
      status: 'submitted',
      message: 'Creative submitted successfully for review by Admin/Manager',
      filesProcessed: processedFiles.length,
      timestamp: new Date().toISOString()
    };

    console.log('🎉 J_ADS Submit Creative function completed successfully');
    console.log('📤 Returning response:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ J_ADS Submit Creative function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})