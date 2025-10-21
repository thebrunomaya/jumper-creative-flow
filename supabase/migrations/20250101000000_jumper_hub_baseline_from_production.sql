SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'manager',
    'user'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."notion_role" AS ENUM (
    'admin',
    'gestor',
    'supervisor',
    'gerente'
);


ALTER TYPE "public"."notion_role" OWNER TO "postgres";


CREATE TYPE "public"."submission_status" AS ENUM (
    'pending',
    'queued',
    'processing',
    'processed',
    'error',
    'draft'
);


ALTER TYPE "public"."submission_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_error_logs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_error_logs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("_user_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.j_hub_users WHERE id = _user_id;
$$;


ALTER FUNCTION "public"."get_user_role"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
  user_nome TEXT;
  manager_notion_id TEXT;
BEGIN
  IF new.raw_app_meta_data->>'provider' = 'notion' THEN
    user_role := 'staff';
  ELSE
    user_role := 'client';
    SELECT "Nome", notion_id INTO user_nome, manager_notion_id
    FROM public.j_ads_notion_db_managers
    WHERE LOWER("E-Mail") = LOWER(new.email)
    LIMIT 1;
  END IF;

  INSERT INTO public.j_ads_users (id, email, role, nome, notion_manager_id, last_login_at)
  VALUES (new.id, new.email, user_role, user_nome, manager_notion_id, now())
  ON CONFLICT (id) DO UPDATE SET last_login_at = now();

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = _user_id AND role = _role
  );
END;
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_action"("p_user_id" "uuid", "p_user_email" "text", "p_admin_id" "uuid", "p_admin_email" "text", "p_action" "text", "p_old_value" "jsonb" DEFAULT NULL::"jsonb", "p_new_value" "jsonb" DEFAULT NULL::"jsonb", "p_reason" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO j_ads_user_audit_log (
    user_id, user_email, admin_id, admin_email,
    action, old_value, new_value, reason
  ) VALUES (
    p_user_id, p_user_email, p_admin_id, p_admin_email,
    p_action, p_old_value, p_new_value, p_reason
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;


ALTER FUNCTION "public"."log_user_action"("p_user_id" "uuid", "p_user_email" "text", "p_admin_id" "uuid", "p_admin_email" "text", "p_action" "text", "p_old_value" "jsonb", "p_new_value" "jsonb", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_processed_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN
    -- Atualizar com os nomes CORRETOS dos campos
    UPDATE j_hub_optimization_transcripts
    SET
      processed_previous_version = processed_text,  -- ✅ CORRETO
      processed_text = p_new_text,
      processed_last_edited_at = NOW(),            -- ✅ CORRETO
      processed_last_edited_by = p_user_id,        -- ✅ CORRETO
      processed_edit_count = COALESCE(processed_edit_count, 0) + 1
    WHERE recording_id = p_recording_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
    END IF;
  END;
  $$;


ALTER FUNCTION "public"."save_processed_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."save_processed_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") IS 'Saves processed text edits with automatic versioning. Moves current text to previous_version for undo functionality.';



CREATE OR REPLACE FUNCTION "public"."save_transcript_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN
    -- Move current version to backup and save new version
    UPDATE j_hub_optimization_transcripts  -- ✅ Nome correto
    SET
      previous_version = full_text,
      full_text = p_new_text,
      last_edited_at = NOW(),
      last_edited_by = p_user_id,
      edit_count = COALESCE(edit_count, 0) + 1
    WHERE recording_id = p_recording_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
    END IF;
  END;
  $$;


ALTER FUNCTION "public"."save_transcript_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."save_transcript_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") IS 'Saves transcript edits with simple versioning. Moves current text to previous_version backup before saving new text.';



CREATE OR REPLACE FUNCTION "public"."set_user_role"("_user_email" "text", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _user_id uuid;
BEGIN
    -- Find user by email
    SELECT id INTO _user_id
    FROM auth.users
    WHERE email = _user_email;
    
    IF _user_id IS NULL THEN
        RETURN false; -- User not found
    END IF;
    
    -- Remove existing role for this user
    DELETE FROM public.j_ads_user_roles 
    WHERE user_id = _user_id;
    
    -- Insert new role
    INSERT INTO public.j_ads_user_roles (user_id, role)
    VALUES (_user_id, _role);
    
    RETURN true;
END;
$$;


ALTER FUNCTION "public"."set_user_role"("_user_email" "text", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_j_ads_metrics_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_j_ads_metrics_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_j_ads_notion_db_accounts_complete_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_j_ads_notion_db_accounts_complete_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_j_rep_metaads_bronze_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_j_rep_metaads_bronze_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notion_db_accounts_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notion_db_accounts_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notion_db_managers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_notion_db_managers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function that automatically updates the updated_at column to current timestamp on row updates';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."j_ads_creative_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "variation_index" integer NOT NULL,
    "name" "text",
    "type" "text",
    "size" integer,
    "format" "text",
    "instagram_url" "text",
    "storage_path" "text",
    "public_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."j_ads_creative_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."j_ads_creative_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "manager_id" "uuid",
    "status" "public"."submission_status" DEFAULT 'pending'::"public"."submission_status" NOT NULL,
    "client" "text",
    "partner" "text",
    "platform" "text",
    "creative_type" "text",
    "campaign_objective" "text",
    "total_variations" integer DEFAULT 1 NOT NULL,
    "payload" "jsonb" NOT NULL,
    "result" "jsonb",
    "error" "text",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "manager_notion_id" "text",
    "manager_email" "text",
    "validation_overrides" "jsonb"
);


ALTER TABLE "public"."j_ads_creative_submissions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."j_ads_creative_submissions"."user_id" IS 'Supabase Auth UUID - quem criou a submissão';



COMMENT ON COLUMN "public"."j_ads_creative_submissions"."manager_id" IS 'DEPRECATED - será removido. Use manager_notion_id para Notion';



COMMENT ON COLUMN "public"."j_ads_creative_submissions"."manager_notion_id" IS 'Notion ID do manager - só preenchido na publicação';



COMMENT ON COLUMN "public"."j_ads_creative_submissions"."manager_email" IS 'Bridge field - email para conversão user_id <-> notion_id';



CREATE TABLE IF NOT EXISTS "public"."j_ads_creative_variations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid" NOT NULL,
    "variation_index" integer NOT NULL,
    "notion_page_id" "text" NOT NULL,
    "creative_id" "text" NOT NULL,
    "full_creative_name" "text" NOT NULL,
    "cta" "text",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."j_ads_creative_variations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."j_ads_error_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "error_type" character varying(50) NOT NULL,
    "message" "text" NOT NULL,
    "stack_trace" "text",
    "url" character varying(500),
    "user_email" character varying(255),
    "user_agent" "text",
    "component_name" character varying(100),
    "severity" character varying(20) DEFAULT 'error'::character varying,
    "resolved" boolean DEFAULT false,
    "metadata" "jsonb"
);


ALTER TABLE "public"."j_ads_error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."j_hub_notion_db_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ID" "text",
    "Conta" "text",
    "Status" "text",
    "Tier" integer,
    "Nicho" "text",
    "Objetivos" "text",
    "Plataformas" "text",
    "Rastreamento" "text",
    "Gestor" "text",
    "Atendimento" "text",
    "Parceiro" "text",
    "Gerente" "text",
    "Canal SoWork" "text",
    "Método de Pagamento" "text",
    "META: Verba Mensal" "text",
    "G-ADS: Verba Mensal" "text",
    "TIK: Verba Mensal" "text",
    "ID Meta Ads" "text",
    "ID Google Ads" "text",
    "ID Tiktok Ads" "text",
    "ID Google Analytics" "text",
    "Link Meta" "text",
    "Canal Slack" "text",
    "✅ Tarefas" "text",
    "Woo Consumer Secret" "text",
    "Woo Consumer Key" "text",
    "(Projeto) E-mail profissional do responsável pelo projeto." "text",
    "(Projeto) Telefone ou WhatsApp do responsável pelo projeto." "text",
    "(Projetos) Cargo do responsável pelo projeto." "text",
    "(Projetos) Nome do responsável pelo projeto." "text",
    "(Venda)E-mail profissional do responsável pela área comercial" "text",
    "(Vendas) Cargo do responsável pela área comercial/vendas." "text",
    "(Vendas) Nome do responsável pela área comercial/vendas." "text",
    "(Vendas)Telefone ou WhatsApp do responsável pela área comerci" "text",
    "Como os clientes pesquisam esses produtos/serviços no Google?" "text",
    "Endereço da Empresa." "text",
    "Existem perfis de clientes diferentes para cada produto/serviç" "text",
    "Existem perfis diferentes para cada produto/serviço? Quais?" "text",
    "História e Propósito" "text",
    "Já anunciaram antes? Onde e como foi?" "text",
    "Já possuem banco de imagens, vídeos ou portfólio?" "text",
    "Já possuem identidade visual e logo?" "text",
    "Link da logo " "text",
    "Link da pasta do Google Drive com criativos e materiais." "text",
    "Link do Instagram da empresa." "text",
    "O que normalmente impede esse cliente de fechar com você?" "text",
    "Possuem lista de contatos para remarketing ou e-mail marketing?" "text",
    "Principais concorrentes (Nomes ou links)" "text",
    "Quais estratégias anteriores funcionaram melhor?" "text",
    "Quais são as maiores dores e objeções desses clientes?" "text",
    "Quais são os produtos/serviços que deseja divulgar?" "text",
    "Qual a principal meta da empresa para os próximos 12 meses?" "text",
    "Qual o investimento mensal disponível para anúncios?" "text",
    "Qual é a transformação ou resultado que esse cliente busca a" "text",
    "Quem é o cliente ideal? (Persona)" "text",
    "Regiões onde deseja atrair clientes?" "text",
    "Segmento de atuação" "text",
    "Seus principais diferenciais competitivos." "text",
    "Site Oficial" "text",
    "Tem alguma meta de marketing clara (KPIs)?" "text",
    "Ticket médio atual (valor médio por venda ou contrato)." "text",
    "Vocês usam alguma ferramenta de CRM ou automação de marketin" "text",
    "G-ADS: Fim do Saldo" "text",
    "G-ADS: Saldo" "text",
    "G-ADS: Saldo Em Dias" "text",
    "G-ADS: Última Checagem" "text",
    "META: Fim do Saldo" "text",
    "META: Fim do Saldo (1)" "text",
    "META: Saldo" "text",
    "META: Saldo Em Dias" "text",
    "META: Última Checagem" "text",
    "Antecedência (Boleto)" "text",
    "Meta do Mês" "text",
    "Vencimento Ideal (Boleto)" "text",
    "notion_id" "text",
    "Contexto para Otimização" "text",
    "Contexto para Transcrição" "text"
);


ALTER TABLE "public"."j_hub_notion_db_accounts" OWNER TO "postgres";


COMMENT ON TABLE "public"."j_hub_notion_db_accounts" IS 'Tabela com nomes EXATOS das colunas do CSV do Notion DB_Contas';



COMMENT ON COLUMN "public"."j_hub_notion_db_accounts"."notion_id" IS 'ID único do registro no Notion, usado para sincronização';



COMMENT ON COLUMN "public"."j_hub_notion_db_accounts"."Contexto para Transcrição" IS 'Summarized context for audio transcription (Whisper API). Used in Step 1 only. For full context, use "Contexto para Otimização".';



CREATE TABLE IF NOT EXISTS "public"."j_hub_notion_db_managers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notion_id" "text" NOT NULL,
    "Nome" "text",
    "E-Mail" "text",
    "Telefone" "text",
    "Função" "text",
    "Contas" "text",
    "Organização" "text",
    "Senha" "text",
    "Softr Link" "text",
    "Softr Date Created" "text",
    "Softr Last Login" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."j_hub_notion_db_managers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."j_hub_notion_sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sync_type" character varying(50) DEFAULT 'manual'::character varying NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'running'::character varying NOT NULL,
    "records_processed" integer DEFAULT 0,
    "records_created" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "errors_count" integer DEFAULT 0,
    "error_details" "jsonb",
    "execution_time_ms" integer,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."j_hub_notion_sync_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."j_hub_notion_sync_logs" IS 'Logs de sincronização entre Notion e Supabase para monitoramento e debugging';



CREATE TABLE IF NOT EXISTS "public"."j_hub_optimization_api_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recording_id" "uuid" NOT NULL,
    "step" "text" NOT NULL,
    "prompt_sent" "text",
    "model_used" "text",
    "input_preview" "text",
    "output_preview" "text",
    "tokens_used" integer,
    "latency_ms" integer,
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "j_ads_optimization_api_logs_step_check" CHECK (("step" = ANY (ARRAY['transcribe'::"text", 'process'::"text", 'analyze'::"text", 'improve_transcript'::"text", 'improve_processed'::"text"])))
);


ALTER TABLE "public"."j_hub_optimization_api_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."j_hub_optimization_api_logs" IS 'API logs for debugging optimization steps. RLS disabled because table is accessed only by Edge Functions with service role key for admin debugging purposes.';



COMMENT ON COLUMN "public"."j_hub_optimization_api_logs"."step" IS 'Step name: transcribe (Whisper), process (Claude bullets), analyze (Final JSON)';



COMMENT ON COLUMN "public"."j_hub_optimization_api_logs"."prompt_sent" IS 'Full prompt sent to AI (for debugging)';



COMMENT ON COLUMN "public"."j_hub_optimization_api_logs"."input_preview" IS 'Preview of input data (500 chars max)';



COMMENT ON COLUMN "public"."j_hub_optimization_api_logs"."output_preview" IS 'Preview of output data (500 chars max)';



COMMENT ON CONSTRAINT "j_ads_optimization_api_logs_step_check" ON "public"."j_hub_optimization_api_logs" IS 'Validates step values: transcribe (Whisper), process (Claude bullets), analyze (AI analysis), improve_transcript (Claude transcript adjustments), improve_processed (Claude bullet adjustments)';



CREATE TABLE IF NOT EXISTS "public"."j_hub_optimization_context" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recording_id" "uuid" NOT NULL,
    "account_id" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "actions_taken" "jsonb" NOT NULL,
    "metrics_mentioned" "jsonb" NOT NULL,
    "strategy" "jsonb" NOT NULL,
    "timeline" "jsonb" NOT NULL,
    "confidence_level" "text",
    "client_report_generated" boolean DEFAULT false,
    "client_report_sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "correction_prompt" "text",
    "model_used" "text" DEFAULT 'gpt-4o'::"text",
    "correction_applied_at" timestamp with time zone,
    "revised_at" timestamp with time zone,
    CONSTRAINT "j_ads_optimization_context_confidence_level_check" CHECK (("confidence_level" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text", 'revised'::"text"])))
);


ALTER TABLE "public"."j_hub_optimization_context" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."j_hub_optimization_prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform" "text" NOT NULL,
    "objective" "text" NOT NULL,
    "prompt_type" "text" NOT NULL,
    "prompt_text" "text" NOT NULL,
    "variables" "text"[] DEFAULT ARRAY['account_name'::"text", 'objectives'::"text", 'platform'::"text", 'context'::"text"],
    "is_default" boolean DEFAULT true,
    "edited_by" "text",
    "previous_version" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "j_ads_optimization_prompts_platform_check" CHECK (("platform" = ANY (ARRAY['meta'::"text", 'google'::"text"]))),
    CONSTRAINT "j_ads_optimization_prompts_prompt_type_check" CHECK (("prompt_type" = ANY (ARRAY['transcribe'::"text", 'process'::"text", 'analyze'::"text"])))
);


ALTER TABLE "public"."j_hub_optimization_prompts" OWNER TO "postgres";


COMMENT ON TABLE "public"."j_hub_optimization_prompts" IS 'Custom prompts for optimization workflow: transcribe (Whisper context), process (organize bullets), analyze (final analysis)';



COMMENT ON COLUMN "public"."j_hub_optimization_prompts"."prompt_type" IS 'Prompt types: transcribe (Whisper context for Step 1), process (Claude bullet organization for Step 2), analyze (Claude insight generation for Step 3 - lens based on account objective)';



CREATE TABLE IF NOT EXISTS "public"."j_hub_optimization_recordings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "text" NOT NULL,
    "recorded_by" "text" NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "audio_file_path" "text",
    "duration_seconds" integer,
    "transcription_status" "text" DEFAULT 'pending'::"text",
    "analysis_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "account_context" "text",
    "override_context" "text",
    "platform" "text" DEFAULT 'meta'::"text",
    "selected_objectives" "text"[],
    "public_slug" "text",
    "password_hash" "text",
    "share_enabled" boolean DEFAULT false,
    "share_expires_at" timestamp with time zone,
    "share_created_at" timestamp with time zone,
    "processing_status" "text" DEFAULT 'pending'::"text",
    "shared_oracle_type" "text" DEFAULT 'orfeu'::"text",
    CONSTRAINT "j_ads_optimization_recordings_platform_check" CHECK (("platform" = ANY (ARRAY['meta'::"text", 'google'::"text"]))),
    CONSTRAINT "j_ads_optimization_recordings_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "j_hub_optimization_recordings_shared_oracle_type_check" CHECK (("shared_oracle_type" = ANY (ARRAY['delfos'::"text", 'orfeu'::"text", 'nostradamus'::"text"])))
);


ALTER TABLE "public"."j_hub_optimization_recordings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."transcription_status" IS 'Status: pending -> processing -> processing_transcript -> completed | failed';



COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."public_slug" IS 'Unique slug for public URL (e.g., 
  "clinicaseven-10out2025-abc123")';



COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."password_hash" IS 'Bcrypt hash of the share password';



COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."share_enabled" IS 'Whether public sharing is enabled for 
  this optimization';



COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."share_expires_at" IS 'Optional expiration timestamp for 
  the share link';



COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."share_created_at" IS 'When the share was created';



COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."processing_status" IS 'Status do Passo 2: Organização em bullets com Claude Sonnet 4.5';



COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."shared_oracle_type" IS 'Stores which oracle format (delfos/orfeu/nostradamus) was selected when creating the public share link. Default is "orfeu" (narrative) as most clients are non-technical.';



CREATE TABLE IF NOT EXISTS "public"."j_hub_optimization_transcripts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recording_id" "uuid" NOT NULL,
    "full_text" "text" NOT NULL,
    "language" "text" DEFAULT 'pt'::"text",
    "confidence_score" numeric,
    "segments" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "correction_prompt" "text",
    "correction_applied_at" timestamp with time zone,
    "original_text" "text",
    "revised_at" timestamp with time zone,
    "revised_by" "text",
    "processed_text" "text",
    "previous_version" "text",
    "last_edited_at" timestamp with time zone,
    "last_edited_by" "uuid",
    "edit_count" integer DEFAULT 0,
    "processed_previous_version" "text",
    "processed_last_edited_at" timestamp with time zone,
    "processed_last_edited_by" "uuid",
    "processed_edit_count" integer DEFAULT 0,
    CONSTRAINT "j_ads_optimization_transcripts_confidence_score_check" CHECK ((("confidence_score" >= (0)::numeric) AND ("confidence_score" <= (1)::numeric)))
);


ALTER TABLE "public"."j_hub_optimization_transcripts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."j_hub_optimization_transcripts"."previous_version" IS 'Backup of the previous version (for simple undo). Only stores 1 version.';



COMMENT ON COLUMN "public"."j_hub_optimization_transcripts"."last_edited_at" IS 'Timestamp of last edit (manual or AI-assisted)';



COMMENT ON COLUMN "public"."j_hub_optimization_transcripts"."last_edited_by" IS 'User who made the last edit';



COMMENT ON COLUMN "public"."j_hub_optimization_transcripts"."edit_count" IS 'Number of times this transcript has been edited';



COMMENT ON COLUMN "public"."j_hub_optimization_transcripts"."processed_previous_version" IS 'Previous version of processed text (organized bullets) for undo functionality. Only stores one level of history.';



COMMENT ON COLUMN "public"."j_hub_optimization_transcripts"."processed_last_edited_at" IS 'Timestamp of last edit to processed text (manual edit or AI adjustment).';



COMMENT ON COLUMN "public"."j_hub_optimization_transcripts"."processed_last_edited_by" IS 'User ID who last edited the processed text.';



COMMENT ON COLUMN "public"."j_hub_optimization_transcripts"."processed_edit_count" IS 'Counter tracking how many times the processed text has been edited (manual or AI-assisted).';



CREATE TABLE IF NOT EXISTS "public"."j_hub_user_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_email" "text",
    "admin_id" "uuid",
    "admin_email" "text",
    "action" "text" NOT NULL,
    "old_value" "jsonb",
    "new_value" "jsonb",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "j_ads_user_audit_log_action_check" CHECK (("action" = ANY (ARRAY['role_changed'::"text", 'deactivated'::"text", 'reactivated'::"text", 'password_reset'::"text", 'user_created'::"text", 'user_deleted'::"text", 'forced_logout'::"text"])))
);


ALTER TABLE "public"."j_hub_user_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."j_hub_user_audit_log" IS 'Tracks all administrative actions on user accounts for security and compliance';



COMMENT ON COLUMN "public"."j_hub_user_audit_log"."user_id" IS 'ID of the user who was affected by the action';



COMMENT ON COLUMN "public"."j_hub_user_audit_log"."admin_id" IS 'ID of the admin who performed the action';



COMMENT ON COLUMN "public"."j_hub_user_audit_log"."action" IS 'Type of action performed';



COMMENT ON COLUMN "public"."j_hub_user_audit_log"."old_value" IS 'Previous state before the action (JSON)';



COMMENT ON COLUMN "public"."j_hub_user_audit_log"."new_value" IS 'New state after the action (JSON)';



COMMENT ON COLUMN "public"."j_hub_user_audit_log"."reason" IS 'Optional reason/notes provided by the admin';



CREATE TABLE IF NOT EXISTS "public"."j_hub_users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "nome" "text",
    "telefone" "text",
    "organizacao" "text",
    "avatar_url" "text",
    "notion_manager_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_login_at" timestamp with time zone,
    "login_count" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "deactivated_at" timestamp with time zone,
    "deactivated_by" "uuid",
    CONSTRAINT "j_hub_users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'staff'::"text", 'client'::"text"])))
);


ALTER TABLE "public"."j_hub_users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."j_hub_users"."last_login_at" IS 'Timestamp of the user''s last login';



COMMENT ON COLUMN "public"."j_hub_users"."login_count" IS 'Total number of successful logins';



COMMENT ON COLUMN "public"."j_hub_users"."is_active" IS 'Whether the user account is active (true) or deactivated (false)';



COMMENT ON COLUMN "public"."j_hub_users"."deactivated_at" IS 'Timestamp when the account was deactivated';



COMMENT ON COLUMN "public"."j_hub_users"."deactivated_by" IS 'Admin user ID who deactivated this account';



CREATE TABLE IF NOT EXISTS "public"."j_rep_metaads_bronze" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_currency" "text",
    "account_id" "text" NOT NULL,
    "account_name" "text",
    "campaign_id" "text",
    "campaign" "text",
    "adset_id" "text",
    "adset_name" "text",
    "ad_id" "text" NOT NULL,
    "ad_name" "text",
    "impressions" integer DEFAULT 0,
    "clicks" integer DEFAULT 0,
    "link_clicks" integer DEFAULT 0,
    "reach" integer DEFAULT 0,
    "spend" numeric(10,2) DEFAULT 0,
    "frequency" numeric(4,2) DEFAULT 0,
    "action_values_omni_purchase" numeric(10,2) DEFAULT 0,
    "actions_add_payment_info" integer DEFAULT 0,
    "actions_add_to_cart" integer DEFAULT 0,
    "actions_comment" integer DEFAULT 0,
    "actions_complete_registration" integer DEFAULT 0,
    "actions_initiate_checkout" integer DEFAULT 0,
    "actions_landing_page_view" integer DEFAULT 0,
    "actions_lead" integer DEFAULT 0,
    "actions_like" integer DEFAULT 0,
    "actions_onsite_conversion_messaging_conversation_started_7d" integer DEFAULT 0,
    "actions_onsite_conversion_post_save" integer DEFAULT 0,
    "actions_page_engagement" integer DEFAULT 0,
    "actions_photo_view" integer DEFAULT 0,
    "actions_post" integer DEFAULT 0,
    "actions_post_engagement" integer DEFAULT 0,
    "actions_post_reaction" integer DEFAULT 0,
    "actions_purchase" integer DEFAULT 0,
    "actions_view_content" integer DEFAULT 0,
    "video_p100_watched_actions_video_view" integer DEFAULT 0,
    "video_p25_watched_actions_video_view" integer DEFAULT 0,
    "video_p50_watched_actions_video_view" integer DEFAULT 0,
    "video_p75_watched_actions_video_view" integer DEFAULT 0,
    "video_p95_watched_actions_video_view" integer DEFAULT 0,
    "video_play_actions_video_view" integer DEFAULT 0,
    "video_thruplay_watched_actions_video_view" integer DEFAULT 0,
    "date" "date" NOT NULL,
    "day_of_month" integer,
    "month" integer,
    "year" integer,
    "week" integer,
    "week_day" "text",
    "year_month" "text",
    "year_of_week" integer,
    "year_week" "text",
    "objective" "text",
    "status" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."j_rep_metaads_bronze" OWNER TO "postgres";


COMMENT ON TABLE "public"."j_rep_metaads_bronze" IS 'Bronze layer - Raw Meta Ads metrics from Windsor.ai (direct insert)';



ALTER TABLE ONLY "public"."j_ads_creative_files"
    ADD CONSTRAINT "creative_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_ads_creative_submissions"
    ADD CONSTRAINT "creative_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_ads_creative_variations"
    ADD CONSTRAINT "creative_variations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_ads_error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_notion_db_accounts"
    ADD CONSTRAINT "j_ads_notion_db_accounts_notion_id_key" UNIQUE ("notion_id");



ALTER TABLE ONLY "public"."j_hub_notion_db_managers"
    ADD CONSTRAINT "j_ads_notion_db_managers_notion_id_key" UNIQUE ("notion_id");



ALTER TABLE ONLY "public"."j_hub_optimization_api_logs"
    ADD CONSTRAINT "j_ads_optimization_api_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_optimization_context"
    ADD CONSTRAINT "j_ads_optimization_context_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_optimization_context"
    ADD CONSTRAINT "j_ads_optimization_context_recording_id_key" UNIQUE ("recording_id");



ALTER TABLE ONLY "public"."j_hub_optimization_prompts"
    ADD CONSTRAINT "j_ads_optimization_prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_optimization_prompts"
    ADD CONSTRAINT "j_ads_optimization_prompts_platform_objective_prompt_type_key" UNIQUE ("platform", "objective", "prompt_type");



ALTER TABLE ONLY "public"."j_hub_optimization_recordings"
    ADD CONSTRAINT "j_ads_optimization_recordings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_optimization_recordings"
    ADD CONSTRAINT "j_ads_optimization_recordings_public_slug_key" UNIQUE ("public_slug");



ALTER TABLE ONLY "public"."j_hub_optimization_transcripts"
    ADD CONSTRAINT "j_ads_optimization_transcripts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_optimization_transcripts"
    ADD CONSTRAINT "j_ads_optimization_transcripts_recording_id_unique" UNIQUE ("recording_id");



ALTER TABLE ONLY "public"."j_hub_users"
    ADD CONSTRAINT "j_hub_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."j_hub_notion_db_accounts"
    ADD CONSTRAINT "j_hub_notion_db_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_notion_db_managers"
    ADD CONSTRAINT "j_hub_notion_db_managers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_notion_sync_logs"
    ADD CONSTRAINT "j_hub_notion_sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_user_audit_log"
    ADD CONSTRAINT "j_hub_user_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_hub_users"
    ADD CONSTRAINT "j_hub_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."j_rep_metaads_bronze"
    ADD CONSTRAINT "j_rep_metaads_bronze_ad_id_date_key" UNIQUE ("ad_id", "date");



ALTER TABLE ONLY "public"."j_rep_metaads_bronze"
    ADD CONSTRAINT "j_rep_metaads_bronze_pkey" PRIMARY KEY ("id");



CREATE INDEX "creative_variations_submission_idx" ON "public"."j_ads_creative_variations" USING "btree" ("submission_id");



CREATE UNIQUE INDEX "creative_variations_submission_variation_uidx" ON "public"."j_ads_creative_variations" USING "btree" ("submission_id", "variation_index");



CREATE INDEX "idx_api_logs_created" ON "public"."j_hub_optimization_api_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_api_logs_recording" ON "public"."j_hub_optimization_api_logs" USING "btree" ("recording_id");



CREATE INDEX "idx_api_logs_step" ON "public"."j_hub_optimization_api_logs" USING "btree" ("step");



CREATE INDEX "idx_audit_action" ON "public"."j_hub_user_audit_log" USING "btree" ("action", "created_at" DESC);



CREATE INDEX "idx_audit_admin" ON "public"."j_hub_user_audit_log" USING "btree" ("admin_id", "created_at" DESC);



CREATE INDEX "idx_audit_created" ON "public"."j_hub_user_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_user" ON "public"."j_hub_user_audit_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_context_account" ON "public"."j_hub_optimization_context" USING "btree" ("account_id");



CREATE INDEX "idx_context_date" ON "public"."j_hub_optimization_context" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_context_recording" ON "public"."j_hub_optimization_context" USING "btree" ("recording_id");



CREATE INDEX "idx_context_recording_id" ON "public"."j_hub_optimization_context" USING "btree" ("recording_id");



CREATE INDEX "idx_creative_files_submission_id" ON "public"."j_ads_creative_files" USING "btree" ("submission_id");



CREATE INDEX "idx_creative_submissions_status_created" ON "public"."j_ads_creative_submissions" USING "btree" ("status", "created_at");



CREATE INDEX "idx_creative_submissions_validation_overrides" ON "public"."j_ads_creative_submissions" USING "btree" ("validation_overrides") WHERE ("validation_overrides" IS NOT NULL);



CREATE INDEX "idx_error_logs_created_at" ON "public"."j_ads_error_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_error_logs_error_type" ON "public"."j_ads_error_logs" USING "btree" ("error_type");



CREATE INDEX "idx_error_logs_resolved" ON "public"."j_ads_error_logs" USING "btree" ("resolved");



CREATE INDEX "idx_error_logs_user_email" ON "public"."j_ads_error_logs" USING "btree" ("user_email");



CREATE INDEX "idx_hub_optimization_recordings_account_statuses" ON "public"."j_hub_optimization_recordings" USING "btree" ("account_id", "transcription_status", "processing_status", "analysis_status");



CREATE INDEX "idx_hub_optimization_recordings_processing_status" ON "public"."j_hub_optimization_recordings" USING "btree" ("processing_status");



CREATE INDEX "idx_j_hub_notion_db_accounts_notion_id" ON "public"."j_hub_notion_db_accounts" USING "btree" ("notion_id");



CREATE INDEX "idx_j_rep_metaads_bronze_account_date" ON "public"."j_rep_metaads_bronze" USING "btree" ("account_id", "date");



CREATE INDEX "idx_j_rep_metaads_bronze_account_id" ON "public"."j_rep_metaads_bronze" USING "btree" ("account_id");



CREATE INDEX "idx_j_rep_metaads_bronze_ad_id" ON "public"."j_rep_metaads_bronze" USING "btree" ("ad_id");



CREATE INDEX "idx_j_rep_metaads_bronze_campaign_id" ON "public"."j_rep_metaads_bronze" USING "btree" ("campaign_id");



CREATE INDEX "idx_j_rep_metaads_bronze_date" ON "public"."j_rep_metaads_bronze" USING "btree" ("date");



CREATE INDEX "idx_notion_accounts_canal_sowork" ON "public"."j_hub_notion_db_accounts" USING "btree" ("Canal SoWork");



CREATE INDEX "idx_notion_accounts_conta" ON "public"."j_hub_notion_db_accounts" USING "btree" ("Conta");



CREATE INDEX "idx_notion_accounts_contexto_transcricao" ON "public"."j_hub_notion_db_accounts" USING "btree" ("Contexto para Transcrição");



CREATE INDEX "idx_notion_accounts_gestor" ON "public"."j_hub_notion_db_accounts" USING "btree" ("Gestor");



CREATE INDEX "idx_notion_accounts_id" ON "public"."j_hub_notion_db_accounts" USING "btree" ("ID");



CREATE INDEX "idx_notion_accounts_status" ON "public"."j_hub_notion_db_accounts" USING "btree" ("Status");



CREATE INDEX "idx_notion_db_managers_notion_id" ON "public"."j_hub_notion_db_managers" USING "btree" ("notion_id");



CREATE INDEX "idx_notion_sync_logs_started_at" ON "public"."j_hub_notion_sync_logs" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_notion_sync_logs_status" ON "public"."j_hub_notion_sync_logs" USING "btree" ("status");



CREATE INDEX "idx_notion_sync_logs_sync_type" ON "public"."j_hub_notion_sync_logs" USING "btree" ("sync_type");



CREATE INDEX "idx_optimization_context_recording_id" ON "public"."j_hub_optimization_context" USING "btree" ("recording_id");



CREATE INDEX "idx_optimization_prompts_lookup" ON "public"."j_hub_optimization_prompts" USING "btree" ("platform", "objective", "prompt_type");



CREATE INDEX "idx_optimization_recordings_public_slug" ON "public"."j_hub_optimization_recordings" USING "btree" ("public_slug") WHERE ("public_slug" IS NOT NULL);



CREATE INDEX "idx_optimization_recordings_share_enabled" ON "public"."j_hub_optimization_recordings" USING "btree" ("share_enabled") WHERE ("share_enabled" = true);



CREATE INDEX "idx_optimization_recordings_shared_oracle" ON "public"."j_hub_optimization_recordings" USING "btree" ("shared_oracle_type") WHERE ("share_enabled" = true);



CREATE INDEX "idx_optimization_transcripts_edited" ON "public"."j_hub_optimization_transcripts" USING "btree" ("last_edited_at" DESC);



CREATE INDEX "idx_optimization_transcripts_recording_id" ON "public"."j_hub_optimization_transcripts" USING "btree" ("recording_id");



CREATE INDEX "idx_recordings_account" ON "public"."j_hub_optimization_recordings" USING "btree" ("account_id");



CREATE INDEX "idx_recordings_date" ON "public"."j_hub_optimization_recordings" USING "btree" ("recorded_at" DESC);



CREATE INDEX "idx_recordings_status" ON "public"."j_hub_optimization_recordings" USING "btree" ("transcription_status", "analysis_status");



CREATE INDEX "idx_submissions_manager_email" ON "public"."j_ads_creative_submissions" USING "btree" ("manager_email");



CREATE INDEX "idx_submissions_manager_notion_id" ON "public"."j_ads_creative_submissions" USING "btree" ("manager_notion_id");



CREATE INDEX "idx_transcripts_recording_id" ON "public"."j_hub_optimization_transcripts" USING "btree" ("recording_id");



CREATE INDEX "idx_users_inactive" ON "public"."j_hub_users" USING "btree" ("deactivated_at" DESC) WHERE ("is_active" = false);



CREATE INDEX "idx_users_is_active" ON "public"."j_hub_users" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_users_last_login" ON "public"."j_hub_users" USING "btree" ("last_login_at" DESC);



CREATE UNIQUE INDEX "uniq_creative_variations_submission_variation" ON "public"."j_ads_creative_variations" USING "btree" ("submission_id", "variation_index");



CREATE OR REPLACE TRIGGER "trg_update_creative_submissions_updated_at" BEFORE UPDATE ON "public"."j_ads_creative_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_creative_variations_updated_at" BEFORE UPDATE ON "public"."j_ads_creative_variations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_j_hub_users_updated_at" BEFORE UPDATE ON "public"."j_hub_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_j_rep_metaads_bronze_updated_at_trigger" BEFORE UPDATE ON "public"."j_rep_metaads_bronze" FOR EACH ROW EXECUTE FUNCTION "public"."update_j_rep_metaads_bronze_updated_at"();



ALTER TABLE ONLY "public"."j_ads_creative_files"
    ADD CONSTRAINT "creative_files_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."j_ads_creative_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."j_ads_creative_variations"
    ADD CONSTRAINT "creative_variations_submission_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."j_ads_creative_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."j_hub_optimization_api_logs"
    ADD CONSTRAINT "j_ads_optimization_api_logs_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "public"."j_hub_optimization_recordings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."j_hub_optimization_context"
    ADD CONSTRAINT "j_ads_optimization_context_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "public"."j_hub_optimization_recordings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."j_hub_optimization_recordings"
    ADD CONSTRAINT "j_ads_optimization_recordings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."j_hub_notion_db_accounts"("notion_id");



ALTER TABLE ONLY "public"."j_hub_optimization_transcripts"
    ADD CONSTRAINT "j_ads_optimization_transcripts_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."j_hub_optimization_transcripts"
    ADD CONSTRAINT "j_ads_optimization_transcripts_processed_last_edited_by_fkey" FOREIGN KEY ("processed_last_edited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."j_hub_optimization_transcripts"
    ADD CONSTRAINT "j_ads_optimization_transcripts_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "public"."j_hub_optimization_recordings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."j_hub_user_audit_log"
    ADD CONSTRAINT "j_ads_user_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."j_hub_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."j_hub_users"
    ADD CONSTRAINT "j_hub_users_deactivated_by_fkey" FOREIGN KEY ("deactivated_by") REFERENCES "public"."j_hub_users"("id");



ALTER TABLE ONLY "public"."j_hub_users"
    ADD CONSTRAINT "j_hub_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."j_hub_user_audit_log"
    ADD CONSTRAINT "j_hub_user_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."j_hub_users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can insert audit logs" ON "public"."j_hub_user_audit_log" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can read all manager data" ON "public"."j_hub_notion_db_managers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update recordings" ON "public"."j_hub_optimization_recordings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all API logs" ON "public"."j_hub_optimization_api_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all accounts" ON "public"."j_hub_notion_db_accounts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all audit logs" ON "public"."j_hub_user_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all managers" ON "public"."j_hub_notion_db_managers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all recordings" ON "public"."j_hub_optimization_recordings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all sync logs" ON "public"."j_hub_notion_sync_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."raw_app_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "Admins can view audit logs" ON "public"."j_hub_user_audit_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view sync logs" ON "public"."j_hub_notion_sync_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Allow authenticated users to read bronze metrics" ON "public"."j_rep_metaads_bronze" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow service role to manage bronze metrics" ON "public"."j_rep_metaads_bronze" USING (true);



CREATE POLICY "Anyone authenticated can read prompts" ON "public"."j_hub_optimization_prompts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Clients can view their accounts" ON "public"."j_hub_notion_db_accounts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'client'::"text") AND ("j_hub_notion_db_accounts"."Gerente" ~~* (('%'::"text" || "u"."email") || '%'::"text"))))));



CREATE POLICY "Clients can view their own manager record" ON "public"."j_hub_notion_db_managers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'client'::"text") AND ("j_hub_notion_db_managers"."E-Mail" ~~* "u"."email")))));



CREATE POLICY "Clients can view their own record" ON "public"."j_hub_notion_db_managers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'client'::"text") AND ("j_hub_notion_db_managers"."E-Mail" ~~* "u"."email")))));



CREATE POLICY "Managers can view their own data" ON "public"."j_hub_notion_db_managers" FOR SELECT TO "authenticated" USING (("E-Mail" = (( SELECT "users"."email"
   FROM "auth"."users"
  WHERE ("users"."id" = "auth"."uid"())))::"text"));



CREATE POLICY "Only admins can modify prompts" ON "public"."j_hub_optimization_prompts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'admin'::"text")))));



CREATE POLICY "Public can check if email exists" ON "public"."j_hub_notion_db_managers" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public read access for Notion accounts" ON "public"."j_hub_notion_db_accounts" FOR SELECT USING (true);



CREATE POLICY "Public read access for Notion managers" ON "public"."j_hub_notion_db_managers" FOR SELECT USING (true);



CREATE POLICY "Service role can insert logs" ON "public"."j_hub_optimization_api_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can manage context" ON "public"."j_hub_optimization_context" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage sync logs" ON "public"."j_hub_notion_sync_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage transcripts" ON "public"."j_hub_optimization_transcripts" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role has full access" ON "public"."j_hub_notion_db_accounts" USING (true);



CREATE POLICY "Service role has full access" ON "public"."j_hub_notion_db_managers" USING (true);



CREATE POLICY "Service role has full access" ON "public"."j_hub_notion_sync_logs" USING (true);



CREATE POLICY "Service role has full access" ON "public"."j_hub_user_audit_log" USING (true);



CREATE POLICY "Service role has full access" ON "public"."j_hub_users" USING (true);



CREATE POLICY "Staff can view all managers" ON "public"."j_hub_notion_db_managers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users"
  WHERE (("j_hub_users"."id" = "auth"."uid"()) AND ("j_hub_users"."role" = 'staff'::"text")))));



CREATE POLICY "Staff can view their accounts" ON "public"."j_hub_notion_db_accounts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = 'staff'::"text") AND (("j_hub_notion_db_accounts"."Gestor" ~~* (('%'::"text" || "u"."email") || '%'::"text")) OR ("j_hub_notion_db_accounts"."Atendimento" ~~* (('%'::"text" || "u"."email") || '%'::"text")))))));



CREATE POLICY "Users can delete their own recordings" ON "public"."j_hub_optimization_recordings" FOR DELETE TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") = "recorded_by"));



CREATE POLICY "Users can insert j_ads_error_logs" ON "public"."j_ads_error_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert their own j_ads_submissions" ON "public"."j_ads_creative_submissions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own recordings" ON "public"."j_hub_optimization_recordings" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") = "recorded_by"));



CREATE POLICY "Users can insert variations of their j_ads_submissions" ON "public"."j_ads_creative_variations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."j_ads_creative_submissions" "s"
  WHERE (("s"."id" = "j_ads_creative_variations"."submission_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read their own manager data" ON "public"."j_hub_notion_db_managers" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'email'::"text") ~~* "E-Mail"));



CREATE POLICY "Users can select files of their j_ads_submissions" ON "public"."j_ads_creative_files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_ads_creative_submissions" "s"
  WHERE (("s"."id" = "j_ads_creative_files"."submission_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can select their own j_ads_submissions" ON "public"."j_ads_creative_submissions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."j_hub_users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own j_ads_error_logs" ON "public"."j_ads_error_logs" FOR UPDATE USING ((("user_email")::"text" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Users can update their own transcripts" ON "public"."j_hub_optimization_transcripts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_optimization_recordings" "r"
  WHERE (("r"."id" = "j_hub_optimization_transcripts"."recording_id") AND ("r"."recorded_by" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "Users can view own profile" ON "public"."j_hub_users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own audit logs" ON "public"."j_hub_user_audit_log" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own context" ON "public"."j_hub_optimization_context" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_optimization_recordings" "r"
  WHERE (("r"."id" = "j_hub_optimization_context"."recording_id") AND ("r"."recorded_by" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "Users can view their own j_ads_error_logs" ON "public"."j_ads_error_logs" FOR SELECT USING ((("user_email")::"text" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Users can view their own profile" ON "public"."j_hub_users" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view their own recordings" ON "public"."j_hub_optimization_recordings" FOR SELECT USING ((("auth"."jwt"() ->> 'email'::"text") = "recorded_by"));



CREATE POLICY "Users can view their own transcripts" ON "public"."j_hub_optimization_transcripts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_hub_optimization_recordings" "r"
  WHERE (("r"."id" = "j_hub_optimization_transcripts"."recording_id") AND ("r"."recorded_by" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "Users can view variations of their j_ads_submissions" ON "public"."j_ads_creative_variations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."j_ads_creative_submissions" "s"
  WHERE (("s"."id" = "j_ads_creative_variations"."submission_id") AND ("s"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."j_ads_creative_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_ads_creative_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_ads_creative_variations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_ads_error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_notion_db_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_notion_db_managers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_notion_sync_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_optimization_context" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_optimization_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_optimization_recordings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_optimization_transcripts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_user_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_hub_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."j_rep_metaads_bronze" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";









































































































































































































GRANT ALL ON FUNCTION "public"."cleanup_old_error_logs"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_error_logs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_error_logs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_action"("p_user_id" "uuid", "p_user_email" "text", "p_admin_id" "uuid", "p_admin_email" "text", "p_action" "text", "p_old_value" "jsonb", "p_new_value" "jsonb", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_action"("p_user_id" "uuid", "p_user_email" "text", "p_admin_id" "uuid", "p_admin_email" "text", "p_action" "text", "p_old_value" "jsonb", "p_new_value" "jsonb", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_action"("p_user_id" "uuid", "p_user_email" "text", "p_admin_id" "uuid", "p_admin_email" "text", "p_action" "text", "p_old_value" "jsonb", "p_new_value" "jsonb", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_processed_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."save_processed_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_processed_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_transcript_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."save_transcript_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_transcript_edit"("p_recording_id" "uuid", "p_new_text" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_role"("_user_email" "text", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_role"("_user_email" "text", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_role"("_user_email" "text", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_j_ads_metrics_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_j_ads_metrics_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_j_ads_metrics_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_j_ads_notion_db_accounts_complete_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_j_ads_notion_db_accounts_complete_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_j_ads_notion_db_accounts_complete_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_j_rep_metaads_bronze_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_j_rep_metaads_bronze_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_j_rep_metaads_bronze_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notion_db_accounts_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notion_db_accounts_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notion_db_accounts_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notion_db_managers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_notion_db_managers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notion_db_managers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."j_ads_creative_files" TO "anon";
GRANT ALL ON TABLE "public"."j_ads_creative_files" TO "authenticated";
GRANT ALL ON TABLE "public"."j_ads_creative_files" TO "service_role";



GRANT ALL ON TABLE "public"."j_ads_creative_submissions" TO "anon";
GRANT ALL ON TABLE "public"."j_ads_creative_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."j_ads_creative_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."j_ads_creative_variations" TO "anon";
GRANT ALL ON TABLE "public"."j_ads_creative_variations" TO "authenticated";
GRANT ALL ON TABLE "public"."j_ads_creative_variations" TO "service_role";



GRANT ALL ON TABLE "public"."j_ads_error_logs" TO "anon";
GRANT ALL ON TABLE "public"."j_ads_error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."j_ads_error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_notion_db_accounts" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_notion_db_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_notion_db_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_notion_db_managers" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_notion_db_managers" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_notion_db_managers" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_notion_sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_notion_sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_notion_sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_optimization_api_logs" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_optimization_api_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_optimization_api_logs" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_optimization_context" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_optimization_context" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_optimization_context" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_optimization_prompts" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_optimization_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_optimization_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_optimization_recordings" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_optimization_recordings" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_optimization_recordings" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_optimization_transcripts" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_optimization_transcripts" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_optimization_transcripts" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_user_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_user_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_user_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."j_hub_users" TO "anon";
GRANT ALL ON TABLE "public"."j_hub_users" TO "authenticated";
GRANT ALL ON TABLE "public"."j_hub_users" TO "service_role";



GRANT ALL ON TABLE "public"."j_rep_metaads_bronze" TO "anon";
GRANT ALL ON TABLE "public"."j_rep_metaads_bronze" TO "authenticated";
GRANT ALL ON TABLE "public"."j_rep_metaads_bronze" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
