import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CreativeSubmissionData } from './types.ts';
import { uploadFileToSupabase } from './file-upload.ts';
import { performHealthCheck } from './resilience-utils.ts';
import { uploadFilesTransactionally, cleanupOldTransactions } from './transactional-upload.ts';

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

    // Perform health check before processing
    console.log('🔍 Performing system health check...');
    const healthStatus = await performHealthCheck();
    console.log('📊 Health check results:', healthStatus);
    
    if (!healthStatus.overall) {
      console.warn('⚠️ System health check failed, but continuing with degraded mode');
    }
    
    // Cleanup old orphaned transactions
    await cleanupOldTransactions(supabase);

    // Get environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const body = await req.json();
    console.log('📥 Received request body:', JSON.stringify(body, null, 2));

    const creativeData: CreativeSubmissionData = body;

    // Resolve manager ID if needed (convert Supabase user ID to Notion ID)
    if (creativeData.managerId) {
      console.log('🔍 Original manager ID received:', creativeData.managerId);
      
      // First, try to get user email from auth.users using the managerId (Supabase user ID)
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(creativeData.managerId);
      
      if (authUser?.user?.email) {
        console.log(`📧 Found user email: ${authUser.user.email} for user ID: ${creativeData.managerId}`);
        
        // Use email to find corresponding manager in j_ads_notion_managers
        const { data: managerData, error: managerError } = await supabase
          .from('j_ads_notion_managers')
          .select('notion_id, name, email')
          .eq('email', authUser.user.email)
          .single();

        if (managerData) {
          console.log(`✅ Bridge successful! Email ${authUser.user.email} -> Notion ID: ${managerData.notion_id} (${managerData.name})`);
          creativeData.managerId = managerData.notion_id;
        } else {
          console.warn(`⚠️ No manager found in j_ads_notion_managers for email: ${authUser.user.email}. Will proceed without manager.`);
          creativeData.managerId = undefined;
        }
      } else {
        // Fallback: try to find by notion_id directly (in case frontend already sends Notion ID)
        const { data: notionManagerData, error: notionError } = await supabase
          .from('j_ads_notion_managers')
          .select('notion_id, name')
          .eq('notion_id', creativeData.managerId)
          .single();

        if (notionManagerData) {
          console.log(`✅ Manager ID is already a valid Notion ID: ${creativeData.managerId} (${notionManagerData.name})`);
        } else {
          console.warn(`⚠️ Could not resolve manager ID ${creativeData.managerId}. Auth error: ${authError?.message}. Will proceed without manager.`);
          creativeData.managerId = undefined;
        }
      }
    }


    console.log('📋 Processing creative submission for manager approval');
    console.log('📋 Full creative data received:', JSON.stringify({
      ...creativeData,
      filesInfo: creativeData.filesInfo.map(f => ({ ...f, base64Data: f.base64Data ? '[TRUNCATED]' : undefined }))
    }, null, 2));

    // Group files by variation index
    const variationGroups = new Map<number, Array<{ name: string; type: string; size: number; format?: string; base64Data?: string; instagramUrl?: string }>>();

    for (const fileInfo of creativeData.filesInfo) {
      const variationIndex = fileInfo.variationIndex ?? 0;
      if (!variationGroups.has(variationIndex)) {
        variationGroups.set(variationIndex, []);
      }
      variationGroups.get(variationIndex)!.push(fileInfo);
    }

    console.log(`📁 Processing ${variationGroups.size} variation(s) for submission`);

    const results = [];

    // Process each variation - ONLY upload files and save to Supabase
    for (const [variationIndex, files] of variationGroups) {
      console.log(`🔄 Processing variation ${variationIndex} with ${files.length} files`);

      // Upload files to Supabase Storage using transactional upload
      console.log(`📤 Starting transactional upload for variation ${variationIndex}`);
      
      const uploadResult = await uploadFilesTransactionally(files, supabase);
      
      if (!uploadResult.success) {
        console.error(`❌ Transactional upload failed for variation ${variationIndex}:`, uploadResult.error);
        throw new Error(`File upload failed for variation ${variationIndex}: ${uploadResult.error?.message}`);
      }
      
      const uploadedFiles = uploadResult.files;
      console.log(`✅ All files uploaded successfully for variation ${variationIndex} (transaction: ${uploadResult.transactionId})`);
      
      // Create submission record in Supabase with 'submitted' status
      const submissionData = {
        client: creativeData.client,
        manager_user_id: creativeData.managerUserId,
        manager_email: creativeData.managerEmail,
        partner: creativeData.partner,
        platform: creativeData.platform,
        campaign_objective: creativeData.campaignObjective,
        creative_name: creativeData.creativeName,
        creative_type: creativeData.creativeType,
        objective: creativeData.objective,
        main_texts: creativeData.mainTexts,
        titles: creativeData.titles,
        description: creativeData.description,
        destination: creativeData.destination,
        cta: creativeData.cta,
        destination_url: creativeData.destinationUrl,
        call_to_action: creativeData.callToAction,
        observations: creativeData.observations,
        existing_post: creativeData.existingPost,
        status: 'submitted', // Changed from 'processed' to 'submitted'
        submitted_at: new Date().toISOString(),
        variation_index: variationIndex,
        total_variations: variationGroups.size
      };

      const { data: submission, error: submissionError } = await supabase
        .from('j_ads_creative_submissions')
        .insert(submissionData)
        .select('id')
        .single();

      if (submissionError) {
        console.error(`❌ Failed to create submission for variation ${variationIndex}:`, submissionError);
        throw new Error(`Failed to create submission: ${submissionError.message}`);
      }

      const submissionId = submission.id;
      console.log(`✅ Created submission ${submissionId} for variation ${variationIndex}`);

      // Create file records
      const fileRecords = uploadedFiles.map(file => ({
        submission_id: submissionId,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size || 0,
        file_url: file.url,
        format: file.format,
        variation_index: variationIndex
      }));

      const { error: filesError } = await supabase
        .from('j_ads_creative_files')
        .insert(fileRecords);

      if (filesError) {
        console.warn(`⚠️ Failed to create file records for ${submissionId}:`, filesError);
      } else {
        console.log(`✅ Created ${fileRecords.length} file records for ${submissionId}`);
      }

      results.push({
        creativeId: submissionId,
        submissionId: submissionId,
        variationIndex,
        status: 'submitted',
        totalFiles: uploadedFiles.length
      });
    }

    console.log(`🎉 Successfully submitted ${results.length} creative variation(s) for admin review`);

    // Prepare response for manager
    const response = {
      success: true,
      message: `Successfully submitted ${results.length} creative variation(s) for review`,
      submissionId: results[0]?.submissionId,
      results: results,
      status: 'submitted'
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ J_ADS Submit Creative function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})