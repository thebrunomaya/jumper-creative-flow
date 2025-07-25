export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      n8n_fila_mensagens: {
        Row: {
          id: number
          id_mensagem: string
          mensagem: string
          telefone: string
          timestamp: string
        }
        Insert: {
          id?: number
          id_mensagem: string
          mensagem: string
          telefone: string
          timestamp: string
        }
        Update: {
          id?: number
          id_mensagem?: string
          mensagem?: string
          telefone?: string
          timestamp?: string
        }
        Relationships: []
      }
      n8n_historico_mensagens: {
        Row: {
          created_at: string
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string
          id?: number
          message?: Json
          session_id?: string
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
