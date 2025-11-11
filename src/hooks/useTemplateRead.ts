import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TemplateData {
  template_id: string;
  html_content: string;
  size: number;
  file_path: string;
}

/**
 * React Hook: useTemplateRead
 *
 * Fetches a specific template HTML from Storage.
 * Admin-only - will fail if user is not admin.
 *
 * @param templateId - Template filename without extension
 */
export function useTemplateRead(templateId: string | undefined) {
  return useQuery({
    queryKey: ["template-read", templateId],
    queryFn: async () => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const { data, error } = await supabase.functions.invoke(
        "j_hub_deck_template_read",
        {
          body: { template_id: templateId },
        }
      );

      if (error) throw error;
      if (!data) {
        throw new Error("Invalid response from template read function");
      }

      return data as TemplateData;
    },
    enabled: !!templateId,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
