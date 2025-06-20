export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          account_manager: string | null
          ad_account_id: string
          created_at: string
          google_ads_id: string | null
          manager: string | null
          monthly_budget_google: number | null
          monthly_budget_meta: number | null
          monthly_budget_tiktok: number | null
          name: string
          niche: Json | null
          notion_id: string
          objectives: Json
          partner_id: string | null
          payment_method: string | null
          sowork_channel: string | null
          status: string | null
          tasks: Json | null
          tier: number | null
          tracking: Json | null
          updated_at: string
          whatsapp: string | null
          woo_consumer_key: string | null
          woo_consumer_secret: string | null
        }
        Insert: {
          account_manager?: string | null
          ad_account_id: string
          created_at?: string
          google_ads_id?: string | null
          manager?: string | null
          monthly_budget_google?: number | null
          monthly_budget_meta?: number | null
          monthly_budget_tiktok?: number | null
          name: string
          niche?: Json | null
          notion_id: string
          objectives?: Json
          partner_id?: string | null
          payment_method?: string | null
          sowork_channel?: string | null
          status?: string | null
          tasks?: Json | null
          tier?: number | null
          tracking?: Json | null
          updated_at?: string
          whatsapp?: string | null
          woo_consumer_key?: string | null
          woo_consumer_secret?: string | null
        }
        Update: {
          account_manager?: string | null
          ad_account_id?: string
          created_at?: string
          google_ads_id?: string | null
          manager?: string | null
          monthly_budget_google?: number | null
          monthly_budget_meta?: number | null
          monthly_budget_tiktok?: number | null
          name?: string
          niche?: Json | null
          notion_id?: string
          objectives?: Json
          partner_id?: string | null
          payment_method?: string | null
          sowork_channel?: string | null
          status?: string | null
          tasks?: Json | null
          tier?: number | null
          tracking?: Json | null
          updated_at?: string
          whatsapp?: string | null
          woo_consumer_key?: string | null
          woo_consumer_secret?: string | null
        }
        Relationships: []
      }
      creative_drafts: {
        Row: {
          campaign_objective: string | null
          client_id: string
          created_at: string
          creative_id: string
          creative_type: string | null
          form_data: Json
          id: string
          last_accessed: string
          manager_id: string
          platform: string | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_objective?: string | null
          client_id: string
          created_at?: string
          creative_id: string
          creative_type?: string | null
          form_data?: Json
          id?: string
          last_accessed?: string
          manager_id: string
          platform?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_objective?: string | null
          client_id?: string
          created_at?: string
          creative_id?: string
          creative_type?: string | null
          form_data?: Json
          id?: string
          last_accessed?: string
          manager_id?: string
          platform?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          default_url: string
          id: string
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_url: string
          id?: string
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_url?: string
          id?: string
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_creative_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_next_creative_counter: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
