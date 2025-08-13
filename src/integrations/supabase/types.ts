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
      j_ads_creative_files: {
        Row: {
          created_at: string
          format: string | null
          id: string
          instagram_url: string | null
          name: string | null
          public_url: string | null
          size: number | null
          storage_path: string | null
          submission_id: string
          type: string | null
          variation_index: number
        }
        Insert: {
          created_at?: string
          format?: string | null
          id?: string
          instagram_url?: string | null
          name?: string | null
          public_url?: string | null
          size?: number | null
          storage_path?: string | null
          submission_id: string
          type?: string | null
          variation_index: number
        }
        Update: {
          created_at?: string
          format?: string | null
          id?: string
          instagram_url?: string | null
          name?: string | null
          public_url?: string | null
          size?: number | null
          storage_path?: string | null
          submission_id?: string
          type?: string | null
          variation_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_files_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "j_ads_creative_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      j_ads_creative_submissions: {
        Row: {
          campaign_objective: string | null
          client: string | null
          created_at: string
          creative_type: string | null
          error: string | null
          id: string
          manager_id: string | null
          partner: string | null
          payload: Json
          platform: string | null
          processed_at: string | null
          result: Json | null
          status: Database["public"]["Enums"]["submission_status"]
          total_variations: number
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_objective?: string | null
          client?: string | null
          created_at?: string
          creative_type?: string | null
          error?: string | null
          id?: string
          manager_id?: string | null
          partner?: string | null
          payload: Json
          platform?: string | null
          processed_at?: string | null
          result?: Json | null
          status?: Database["public"]["Enums"]["submission_status"]
          total_variations?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_objective?: string | null
          client?: string | null
          created_at?: string
          creative_type?: string | null
          error?: string | null
          id?: string
          manager_id?: string | null
          partner?: string | null
          payload?: Json
          platform?: string | null
          processed_at?: string | null
          result?: Json | null
          status?: Database["public"]["Enums"]["submission_status"]
          total_variations?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      j_ads_creative_variations: {
        Row: {
          created_at: string
          creative_id: string
          cta: string | null
          full_creative_name: string
          id: string
          notion_page_id: string
          processed_at: string | null
          submission_id: string
          updated_at: string
          variation_index: number
        }
        Insert: {
          created_at?: string
          creative_id: string
          cta?: string | null
          full_creative_name: string
          id?: string
          notion_page_id: string
          processed_at?: string | null
          submission_id: string
          updated_at?: string
          variation_index: number
        }
        Update: {
          created_at?: string
          creative_id?: string
          cta?: string | null
          full_creative_name?: string
          id?: string
          notion_page_id?: string
          processed_at?: string | null
          submission_id?: string
          updated_at?: string
          variation_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_variations_submission_fk"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "j_ads_creative_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      j_ads_error_logs: {
        Row: {
          component_name: string | null
          created_at: string | null
          error_type: string
          id: string
          message: string
          metadata: Json | null
          resolved: boolean | null
          severity: string | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_email: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string | null
          error_type: string
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean | null
          severity?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_email?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string | null
          error_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean | null
          severity?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      j_ads_notion_manager_accounts: {
        Row: {
          account_notion_id: string
          created_at: string
          manager_id: string
        }
        Insert: {
          account_notion_id: string
          created_at?: string
          manager_id: string
        }
        Update: {
          account_notion_id?: string
          created_at?: string
          manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notion_manager_accounts_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "j_ads_notion_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      j_ads_notion_managers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          notion_id: string
          role: Database["public"]["Enums"]["notion_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notion_id: string
          role: Database["public"]["Enums"]["notion_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notion_id?: string
          role?: Database["public"]["Enums"]["notion_role"]
          updated_at?: string
        }
        Relationships: []
      }
      j_ads_user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_error_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      set_user_role: {
        Args: {
          _user_email: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
      notion_role: "admin" | "gestor" | "supervisor" | "gerente"
      submission_status:
        | "pending"
        | "queued"
        | "processing"
        | "processed"
        | "error"
        | "draft"
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
    Enums: {
      app_role: ["admin", "manager", "user"],
      notion_role: ["admin", "gestor", "supervisor", "gerente"],
      submission_status: [
        "pending",
        "queued",
        "processing",
        "processed",
        "error",
        "draft",
      ],
    },
  },
} as const
