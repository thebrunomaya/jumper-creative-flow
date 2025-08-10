import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FileInfo = {
  name: string;
  type: string;
  size: number;
  format?: string;
  variationIndex?: number;
  base64Data?: string;
  instagramUrl?: string;
};

type SubmissionBody = {
  client?: string;
  managerId?: string;
  partner?: string;
  platform?: string;
  campaignObjective?: string;
  creativeName?: string;
  creativeType?: string;
  objective?: string;
  mainTexts?: string[];
  titles?: string[];
  description?: string;
  destination?: string;
  cta?: string;
  destinationUrl?: string;
  callToAction?: string;
  observations?: string;
  existingPost?: any;
  filesInfo: FileInfo[];
};

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
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const pseudoUserId = crypto.randomUUID();

    const body = (await req.json()) as SubmissionBody;
    const filesInfo: FileInfo[] = Array.isArray(body.filesInfo) ? body.filesInfo : [];

    const variationSet = new Set<number>();
    for (const f of filesInfo) {
      if (f.variationIndex && Number.isFinite(f.variationIndex)) variationSet.add(f.variationIndex);
    }
    const totalVariations = variationSet.size > 0 ? variationSet.size : 1;

    const sanitizedFilesInfo = filesInfo.map(({ base64Data, ...rest }) => rest);

    // Insert submission row
    const { data: insertSubmission, error: insertErr } = await supabase
      .from("creative_submissions")
      .insert({
        user_id: pseudoUserId,
        manager_id: body.managerId ?? null,
        client: body.client ?? null,
        partner: body.partner ?? null,
        platform: body.platform ?? null,
        creative_type: body.creativeType ?? null,
        campaign_objective: body.campaignObjective ?? null,
        total_variations: totalVariations,
        payload: { ...body, filesInfo: sanitizedFilesInfo },
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr || !insertSubmission) {
      console.error("DB insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Falha ao salvar submissão" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submissionId = insertSubmission.id as string;

    // Upload files and register rows
    let uploadedCount = 0;
    for (const file of filesInfo) {
      const variationIndex = file.variationIndex || 1;

      if (file.base64Data) {
        try {
          const byteCharacters = atob(file.base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const fileNameSafe = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9_.-]/g, "_");
          const storagePath = `submissions/${submissionId}/var-${variationIndex}/${fileNameSafe}`;

          const { error: upErr } = await supabase.storage
            .from("creative-files")
            .upload(storagePath, byteArray, { contentType: file.type });

          if (upErr) {
            console.error("Upload error for", file.name, upErr);
          }

          const { data: pub } = supabase.storage
            .from("creative-files")
            .getPublicUrl(storagePath);

          const publicUrl = pub?.publicUrl ?? null;

          await supabase.from("creative_files").insert({
            submission_id: submissionId,
            variation_index: variationIndex,
            name: file.name,
            type: file.type,
            size: file.size,
            format: file.format ?? null,
            instagram_url: null,
            storage_path: storagePath,
            public_url: publicUrl,
          });

          uploadedCount++;
        } catch (e) {
          console.error("Failed processing file:", file.name, e);
        }
      } else if (file.instagramUrl) {
        await supabase.from("creative_files").insert({
          submission_id: submissionId,
          variation_index: variationIndex,
          name: file.name ?? "Instagram Post",
          type: file.type ?? "existing-post",
          size: file.size ?? 0,
          format: file.format ?? null,
          instagram_url: file.instagramUrl,
          storage_path: null,
          public_url: null,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        submissionId,
        totalFiles: uploadedCount,
        totalVariations,
        message: "Submissão salva. Processaremos posteriormente.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unhandled error on ingest-creative:", e);
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
