import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to get file extension from filename or MIME type
function getFileExtension(fileName: string, mimeType: string): string {
  // If filename already has extension, keep it
  if (fileName && fileName.includes('.')) {
    const parts = fileName.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length > 0) {
      return `.${parts[parts.length - 1]}`;
    }
  }
  
  // Infer from MIME type
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/ogg': '.ogv',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/json': '.json',
    'application/octet-stream': '.bin'
  };
  
  return mimeToExt[mimeType] || '.bin';
}

type FileInfo = {
  name: string;
  type: string;
  size: number;
  format?: string;
  variationIndex?: number;
  base64Data?: string;
  url?: string;
  instagramUrl?: string;
};

type SubmissionBody = {
  client?: string;
  managerUserId?: string;
  managerEmail?: string;
  managerId?: string; // Legacy field
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
    // Require authenticated user (JWT)
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

    const userId = user.id;

    const body = (await req.json()) as SubmissionBody & { submissionId?: string };
    const submissionIdFromBody = body?.submissionId as string | undefined;
    const filesInfo: FileInfo[] = Array.isArray(body.filesInfo) ? body.filesInfo : [];

    const variationSet = new Set<number>();
    for (const f of filesInfo) {
      if (f.variationIndex && Number.isFinite(f.variationIndex)) variationSet.add(f.variationIndex);
    }
    const totalVariations = variationSet.size > 0 ? variationSet.size : 1;

    const sanitizedFilesInfo = filesInfo.map(({ base64Data, ...rest }) => rest);

    // Insert or update submission row
    let submissionId: string;

    if (submissionIdFromBody) {
      const { data: updated, error: updErr } = await supabase
        .from("j_ads_creative_submissions")
        .update({
          user_id: userId,
          manager_id: userId, // Always use JWT user ID
          client: body.client ?? null,
          partner: body.partner ?? null,
          platform: body.platform ?? null,
          creative_type: body.creativeType ?? null,
          campaign_objective: body.campaignObjective ?? null,
          total_variations: totalVariations,
          payload: { 
            ...body, 
            filesInfo: sanitizedFilesInfo,
            managerUserId: userId,
            managerEmail: user.email,
          },
          status: "pending",
        })
        .eq("id", submissionIdFromBody)
        .select("id")
        .single();

      if (updErr || !updated) {
        console.error("DB update error:", updErr);
        return new Response(JSON.stringify({ error: "Falha ao atualizar submissão" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      submissionId = updated.id as string;

      // Clear previous files for this submission
      await supabase.from("j_ads_creative_files").delete().eq("submission_id", submissionId);
    } else {
      const { data: insertSubmission, error: insertErr } = await supabase
        .from("j_ads_creative_submissions")
        .insert({
          user_id: userId,
          manager_id: userId, // Always use JWT user ID
          client: body.client ?? null,
          partner: body.partner ?? null,
          platform: body.platform ?? null,
          creative_type: body.creativeType ?? null,
          campaign_objective: body.campaignObjective ?? null,
          total_variations: totalVariations,
          payload: { 
            ...body, 
            filesInfo: sanitizedFilesInfo,
            managerUserId: userId,
            managerEmail: user.email,
          },
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

      submissionId = insertSubmission.id as string;
    }

    // Upload files and register rows
    let uploadedCount = 0;
    for (const file of filesInfo) {
      const variationIndex = file.variationIndex || 1;

      try {
        // Ensure filename has proper extension
        const originalName = file.name || 'file';
        const extension = getFileExtension(originalName, file.type);
        const baseFileName = originalName.includes('.') ? originalName.split('.')[0] : originalName;
        const sanitizedBaseName = baseFileName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const finalFileName = `${sanitizedBaseName}${extension}`;
        const fileNameSafe = `${Date.now()}-${finalFileName}`;
        const storagePath = `submissions/${submissionId}/var-${variationIndex}/${fileNameSafe}`;

        if (file.url) {
          // Try server-side copy within the same bucket first to avoid huge request bodies
          const match = file.url.match(/\/object\/public\/creative-files\/(.+)$/);
          if (match && match[1]) {
            const sourcePath = match[1];
            const { error: copyErr } = await supabase.storage
              .from("creative-files")
              .copy(sourcePath, storagePath);
            if (!copyErr) {
              const { data: pub } = supabase.storage.from("creative-files").getPublicUrl(storagePath);
              const publicUrl = pub?.publicUrl ?? null;

              await supabase.from("j_ads_creative_files").insert({
                submission_id: submissionId,
                variation_index: variationIndex,
                name: finalFileName,
                type: file.type,
                size: file.size,
                format: file.format ?? null,
                instagram_url: null,
                storage_path: storagePath,
                public_url: publicUrl,
              });
              uploadedCount++;
              continue;
            } else {
              console.error("Copy error for", file.name, sourcePath, "->", storagePath, copyErr);
              // Fallback to fetching the URL below
            }
          }

          // Fallback: download and re-upload (for external URLs)
          const res = await fetch(file.url);
          if (!res.ok) throw new Error(`Failed to fetch ${file.url}: ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();
          const { error: upErr } = await supabase.storage
            .from("creative-files")
            .upload(storagePath, new Uint8Array(arrayBuffer), { contentType: file.type });
          if (upErr) {
            console.error("Upload error (url) for", file.name, upErr);
            continue;
          }

          const { data: pub } = supabase.storage.from("creative-files").getPublicUrl(storagePath);
          const publicUrl = pub?.publicUrl ?? null;

          await supabase.from("j_ads_creative_files").insert({
            submission_id: submissionId,
            variation_index: variationIndex,
            name: finalFileName,
            type: file.type,
            size: file.size,
            format: file.format ?? null,
            instagram_url: null,
            storage_path: storagePath,
            public_url: publicUrl,
          });
          uploadedCount++;
          continue;
        }

        if (file.base64Data) {
          const byteCharacters = atob(file.base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);

          const { error: upErr } = await supabase.storage
            .from("creative-files")
            .upload(storagePath, byteArray, { contentType: file.type });

          if (upErr) {
            console.error("Upload error for", file.name, upErr);
            continue;
          }

          const { data: pub } = supabase.storage.from("creative-files").getPublicUrl(storagePath);
          const publicUrl = pub?.publicUrl ?? null;

          await supabase.from("j_ads_creative_files").insert({
            submission_id: submissionId,
            variation_index: variationIndex,
            name: finalFileName,
            type: file.type,
            size: file.size,
            format: file.format ?? null,
            instagram_url: null,
            storage_path: storagePath,
            public_url: publicUrl,
          });

          uploadedCount++;
        } else if (file.instagramUrl) {
          await supabase.from("j_ads_creative_files").insert({
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
      } catch (e) {
        console.error("Failed processing file:", file.name, e);
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
    console.error("Unhandled error on j_ads_ingest_creative:", e);
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
