import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helpers to read Notion properties safely
function getText(prop: any): string {
  if (!prop) return "";
  if (prop.title?.length) return prop.title.map((t: any) => t.plain_text).join("");
  if (prop.rich_text?.length) return prop.rich_text.map((t: any) => t.plain_text).join("");
  if (typeof prop.email === "string") return prop.email;
  if (typeof prop.plain_text === "string") return prop.plain_text;
  return "";
}

function getRoles(prop: any): string[] {
  // Try multi_select first
  if (prop?.multi_select && Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((o: any) => String(o.name || "")).filter(Boolean);
  }
  // Try select
  if (prop?.select?.name) return [String(prop.select.name)];
  // Fallback to text
  const txt = getText(prop);
  return txt ? txt.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const NOTION_TOKEN = Deno.env.get("NOTION_API_KEY");
  // Notion DB for managers (same used in notion-managers)
  const DB_GERENTES_ID = "213db60949688003bd2dec32494bb87c";

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!NOTION_TOKEN) {
    return new Response(JSON.stringify({ error: "NOTION_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";
    const submissionId = body?.submissionId as string | undefined;

    // JWT-based authentication and role check (admin)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: isAdmin, error: roleErr } = await adminClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use admin client for privileged operations
    const supabase = adminClient;

    // Helper to fetch a public file URL and return base64 contents
    async function fetchBase64(url: string): Promise<{ base64: string; contentType?: string }> {
      console.log(`📥 Downloading file: ${url}`);
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha ao baixar arquivo (${res.status})`);
      
      const contentType = res.headers.get("content-type") || undefined;
      const contentLength = res.headers.get("content-length");
      
      // File size limit (50MB) 
      if (contentLength && parseInt(contentLength) > 52428800) {
        throw new Error(`Arquivo muito grande: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB. Limite: 50MB`);
      }
      
      console.log(`📊 File size: ${contentLength ? Math.round(parseInt(contentLength) / 1024 / 1024) : '?'}MB`);
      
      // Use the most memory-efficient approach
      const arrayBuffer = await res.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert directly to base64
      let binary = '';
      const chunkSize = 1024; // 1KB chunks to reduce memory pressure
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64 = btoa(binary);
      console.log(`✅ File converted to base64`);
      
      // Clear references to help GC
      binary = '';
      
      return { base64, contentType };
    }

    if (action === "queue") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate submission is not a draft
      const { data: submission, error: fetchErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("id, status, payload")
        .eq("id", submissionId)
        .maybeSingle();

      if (fetchErr || !submission) {
        return new Response(JSON.stringify({ error: "Submissão não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (submission.status === "draft") {
        return new Response(JSON.stringify({ error: "Não é possível enfileirar rascunhos. Complete o criativo primeiro." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("j_ads_creative_submissions")
        .update({ status: "queued" })
        .eq("id", submissionId)
        .select("id, status")
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, updated: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "publish") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate submission completeness before publishing
      const { data: submission, error: fetchErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("id, status, payload, creative_type")
        .eq("id", submissionId)
        .maybeSingle();

      if (fetchErr || !submission) {
        return new Response(JSON.stringify({ error: "Submissão não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (submission.status === "draft") {
        return new Response(JSON.stringify({ error: "Não é possível publicar rascunhos. Complete o criativo primeiro." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate required fields
      const payload = submission.payload || {};
      const requiredFields = ['creativeName', 'client', 'platform', 'campaignObjective'];
      const missingFields = requiredFields.filter(field => !payload[field]);
      
      if (missingFields.length > 0) {
        return new Response(JSON.stringify({ 
          error: `Campos obrigatórios em falta: ${missingFields.join(', ')}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate that submission has files or existing post
      const { data: files, error: filesErr } = await supabase
        .from("j_ads_creative_files")
        .select("id")
        .eq("submission_id", submissionId)
        .limit(1);

      if (filesErr) {
        return new Response(JSON.stringify({ error: "Erro ao verificar arquivos" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hasFiles = files && files.length > 0;
      const hasExistingPost = submission.creative_type === 'existing-post' && payload.existingPost;

      if (!hasFiles && !hasExistingPost) {
        return new Response(JSON.stringify({ 
          error: "Criativo incompleto: adicione arquivos ou uma URL de post existente" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update status to "processing" immediately
      await supabase
        .from("j_ads_creative_submissions")
        .update({ status: "processing" })
        .eq("id", submissionId);

      // Start background processing without waiting
      EdgeRuntime.waitUntil(processSubmissionInBackground(submissionId, supabase, fetchBase64));

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Publicação iniciada em background. Verifique o status em alguns minutos." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Background processing function
    async function processSubmissionInBackground(submissionId: string, supabase: any, fetchBase64: any) {
      try {
        console.log(`🚀 Starting background processing for submission ${submissionId}`);
        
        // Load submission
        const { data: submission, error: subErr } = await supabase
          .from("j_ads_creative_submissions")
          .select("id, payload, total_variations, status")
          .eq("id", submissionId)
          .maybeSingle();

        if (subErr || !submission) {
          throw new Error(subErr?.message || "Submissão não encontrada");
        }

        // Load files for this submission
        const { data: files, error: filesErr } = await supabase
          .from("j_ads_creative_files")
          .select("name, type, size, format, variation_index, public_url")
          .eq("submission_id", submissionId)
          .order("variation_index", { ascending: true });

        if (filesErr) throw new Error(filesErr.message);

        console.log(`📁 Processing ${files?.length || 0} files for submission ${submissionId}`);

        // Process files in smaller batches to avoid memory issues
        const filesInfo: Array<{ name: string; type: string; size: number; variationIndex: number; base64Data: string; format?: string }> = [];
        
        for (const f of files || []) {
          if (!f.public_url) {
            console.log(`⚠️ Skipping file ${f.name} - no public URL`);
            continue;
          }
          
          try {
            console.log(`📥 Processing file: ${f.name} (${Math.round((f.size || 0) / 1024 / 1024)}MB)`);
            
            // Check file size before processing
            if (f.size && f.size > 50 * 1024 * 1024) { // 50MB limit
              throw new Error(`Arquivo ${f.name} muito grande: ${Math.round(f.size / 1024 / 1024)}MB. Limite: 50MB`);
            }
            
            const { base64, contentType } = await fetchBase64(f.public_url);
            filesInfo.push({
              name: f.name || "file",
              type: f.type || contentType || "application/octet-stream",
              size: f.size || 0,
              variationIndex: (f.variation_index as number) || 1,
              base64Data: base64,
              format: f.format || undefined,
            });
            console.log(`✅ File processed: ${f.name}`);
            
            // Force garbage collection after each file
            if (globalThis.gc) globalThis.gc();
            
          } catch (fileError) {
            console.error(`❌ Failed to process file ${f.name}:`, fileError);
            throw new Error(`Erro ao processar arquivo ${f.name}: ${fileError.message}`);
          }
        }

        // Determine manager Notion ID to send to submit-creative
        let managerNotionId: string | null = null;
        const managerEmail = submission?.payload?.managerEmail as string;
        
        if (managerEmail && NOTION_TOKEN) {
          try {
            const managerRes = await fetch(`https://api.notion.com/v1/databases/${DB_GERENTES_ID}/query`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${NOTION_TOKEN}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28",
              },
              body: JSON.stringify({
                filter: {
                  property: "E-mail",
                  email: { equals: managerEmail }
                }
              }),
            });

            if (managerRes.ok) {
              const managerData = await managerRes.json();
              if (managerData.results && managerData.results.length > 0) {
                managerNotionId = managerData.results[0].id;
              }
            }
          } catch (e) {
            console.error("Error getting manager notion ID:", e);
          }
        }

        // Prepare creative data for submit-creative with corrected manager ID
        const creativeData = {
          ...(submission.payload || {}),
          filesInfo,
          ...(managerNotionId && { managerId: managerNotionId }),
        };

        console.log(`📤 Invoking submit-creative function...`);

        // Invoke j_ads_submit_creative function
        const { data: submitRes, error: submitErr } = await supabase.functions.invoke("j_ads_submit_creative", {
          body: creativeData,
        });

        // Enhanced error handling
        if (submitErr) {
          console.error(`❌ Submit-creative function error:`, submitErr);
          const errorMessage = `Submit-creative error: ${submitErr.message}`;
          await supabase
            .from("j_ads_creative_submissions")
            .update({ status: "error", error: errorMessage })
            .eq("id", submissionId);
          throw new Error(errorMessage);
        }
        
        if (!submitRes?.success) {
          console.error(`❌ Submit-creative failed:`, submitRes);
          const errorMessage = submitRes?.error || "Submit-creative function failed";
          await supabase
            .from("j_ads_creative_submissions")
            .update({ status: "error", error: errorMessage })
            .eq("id", submissionId);
          throw new Error(errorMessage);
        }

        // Upsert creative variations into DB for reference
        const variations = Array.isArray(submitRes?.createdCreatives) ? submitRes.createdCreatives : [];
        const ctaValue = submission?.payload?.cta || submission?.payload?.callToAction || null;
        
        if (variations.length > 0) {
          const rows = variations.map((v: any) => ({
            submission_id: submissionId,
            variation_index: v.variationIndex,
            notion_page_id: v.notionPageId,
            creative_id: v.creativeId,
            full_creative_name: v.fullCreativeName,
            cta: ctaValue,
            processed_at: new Date().toISOString(),
          }));
          
          const { error: upsertErr } = await supabase
            .from("j_ads_creative_variations")
            .upsert(rows, { onConflict: "submission_id,variation_index" });
            
          if (upsertErr) {
            console.error("Failed to upsert j_ads_creative_variations:", upsertErr);
          }
        }

        await supabase
          .from("j_ads_creative_submissions")
          .update({ 
            status: "processed", 
            result: submitRes, 
            processed_at: new Date().toISOString() 
          })
          .eq("id", submissionId);

        console.log(`🎉 Background processing completed successfully for submission ${submissionId}`);

      } catch (e: any) {
        console.error(`❌ Background processing failed for submission ${submissionId}:`, e);
        const msg = e?.message || "Erro inesperado ao publicar";
        await supabase
          .from("j_ads_creative_submissions")
          .update({ status: "error", error: msg })
          .eq("id", submissionId);
      }
    }

    if (action === "backfill_variations") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sub, error: subErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("id, result, payload")
        .eq("id", submissionId)
        .maybeSingle();

      if (subErr || !sub) {
        return new Response(JSON.stringify({ error: subErr?.message || "Submissão não encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const variations = Array.isArray(sub.result?.createdCreatives) ? sub.result.createdCreatives : [];
      const ctaValue = sub?.payload?.cta || sub?.payload?.callToAction || null;

      if (variations.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "Nada para backfill", count: 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rows = variations.map((v: any) => ({
        submission_id: submissionId,
        variation_index: v.variationIndex,
        notion_page_id: v.notionPageId,
        creative_id: v.creativeId,
        full_creative_name: v.fullCreativeName,
        cta: ctaValue,
        processed_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await supabase
        .from("j_ads_creative_variations")
        .upsert(rows, { onConflict: "submission_id,variation_index" });

      if (upsertErr) {
        return new Response(JSON.stringify({ success: false, error: upsertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, count: rows.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "backfill_all") {
      // Load many submissions and upsert all variations found in their result
      const { data: subs, error: listErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("id, result, payload")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (listErr) {
        return new Response(JSON.stringify({ error: listErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let count = 0;
      const batch: any[] = [];
      for (const s of subs || []) {
        const vars = Array.isArray(s.result?.createdCreatives) ? s.result.createdCreatives : [];
        const ctaValue = s?.payload?.cta || s?.payload?.callToAction || null;
        for (const v of vars) {
          batch.push({
            submission_id: s.id,
            variation_index: v.variationIndex,
            notion_page_id: v.notionPageId,
            creative_id: v.creativeId,
            full_creative_name: v.fullCreativeName,
            cta: ctaValue,
            processed_at: new Date().toISOString(),
          });
        }
      }

      if (batch.length > 0) {
        const { error: upsertErr } = await supabase
          .from("j_ads_creative_variations")
          .upsert(batch, { onConflict: "submission_id,variation_index" });
        if (upsertErr) {
          return new Response(JSON.stringify({ success: false, error: upsertErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        count = batch.length;
      }

      return new Response(JSON.stringify({ success: true, count }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getDetails") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get submission with all details
      const { data: submission, error: subErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("*")
        .eq("id", submissionId)
        .maybeSingle();

      if (subErr || !submission) {
        return new Response(JSON.stringify({ error: subErr?.message || "Submissão não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get files
      const { data: files, error: filesErr } = await supabase
        .from("j_ads_creative_files")
        .select("*")
        .eq("submission_id", submissionId)
        .order("variation_index", { ascending: true });

      if (filesErr) {
        console.error("Error fetching files:", filesErr);
      }

      // Get manager name from managerEmail in payload
      let managerName = "—";
      const managerEmail = submission?.payload?.managerEmail as string;
      
      if (managerEmail && NOTION_TOKEN) {
        try {
          const managerRes = await fetch(`https://api.notion.com/v1/databases/${DB_GERENTES_ID}/query`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${NOTION_TOKEN}`,
              "Content-Type": "application/json",
              "Notion-Version": "2022-06-28",
            },
            body: JSON.stringify({
              filter: {
                property: "E-mail",
                email: { equals: managerEmail },
              },
            }),
          });
          
          if (managerRes.ok) {
            const managerData = await managerRes.json();
            if (managerData.results && managerData.results.length > 0) {
              const manager = managerData.results[0];
              managerName = getText(manager.properties?.Name || manager.properties?.name) || "—";
            }
          }
        } catch (e) {
          console.error("Error fetching manager by email:", e);
        }
      }

      // Get client name directly from Notion page
      let clientName = submission.client || "—";
      if (submission.client && NOTION_TOKEN) {
        try {
          const clientRes = await fetch(`https://api.notion.com/v1/pages/${submission.client}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${NOTION_TOKEN}`,
              "Content-Type": "application/json",
              "Notion-Version": "2022-06-28",
            },
          });

          if (clientRes.ok) {
            const clientData = await clientRes.json();
            const title = clientData.properties?.Conta?.title?.[0]?.plain_text
              || clientData.properties?.Name?.title?.[0]?.plain_text
              || clientData.properties?.Nome?.title?.[0]?.plain_text
              || submission.client;
            clientName = title;
          }
        } catch (e) {
          console.error("Error fetching client name:", e);
        }
      }

        // Enrich submission data
        const enrichedSubmission = {
          ...submission,
          manager_name: managerName,
          client_name: clientName,
          files: files || []
        };

      return new Response(JSON.stringify({ success: true, submission: enrichedSubmission }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getSubmission") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: submission, error: subErr } = await supabase
        .from("j_ads_creative_submissions")
        .select("*")
        .eq("id", submissionId)
        .maybeSingle();

      if (subErr || !submission) {
        return new Response(JSON.stringify({ error: "Submissão não encontrada" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, item: submission }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "saveDraft") {
      const draft = body?.draft;
      if (!draft) {
        return new Response(JSON.stringify({ error: "draft data is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (submissionId) {
        // Update existing
        const { data, error } = await supabase
          .from("j_ads_creative_submissions")
          .update({ 
            payload: draft,
            status: "draft",
            updated_at: new Date().toISOString()
          })
          .eq("id", submissionId)
          .select("id")
          .maybeSingle();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          submissionId: data?.id,
          creativeName: draft.creativeName 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Create new
        const { data, error } = await supabase
          .from("j_ads_creative_submissions")
          .insert({
            user_id: user.id,
            payload: draft,
            status: "draft",
            client: draft.client,
            platform: draft.platform,
            campaign_objective: draft.campaignObjective,
            creative_type: draft.creativeType,
            manager_id: draft.managerId,
            partner: draft.partner,
            total_variations: draft.totalVariations || 1
          })
          .select("id")
          .maybeSingle();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          submissionId: data?.id,
          creativeName: draft.creativeName 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "deleteSubmission") {
      if (!submissionId) {
        return new Response(JSON.stringify({ error: "submissionId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get submission files to delete from storage
      const { data: files } = await supabase
        .from("j_ads_creative_files")
        .select("storage_path")
        .eq("submission_id", submissionId);

      // Delete files from storage
      if (files && files.length > 0) {
        const paths = files.map(f => f.storage_path).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from('creative-files').remove(paths);
        }
      }

      // Delete creative files records
      await supabase
        .from("j_ads_creative_files")
        .delete()
        .eq("submission_id", submissionId);

      // Delete creative variations
      await supabase
        .from("j_ads_creative_variations")
        .delete()
        .eq("submission_id", submissionId);

      // Delete submission
      const { error } = await supabase
        .from("j_ads_creative_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: listAll submissions (latest first)
    const { data: items, error: listErr2 } = await supabase
      .from("j_ads_creative_submissions")
      .select("id, client, manager_id, status, error, created_at, updated_at, payload")
      .order("created_at", { ascending: false })
      .limit(100);
    if (listErr2) {
      return new Response(JSON.stringify({ error: listErr2.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enrich client names from Notion (best-effort)
    const clientIds = Array.from(new Set((items || []).map((r: any) => r.client).filter(Boolean))).slice(0, 30);
    const clientMap: Record<string, string> = {};
    for (const clientId of clientIds) {
      try {
        const res = await fetch(`https://api.notion.com/v1/pages/${clientId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
        });
        if (res.ok) {
          const page = await res.json();
          const title = page.properties?.Conta?.title?.[0]?.plain_text
            || page.properties?.Name?.title?.[0]?.plain_text
            || page.properties?.Nome?.title?.[0]?.plain_text
            || null;
          if (title) clientMap[clientId as string] = title;
        }
      } catch (_) {
        // ignore enrichment failure
      }
    }

    // Enrich manager names from managerEmail in payload
    const managerEmails = Array.from(new Set((items || []).map((r: any) => r?.payload?.managerEmail).filter(Boolean))).slice(0, 50);
    const managerMap: Record<string, string> = {};
    
    for (const email of managerEmails) {
      try {
        const managerRes = await fetch(`https://api.notion.com/v1/databases/${DB_GERENTES_ID}/query`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({
            filter: {
              property: "E-mail",
              email: { equals: email },
            },
          }),
        });
        
        if (managerRes.ok) {
          const managerData = await managerRes.json();
          if (managerData.results?.[0]) {
            const manager = managerData.results[0];
            const name = getText(manager.properties?.Name || manager.properties?.name);
            if (name) managerMap[email] = name;
          }
        }
      } catch (_) {
        // ignore
      }
    }

    const enriched = (items || []).map((r: any) => ({ 
      ...r, 
      client_name: r.client ? clientMap[r.client] || null : null,
      manager_name: r?.payload?.managerEmail ? (managerMap[r.payload.managerEmail] || null) : null,
      creative_name: r?.payload?.managerInputName || r?.payload?.creativeName || null,
    }));

    return new Response(JSON.stringify({ success: true, items: enriched }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("j_ads_admin_actions error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
