import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Template {
  template_id: string;
  file_path: string;
  brand_identity: "jumper" | "koko";
  last_modified: string;
}

/**
 * React Hook: useTemplateList
 *
 * Fetches all available deck templates from Storage.
 * Admin-only - will fail if user is not admin.
 */
export function useTemplateList() {
  return useQuery({
    queryKey: ["template-list"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "j_hub_deck_template_list",
        {
          body: {},
        }
      );

      if (error) throw error;
      if (!data || !data.templates) {
        throw new Error("Invalid response from template list function");
      }

      return data.templates as Template[];
    },
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
