export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
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
          manager_email: string | null
          manager_id: string | null
          manager_notion_id: string | null
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
          manager_email?: string | null
          manager_id?: string | null
          manager_notion_id?: string | null
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
          manager_email?: string | null
          manager_id?: string | null
          manager_notion_id?: string | null
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
      j_ads_metrics: {
        Row: {
          account_currency: string | null
          account_id: string
          account_name: string | null
          action_values_omni_purchase: number | null
          actions_add_payment_info: number | null
          actions_add_to_cart: number | null
          actions_comment: number | null
          actions_complete_registration: number | null
          actions_initiate_checkout: number | null
          actions_landing_page_view: number | null
          actions_lead: number | null
          actions_like: number | null
          actions_onsite_conversion_messaging_conversation_started_7d:
            | number
            | null
          actions_onsite_conversion_post_save: number | null
          actions_page_engagement: number | null
          actions_photo_view: number | null
          actions_post: number | null
          actions_post_engagement: number | null
          actions_post_reaction: number | null
          actions_purchase: number | null
          actions_view_content: number | null
          ad_id: string
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign: string | null
          campaign_id: string | null
          clicks: number | null
          created_at: string | null
          date: string
          day_of_month: number | null
          frequency: number | null
          id: string
          image_url: string | null
          impressions: number | null
          link_clicks: number | null
          month: number | null
          objective: string | null
          reach: number | null
          spend: number | null
          status: string | null
          updated_at: string | null
          video_p100_watched_actions_video_view: number | null
          video_p25_watched_actions_video_view: number | null
          video_p50_watched_actions_video_view: number | null
          video_p75_watched_actions_video_view: number | null
          video_p95_watched_actions_video_view: number | null
          video_play_actions_video_view: number | null
          video_thruplay_watched_actions_video_view: number | null
          week: number | null
          week_day: string | null
          year: number | null
          year_month: string | null
          year_of_week: number | null
          year_week: string | null
        }
        Insert: {
          account_currency?: string | null
          account_id: string
          account_name?: string | null
          action_values_omni_purchase?: number | null
          actions_add_payment_info?: number | null
          actions_add_to_cart?: number | null
          actions_comment?: number | null
          actions_complete_registration?: number | null
          actions_initiate_checkout?: number | null
          actions_landing_page_view?: number | null
          actions_lead?: number | null
          actions_like?: number | null
          actions_onsite_conversion_messaging_conversation_started_7d?:
            | number
            | null
          actions_onsite_conversion_post_save?: number | null
          actions_page_engagement?: number | null
          actions_photo_view?: number | null
          actions_post?: number | null
          actions_post_engagement?: number | null
          actions_post_reaction?: number | null
          actions_purchase?: number | null
          actions_view_content?: number | null
          ad_id: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign?: string | null
          campaign_id?: string | null
          clicks?: number | null
          created_at?: string | null
          date: string
          day_of_month?: number | null
          frequency?: number | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          link_clicks?: number | null
          month?: number | null
          objective?: string | null
          reach?: number | null
          spend?: number | null
          status?: string | null
          updated_at?: string | null
          video_p100_watched_actions_video_view?: number | null
          video_p25_watched_actions_video_view?: number | null
          video_p50_watched_actions_video_view?: number | null
          video_p75_watched_actions_video_view?: number | null
          video_p95_watched_actions_video_view?: number | null
          video_play_actions_video_view?: number | null
          video_thruplay_watched_actions_video_view?: number | null
          week?: number | null
          week_day?: string | null
          year?: number | null
          year_month?: string | null
          year_of_week?: number | null
          year_week?: string | null
        }
        Update: {
          account_currency?: string | null
          account_id?: string
          account_name?: string | null
          action_values_omni_purchase?: number | null
          actions_add_payment_info?: number | null
          actions_add_to_cart?: number | null
          actions_comment?: number | null
          actions_complete_registration?: number | null
          actions_initiate_checkout?: number | null
          actions_landing_page_view?: number | null
          actions_lead?: number | null
          actions_like?: number | null
          actions_onsite_conversion_messaging_conversation_started_7d?:
            | number
            | null
          actions_onsite_conversion_post_save?: number | null
          actions_page_engagement?: number | null
          actions_photo_view?: number | null
          actions_post?: number | null
          actions_post_engagement?: number | null
          actions_post_reaction?: number | null
          actions_purchase?: number | null
          actions_view_content?: number | null
          ad_id?: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign?: string | null
          campaign_id?: string | null
          clicks?: number | null
          created_at?: string | null
          date?: string
          day_of_month?: number | null
          frequency?: number | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          link_clicks?: number | null
          month?: number | null
          objective?: string | null
          reach?: number | null
          spend?: number | null
          status?: string | null
          updated_at?: string | null
          video_p100_watched_actions_video_view?: number | null
          video_p25_watched_actions_video_view?: number | null
          video_p50_watched_actions_video_view?: number | null
          video_p75_watched_actions_video_view?: number | null
          video_p95_watched_actions_video_view?: number | null
          video_play_actions_video_view?: number | null
          video_thruplay_watched_actions_video_view?: number | null
          week?: number | null
          week_day?: string | null
          year?: number | null
          year_month?: string | null
          year_of_week?: number | null
          year_week?: string | null
        }
        Relationships: []
      }
      j_ads_notion_db_accounts: {
        Row: {
          "(Projeto) E-mail profissional do responsável pelo projeto.":
            | string
            | null
          "(Projeto) Telefone ou WhatsApp do responsável pelo projeto.":
            | string
            | null
          "(Projetos) Cargo do responsável pelo projeto.": string | null
          "(Projetos) Nome do responsável pelo projeto.": string | null
          "(Venda)E-mail profissional do responsável pela área comercial":
            | string
            | null
          "(Vendas) Cargo do responsável pela área comercial/vendas.":
            | string
            | null
          "(Vendas) Nome do responsável pela área comercial/vendas.":
            | string
            | null
          "(Vendas)Telefone ou WhatsApp do responsável pela área comerci":
            | string
            | null
          "✅ Tarefas": string | null
          "Antecedência (Boleto)": string | null
          "Canal Slack": string | null
          "Canal SoWork": string | null
          "Como os clientes pesquisam esses produtos/serviços no Google?":
            | string
            | null
          Conta: string | null
          "Contexto para Otimização": string | null
          created_at: string | null
          "Endereço da Empresa.": string | null
          "Existem perfis de clientes diferentes para cada produto/serviç":
            | string
            | null
          "Existem perfis diferentes para cada produto/serviço? Quais?":
            | string
            | null
          "G-ADS: Fim do Saldo": string | null
          "G-ADS: Saldo": string | null
          "G-ADS: Saldo Em Dias": string | null
          "G-ADS: Última Checagem": string | null
          "G-ADS: Verba Mensal": string | null
          Gerente: string | null
          Gestor: string | null
          "História e Propósito": string | null
          id: string
          ID: string | null
          "ID Google Ads": string | null
          "ID Google Analytics": string | null
          "ID Meta Ads": string | null
          "ID Tiktok Ads": string | null
          "Já anunciaram antes? Onde e como foi?": string | null
          "Já possuem banco de imagens, vídeos ou portfólio?": string | null
          "Já possuem identidade visual e logo?": string | null
          "Link da logo ": string | null
          "Link da pasta do Google Drive com criativos e materiais.":
            | string
            | null
          "Link do Instagram da empresa.": string | null
          "Link Meta": string | null
          "Meta do Mês": string | null
          "META: Fim do Saldo": string | null
          "META: Fim do Saldo (1)": string | null
          "META: Saldo": string | null
          "META: Saldo Em Dias": string | null
          "META: Última Checagem": string | null
          "META: Verba Mensal": string | null
          "Método de Pagamento": string | null
          Nicho: string | null
          notion_id: string | null
          "O que normalmente impede esse cliente de fechar com você?":
            | string
            | null
          Objetivos: string | null
          Parceiro: string | null
          Plataformas: string | null
          "Possuem lista de contatos para remarketing ou e-mail marketing?":
            | string
            | null
          "Principais concorrentes (Nomes ou links)": string | null
          "Quais estratégias anteriores funcionaram melhor?": string | null
          "Quais são as maiores dores e objeções desses clientes?":
            | string
            | null
          "Quais são os produtos/serviços que deseja divulgar?": string | null
          "Qual a principal meta da empresa para os próximos 12 meses?":
            | string
            | null
          "Qual é a transformação ou resultado que esse cliente busca a":
            | string
            | null
          "Qual o investimento mensal disponível para anúncios?": string | null
          "Quem é o cliente ideal? (Persona)": string | null
          Rastreamento: string | null
          "Regiões onde deseja atrair clientes?": string | null
          "Segmento de atuação": string | null
          "Seus principais diferenciais competitivos.": string | null
          "Site Oficial": string | null
          Status: string | null
          Supervisor: string | null
          "Tem alguma meta de marketing clara (KPIs)?": string | null
          "Ticket médio atual (valor médio por venda ou contrato).":
            | string
            | null
          Tier: number | null
          "TIK: Verba Mensal": string | null
          updated_at: string | null
          "Vencimento Ideal (Boleto)": string | null
          "Vocês usam alguma ferramenta de CRM ou automação de marketin":
            | string
            | null
          "Woo Consumer Key": string | null
          "Woo Consumer Secret": string | null
        }
        Insert: {
          "(Projeto) E-mail profissional do responsável pelo projeto."?:
            | string
            | null
          "(Projeto) Telefone ou WhatsApp do responsável pelo projeto."?:
            | string
            | null
          "(Projetos) Cargo do responsável pelo projeto."?: string | null
          "(Projetos) Nome do responsável pelo projeto."?: string | null
          "(Venda)E-mail profissional do responsável pela área comercial"?:
            | string
            | null
          "(Vendas) Cargo do responsável pela área comercial/vendas."?:
            | string
            | null
          "(Vendas) Nome do responsável pela área comercial/vendas."?:
            | string
            | null
          "(Vendas)Telefone ou WhatsApp do responsável pela área comerci"?:
            | string
            | null
          "✅ Tarefas"?: string | null
          "Antecedência (Boleto)"?: string | null
          "Canal Slack"?: string | null
          "Canal SoWork"?: string | null
          "Como os clientes pesquisam esses produtos/serviços no Google?"?:
            | string
            | null
          Conta?: string | null
          "Contexto para Otimização"?: string | null
          created_at?: string | null
          "Endereço da Empresa."?: string | null
          "Existem perfis de clientes diferentes para cada produto/serviç"?:
            | string
            | null
          "Existem perfis diferentes para cada produto/serviço? Quais?"?:
            | string
            | null
          "G-ADS: Fim do Saldo"?: string | null
          "G-ADS: Saldo"?: string | null
          "G-ADS: Saldo Em Dias"?: string | null
          "G-ADS: Última Checagem"?: string | null
          "G-ADS: Verba Mensal"?: string | null
          Gerente?: string | null
          Gestor?: string | null
          "História e Propósito"?: string | null
          id?: string
          ID?: string | null
          "ID Google Ads"?: string | null
          "ID Google Analytics"?: string | null
          "ID Meta Ads"?: string | null
          "ID Tiktok Ads"?: string | null
          "Já anunciaram antes? Onde e como foi?"?: string | null
          "Já possuem banco de imagens, vídeos ou portfólio?"?: string | null
          "Já possuem identidade visual e logo?"?: string | null
          "Link da logo "?: string | null
          "Link da pasta do Google Drive com criativos e materiais."?:
            | string
            | null
          "Link do Instagram da empresa."?: string | null
          "Link Meta"?: string | null
          "Meta do Mês"?: string | null
          "META: Fim do Saldo"?: string | null
          "META: Fim do Saldo (1)"?: string | null
          "META: Saldo"?: string | null
          "META: Saldo Em Dias"?: string | null
          "META: Última Checagem"?: string | null
          "META: Verba Mensal"?: string | null
          "Método de Pagamento"?: string | null
          Nicho?: string | null
          notion_id?: string | null
          "O que normalmente impede esse cliente de fechar com você?"?:
            | string
            | null
          Objetivos?: string | null
          Parceiro?: string | null
          Plataformas?: string | null
          "Possuem lista de contatos para remarketing ou e-mail marketing?"?:
            | string
            | null
          "Principais concorrentes (Nomes ou links)"?: string | null
          "Quais estratégias anteriores funcionaram melhor?"?: string | null
          "Quais são as maiores dores e objeções desses clientes?"?:
            | string
            | null
          "Quais são os produtos/serviços que deseja divulgar?"?: string | null
          "Qual a principal meta da empresa para os próximos 12 meses?"?:
            | string
            | null
          "Qual é a transformação ou resultado que esse cliente busca a"?:
            | string
            | null
          "Qual o investimento mensal disponível para anúncios?"?: string | null
          "Quem é o cliente ideal? (Persona)"?: string | null
          Rastreamento?: string | null
          "Regiões onde deseja atrair clientes?"?: string | null
          "Segmento de atuação"?: string | null
          "Seus principais diferenciais competitivos."?: string | null
          "Site Oficial"?: string | null
          Status?: string | null
          Supervisor?: string | null
          "Tem alguma meta de marketing clara (KPIs)?"?: string | null
          "Ticket médio atual (valor médio por venda ou contrato)."?:
            | string
            | null
          Tier?: number | null
          "TIK: Verba Mensal"?: string | null
          updated_at?: string | null
          "Vencimento Ideal (Boleto)"?: string | null
          "Vocês usam alguma ferramenta de CRM ou automação de marketin"?:
            | string
            | null
          "Woo Consumer Key"?: string | null
          "Woo Consumer Secret"?: string | null
        }
        Update: {
          "(Projeto) E-mail profissional do responsável pelo projeto."?:
            | string
            | null
          "(Projeto) Telefone ou WhatsApp do responsável pelo projeto."?:
            | string
            | null
          "(Projetos) Cargo do responsável pelo projeto."?: string | null
          "(Projetos) Nome do responsável pelo projeto."?: string | null
          "(Venda)E-mail profissional do responsável pela área comercial"?:
            | string
            | null
          "(Vendas) Cargo do responsável pela área comercial/vendas."?:
            | string
            | null
          "(Vendas) Nome do responsável pela área comercial/vendas."?:
            | string
            | null
          "(Vendas)Telefone ou WhatsApp do responsável pela área comerci"?:
            | string
            | null
          "✅ Tarefas"?: string | null
          "Antecedência (Boleto)"?: string | null
          "Canal Slack"?: string | null
          "Canal SoWork"?: string | null
          "Como os clientes pesquisam esses produtos/serviços no Google?"?:
            | string
            | null
          Conta?: string | null
          "Contexto para Otimização"?: string | null
          created_at?: string | null
          "Endereço da Empresa."?: string | null
          "Existem perfis de clientes diferentes para cada produto/serviç"?:
            | string
            | null
          "Existem perfis diferentes para cada produto/serviço? Quais?"?:
            | string
            | null
          "G-ADS: Fim do Saldo"?: string | null
          "G-ADS: Saldo"?: string | null
          "G-ADS: Saldo Em Dias"?: string | null
          "G-ADS: Última Checagem"?: string | null
          "G-ADS: Verba Mensal"?: string | null
          Gerente?: string | null
          Gestor?: string | null
          "História e Propósito"?: string | null
          id?: string
          ID?: string | null
          "ID Google Ads"?: string | null
          "ID Google Analytics"?: string | null
          "ID Meta Ads"?: string | null
          "ID Tiktok Ads"?: string | null
          "Já anunciaram antes? Onde e como foi?"?: string | null
          "Já possuem banco de imagens, vídeos ou portfólio?"?: string | null
          "Já possuem identidade visual e logo?"?: string | null
          "Link da logo "?: string | null
          "Link da pasta do Google Drive com criativos e materiais."?:
            | string
            | null
          "Link do Instagram da empresa."?: string | null
          "Link Meta"?: string | null
          "Meta do Mês"?: string | null
          "META: Fim do Saldo"?: string | null
          "META: Fim do Saldo (1)"?: string | null
          "META: Saldo"?: string | null
          "META: Saldo Em Dias"?: string | null
          "META: Última Checagem"?: string | null
          "META: Verba Mensal"?: string | null
          "Método de Pagamento"?: string | null
          Nicho?: string | null
          notion_id?: string | null
          "O que normalmente impede esse cliente de fechar com você?"?:
            | string
            | null
          Objetivos?: string | null
          Parceiro?: string | null
          Plataformas?: string | null
          "Possuem lista de contatos para remarketing ou e-mail marketing?"?:
            | string
            | null
          "Principais concorrentes (Nomes ou links)"?: string | null
          "Quais estratégias anteriores funcionaram melhor?"?: string | null
          "Quais são as maiores dores e objeções desses clientes?"?:
            | string
            | null
          "Quais são os produtos/serviços que deseja divulgar?"?: string | null
          "Qual a principal meta da empresa para os próximos 12 meses?"?:
            | string
            | null
          "Qual é a transformação ou resultado que esse cliente busca a"?:
            | string
            | null
          "Qual o investimento mensal disponível para anúncios?"?: string | null
          "Quem é o cliente ideal? (Persona)"?: string | null
          Rastreamento?: string | null
          "Regiões onde deseja atrair clientes?"?: string | null
          "Segmento de atuação"?: string | null
          "Seus principais diferenciais competitivos."?: string | null
          "Site Oficial"?: string | null
          Status?: string | null
          Supervisor?: string | null
          "Tem alguma meta de marketing clara (KPIs)?"?: string | null
          "Ticket médio atual (valor médio por venda ou contrato)."?:
            | string
            | null
          Tier?: number | null
          "TIK: Verba Mensal"?: string | null
          updated_at?: string | null
          "Vencimento Ideal (Boleto)"?: string | null
          "Vocês usam alguma ferramenta de CRM ou automação de marketin"?:
            | string
            | null
          "Woo Consumer Key"?: string | null
          "Woo Consumer Secret"?: string | null
        }
        Relationships: []
      }
      j_ads_notion_db_managers: {
        Row: {
          Contas: string | null
          created_at: string | null
          "E-Mail": string | null
          Função: string | null
          id: string
          Nome: string | null
          notion_id: string
          Organização: string | null
          Senha: string | null
          "Softr Date Created": string | null
          "Softr Last Login": string | null
          "Softr Link": string | null
          Telefone: string | null
          updated_at: string | null
        }
        Insert: {
          Contas?: string | null
          created_at?: string | null
          "E-Mail"?: string | null
          Função?: string | null
          id?: string
          Nome?: string | null
          notion_id: string
          Organização?: string | null
          Senha?: string | null
          "Softr Date Created"?: string | null
          "Softr Last Login"?: string | null
          "Softr Link"?: string | null
          Telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          Contas?: string | null
          created_at?: string | null
          "E-Mail"?: string | null
          Função?: string | null
          id?: string
          Nome?: string | null
          notion_id?: string
          Organização?: string | null
          Senha?: string | null
          "Softr Date Created"?: string | null
          "Softr Last Login"?: string | null
          "Softr Link"?: string | null
          Telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      j_ads_notion_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json | null
          errors_count: number | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          errors_count?: number | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          errors_count?: number | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      j_ads_optimization_context: {
        Row: {
          account_id: string
          actions_taken: Json
          client_report_generated: boolean | null
          client_report_sent_at: string | null
          confidence_level: string | null
          created_at: string | null
          id: string
          metrics_mentioned: Json
          recording_id: string
          strategy: Json
          summary: string
          timeline: Json
        }
        Insert: {
          account_id: string
          actions_taken: Json
          client_report_generated?: boolean | null
          client_report_sent_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          metrics_mentioned: Json
          recording_id: string
          strategy: Json
          summary: string
          timeline: Json
        }
        Update: {
          account_id?: string
          actions_taken?: Json
          client_report_generated?: boolean | null
          client_report_sent_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          metrics_mentioned?: Json
          recording_id?: string
          strategy?: Json
          summary?: string
          timeline?: Json
        }
        Relationships: [
          {
            foreignKeyName: "j_ads_optimization_context_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "j_ads_optimization_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      j_ads_optimization_recordings: {
        Row: {
          account_context: string | null
          account_id: string
          analysis_status: string | null
          audio_file_path: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          recorded_at: string | null
          recorded_by: string
          transcription_status: string | null
        }
        Insert: {
          account_context?: string | null
          account_id: string
          analysis_status?: string | null
          audio_file_path?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          recorded_at?: string | null
          recorded_by: string
          transcription_status?: string | null
        }
        Update: {
          account_context?: string | null
          account_id?: string
          analysis_status?: string | null
          audio_file_path?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          recorded_at?: string | null
          recorded_by?: string
          transcription_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "j_ads_optimization_recordings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "j_ads_notion_db_accounts"
            referencedColumns: ["notion_id"]
          },
        ]
      }
      j_ads_optimization_transcripts: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          full_text: string
          id: string
          language: string | null
          recording_id: string
          segments: Json | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          full_text: string
          id?: string
          language?: string | null
          recording_id: string
          segments?: Json | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          full_text?: string
          id?: string
          language?: string | null
          recording_id?: string
          segments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "j_ads_optimization_transcripts_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "j_ads_optimization_recordings"
            referencedColumns: ["id"]
          },
        ]
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
      j_rep_metaads_bronze: {
        Row: {
          account_currency: string | null
          account_id: string
          account_name: string | null
          action_values_omni_purchase: number | null
          actions_add_payment_info: number | null
          actions_add_to_cart: number | null
          actions_comment: number | null
          actions_complete_registration: number | null
          actions_initiate_checkout: number | null
          actions_landing_page_view: number | null
          actions_lead: number | null
          actions_like: number | null
          actions_onsite_conversion_messaging_conversation_started_7d:
            | number
            | null
          actions_onsite_conversion_post_save: number | null
          actions_page_engagement: number | null
          actions_photo_view: number | null
          actions_post: number | null
          actions_post_engagement: number | null
          actions_post_reaction: number | null
          actions_purchase: number | null
          actions_view_content: number | null
          ad_id: string
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign: string | null
          campaign_id: string | null
          clicks: number | null
          created_at: string | null
          date: string
          day_of_month: number | null
          frequency: number | null
          id: string
          image_url: string | null
          impressions: number | null
          link_clicks: number | null
          month: number | null
          objective: string | null
          reach: number | null
          spend: number | null
          status: string | null
          updated_at: string | null
          video_p100_watched_actions_video_view: number | null
          video_p25_watched_actions_video_view: number | null
          video_p50_watched_actions_video_view: number | null
          video_p75_watched_actions_video_view: number | null
          video_p95_watched_actions_video_view: number | null
          video_play_actions_video_view: number | null
          video_thruplay_watched_actions_video_view: number | null
          week: number | null
          week_day: string | null
          year: number | null
          year_month: string | null
          year_of_week: number | null
          year_week: string | null
        }
        Insert: {
          account_currency?: string | null
          account_id: string
          account_name?: string | null
          action_values_omni_purchase?: number | null
          actions_add_payment_info?: number | null
          actions_add_to_cart?: number | null
          actions_comment?: number | null
          actions_complete_registration?: number | null
          actions_initiate_checkout?: number | null
          actions_landing_page_view?: number | null
          actions_lead?: number | null
          actions_like?: number | null
          actions_onsite_conversion_messaging_conversation_started_7d?:
            | number
            | null
          actions_onsite_conversion_post_save?: number | null
          actions_page_engagement?: number | null
          actions_photo_view?: number | null
          actions_post?: number | null
          actions_post_engagement?: number | null
          actions_post_reaction?: number | null
          actions_purchase?: number | null
          actions_view_content?: number | null
          ad_id: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign?: string | null
          campaign_id?: string | null
          clicks?: number | null
          created_at?: string | null
          date: string
          day_of_month?: number | null
          frequency?: number | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          link_clicks?: number | null
          month?: number | null
          objective?: string | null
          reach?: number | null
          spend?: number | null
          status?: string | null
          updated_at?: string | null
          video_p100_watched_actions_video_view?: number | null
          video_p25_watched_actions_video_view?: number | null
          video_p50_watched_actions_video_view?: number | null
          video_p75_watched_actions_video_view?: number | null
          video_p95_watched_actions_video_view?: number | null
          video_play_actions_video_view?: number | null
          video_thruplay_watched_actions_video_view?: number | null
          week?: number | null
          week_day?: string | null
          year?: number | null
          year_month?: string | null
          year_of_week?: number | null
          year_week?: string | null
        }
        Update: {
          account_currency?: string | null
          account_id?: string
          account_name?: string | null
          action_values_omni_purchase?: number | null
          actions_add_payment_info?: number | null
          actions_add_to_cart?: number | null
          actions_comment?: number | null
          actions_complete_registration?: number | null
          actions_initiate_checkout?: number | null
          actions_landing_page_view?: number | null
          actions_lead?: number | null
          actions_like?: number | null
          actions_onsite_conversion_messaging_conversation_started_7d?:
            | number
            | null
          actions_onsite_conversion_post_save?: number | null
          actions_page_engagement?: number | null
          actions_photo_view?: number | null
          actions_post?: number | null
          actions_post_engagement?: number | null
          actions_post_reaction?: number | null
          actions_purchase?: number | null
          actions_view_content?: number | null
          ad_id?: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign?: string | null
          campaign_id?: string | null
          clicks?: number | null
          created_at?: string | null
          date?: string
          day_of_month?: number | null
          frequency?: number | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          link_clicks?: number | null
          month?: number | null
          objective?: string | null
          reach?: number | null
          spend?: number | null
          status?: string | null
          updated_at?: string | null
          video_p100_watched_actions_video_view?: number | null
          video_p25_watched_actions_video_view?: number | null
          video_p50_watched_actions_video_view?: number | null
          video_p75_watched_actions_video_view?: number | null
          video_p95_watched_actions_video_view?: number | null
          video_play_actions_video_view?: number | null
          video_thruplay_watched_actions_video_view?: number | null
          week?: number | null
          week_day?: string | null
          year?: number | null
          year_month?: string | null
          year_of_week?: number | null
          year_week?: string | null
        }
        Relationships: []
      }
      meta_ads_performance: {
        Row: {
          account_id: string
          clicks: number | null
          cliente_id: string
          cost_per_inline_link_click: number | null
          cost_per_lead: number | null
          cpm: number | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          impressions: number | null
          inline_link_click_ctr: number | null
          inline_link_clicks: number | null
          leads: number | null
          periodo: string
          spend: number
          updated_at: string | null
        }
        Insert: {
          account_id: string
          clicks?: number | null
          cliente_id: string
          cost_per_inline_link_click?: number | null
          cost_per_lead?: number | null
          cpm?: number | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          impressions?: number | null
          inline_link_click_ctr?: number | null
          inline_link_clicks?: number | null
          leads?: number | null
          periodo: string
          spend: number
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          clicks?: number | null
          cliente_id?: string
          cost_per_inline_link_click?: number | null
          cost_per_lead?: number | null
          cpm?: number | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          impressions?: number | null
          inline_link_click_ctr?: number | null
          inline_link_clicks?: number | null
          leads?: number | null
          periodo?: string
          spend?: number
          updated_at?: string | null
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_email: string
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
