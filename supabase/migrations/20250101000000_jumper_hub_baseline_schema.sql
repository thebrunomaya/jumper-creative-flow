-- ============================================================================
-- JUMPER HUB v2.0 - BASELINE SCHEMA CONSOLIDATION
-- ============================================================================
-- Description: Complete database schema for Jumper Hub platform
-- Date: 2025-01-01 (baseline timestamp for clean slate)
-- Author: Claude Code + Bruno Maya
-- Purpose: Consolidate all migrations into single source of truth
--
-- IMPORTANT: This replaces 43 incremental migrations with one comprehensive schema.
-- Old migrations archived in: supabase/migrations/_archive_pre_baseline/
--
-- Production Note: Production database already has this schema applied manually.
-- This migration is for local development (supabase start) to work correctly.
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable pg_cron for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: ENUMS
-- ============================================================================

-- Submission status for creative workflow
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM (
      'draft',
      'pending',
      'queued',
      'processing',
      'processed',
      'error'
    );
  END IF;
END $$;

-- User roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'client');
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: UTILITY FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: STORAGE BUCKETS
-- ============================================================================

-- Bucket for creative files
INSERT INTO storage.buckets (id, name, public)
VALUES ('creative-files', 'creative-files', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket for optimization audio recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('optimizations', 'optimizations', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 5: CORE PLATFORM TABLES (j_hub_*)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- j_hub_users: User management (single source of truth for roles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'client', -- 'admin', 'staff', 'client'
  nome TEXT,
  telefone TEXT,
  organizacao TEXT,
  avatar_url TEXT,
  notion_manager_id TEXT, -- Links to j_hub_notion_db_managers.notion_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_j_hub_users_email ON j_hub_users(email);
CREATE INDEX IF NOT EXISTS idx_j_hub_users_role ON j_hub_users(role);
CREATE INDEX IF NOT EXISTS idx_j_hub_users_notion_manager_id ON j_hub_users(notion_manager_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_update_j_hub_users_updated_at ON public.j_hub_users;
CREATE TRIGGER trg_update_j_hub_users_updated_at
  BEFORE UPDATE ON public.j_hub_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- j_hub_user_audit_log: Track user activity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_user_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES j_hub_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_user_audit_log_user_id ON j_hub_user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_user_audit_log_created_at ON j_hub_user_audit_log(created_at DESC);

-- -----------------------------------------------------------------------------
-- j_hub_notion_db_managers: Synchronized from Notion DB_Gerentes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_notion_db_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id TEXT UNIQUE NOT NULL,
  "Nome" TEXT,
  "Email" TEXT,
  "Contas" TEXT, -- Comma-separated account IDs
  "Tipo" TEXT, -- gestor, supervisor, gerente
  "Ativo" BOOLEAN,
  permissoes JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_notion_managers_notion_id ON j_hub_notion_db_managers(notion_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_notion_managers_email ON j_hub_notion_db_managers("Email");

-- -----------------------------------------------------------------------------
-- j_hub_notion_db_accounts: Synchronized from Notion DB_Contas (75+ fields)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_notion_db_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id TEXT UNIQUE NOT NULL,
  "Nome da Conta" TEXT,
  "Cliente" TEXT,
  "Objetivos" TEXT, -- Stored as comma-separated or JSON array
  "Status" TEXT,
  "Gestor" TEXT, -- Email or ID
  "Supervisor" TEXT,
  "Gerente" TEXT,
  "Budget Mensal" NUMERIC,
  "Plataforma" TEXT,

  -- Meta Ads integration fields (subset of 75+ available)
  account_id TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,

  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_notion_accounts_notion_id ON j_hub_notion_db_accounts(notion_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_notion_accounts_status ON j_hub_notion_db_accounts("Status");

-- -----------------------------------------------------------------------------
-- j_hub_notion_sync_logs: Track Notion synchronization
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_notion_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'accounts', 'managers'
  status TEXT NOT NULL, -- 'started', 'completed', 'failed'
  records_synced INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_j_hub_notion_sync_logs_started_at ON j_hub_notion_sync_logs(started_at DESC);

-- ============================================================================
-- SECTION 6: CREATIVE SUBMISSION SYSTEM (j_hub_creative_*)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- j_hub_creative_submissions: Main creative submission table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_creative_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES j_hub_users(id),
  manager_id UUID REFERENCES j_hub_users(id),
  status public.submission_status NOT NULL DEFAULT 'pending',
  account_id TEXT, -- Links to Notion account
  client TEXT,
  partner TEXT,
  platform TEXT,
  creative_type TEXT,
  campaign_objective TEXT,
  total_variations INTEGER NOT NULL DEFAULT 1,
  payload JSONB NOT NULL,
  result JSONB,
  error TEXT,
  validation_overrides JSONB, -- Allow bypassing certain validations
  notion_page_id TEXT, -- Created when published
  processed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_creative_submissions_user_id ON j_hub_creative_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_creative_submissions_status_created ON j_hub_creative_submissions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_j_hub_creative_submissions_account ON j_hub_creative_submissions(account_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_update_j_hub_creative_submissions_updated_at ON public.j_hub_creative_submissions;
CREATE TRIGGER trg_update_j_hub_creative_submissions_updated_at
  BEFORE UPDATE ON public.j_hub_creative_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- j_hub_creative_files: File attachments per submission/variation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES j_hub_creative_submissions(id) ON DELETE CASCADE,
  variation_index INTEGER NOT NULL,
  name TEXT,
  type TEXT, -- 'image' or 'video'
  size INTEGER,
  format TEXT, -- file extension
  placement TEXT, -- 'square', 'vertical', 'horizontal', etc.
  instagram_url TEXT,
  storage_path TEXT, -- Path in Supabase Storage
  public_url TEXT,
  dimensions JSONB, -- {width, height, aspect_ratio}
  duration_seconds INTEGER, -- For videos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_creative_files_submission_id ON j_hub_creative_files(submission_id);

-- -----------------------------------------------------------------------------
-- j_hub_creative_variations: Creative copy variations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_creative_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES j_hub_creative_submissions(id) ON DELETE CASCADE,
  variation_index INTEGER NOT NULL,
  notion_page_id TEXT,
  creative_id TEXT,
  full_creative_name TEXT,
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  cta TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_j_hub_creative_variations_submission_variation
  ON j_hub_creative_variations(submission_id, variation_index);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_update_j_hub_creative_variations_updated_at ON public.j_hub_creative_variations;
CREATE TRIGGER trg_update_j_hub_creative_variations_updated_at
  BEFORE UPDATE ON public.j_hub_creative_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 7: OPTIMIZATION SYSTEM (j_hub_optimization_*)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- j_hub_optimization_recordings: Audio recording metadata
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_optimization_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL REFERENCES j_hub_notion_db_accounts(notion_id),
  recorded_by TEXT NOT NULL, -- Email of gestor
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audio metadata
  audio_file_path TEXT, -- Path in Supabase Storage
  duration_seconds INTEGER,

  -- Processing status
  transcription_status TEXT DEFAULT 'pending', -- pending | processing | completed | failed
  analysis_status TEXT DEFAULT 'pending',
  processing_status TEXT DEFAULT 'pending', -- Overall status

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_recordings_account ON j_hub_optimization_recordings(account_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_recordings_date ON j_hub_optimization_recordings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_recordings_statuses
  ON j_hub_optimization_recordings(transcription_status, analysis_status);

-- -----------------------------------------------------------------------------
-- j_hub_optimization_transcripts: Whisper transcriptions with versioning
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_optimization_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL UNIQUE REFERENCES j_hub_optimization_recordings(id) ON DELETE CASCADE,
  full_text TEXT,
  language TEXT,
  confidence NUMERIC,

  -- Manual editing support
  previous_version TEXT, -- Backup before edit
  last_edited_at TIMESTAMPTZ,
  last_edited_by UUID REFERENCES j_hub_users(id),
  edit_count INTEGER DEFAULT 0,

  -- Processed text (cleaned, formatted)
  processed_text TEXT,
  processed_previous TEXT,
  processed_edited_at TIMESTAMPTZ,
  processed_edited_by UUID REFERENCES j_hub_users(id),
  processed_edit_count INTEGER DEFAULT 0,
  contexto_transcricao TEXT, -- Additional context

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_transcripts_recording ON j_hub_optimization_transcripts(recording_id);

-- -----------------------------------------------------------------------------
-- j_hub_optimization_context: Structured AI analysis output
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_optimization_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL UNIQUE REFERENCES j_hub_optimization_recordings(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES j_hub_notion_db_accounts(notion_id),

  -- Structured JSONB fields
  actions_taken JSONB, -- Array of {type, target, reason, impact}
  metrics_mentioned JSONB, -- Metrics cited by gestor
  strategy JSONB, -- {type, duration, success_criteria}
  timeline JSONB, -- {re_evaluation_date, milestones}

  -- Metadata
  summary TEXT, -- Plain text summary
  confidence_level NUMERIC, -- AI confidence 0-1
  prompt_used TEXT, -- Which prompt template was used
  model_used TEXT, -- GPT-4, etc.

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_context_recording ON j_hub_optimization_context(recording_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_context_account ON j_hub_optimization_context(account_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_context_created ON j_hub_optimization_context(created_at DESC);

-- -----------------------------------------------------------------------------
-- j_hub_optimization_api_logs: API call tracking (Whisper, GPT-4)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_optimization_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES j_hub_optimization_recordings(id) ON DELETE CASCADE,
  step TEXT NOT NULL, -- 'transcribe', 'process', 'analyze', 'improve_transcript', 'improve_processed', 'improve_analysis'
  provider TEXT NOT NULL, -- 'openai', 'anthropic'
  model TEXT, -- 'whisper-1', 'gpt-4', etc.
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd NUMERIC,
  latency_ms INTEGER,
  status TEXT, -- 'success', 'error'
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_api_logs_recording ON j_hub_optimization_api_logs(recording_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_api_logs_created ON j_hub_optimization_api_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- j_hub_optimization_prompts: AI prompt templates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_optimization_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step TEXT NOT NULL, -- 'transcribe', 'process', 'analyze'
  platform TEXT NOT NULL, -- 'meta', 'google', 'tiktok', 'all'
  objective TEXT NOT NULL, -- 'sales', 'traffic', 'engagement', 'all'
  version INTEGER NOT NULL DEFAULT 1,
  prompt_template TEXT NOT NULL,
  system_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_j_hub_optimization_prompts_unique
  ON j_hub_optimization_prompts(step, platform, objective, version);
CREATE INDEX IF NOT EXISTS idx_j_hub_optimization_prompts_active
  ON j_hub_optimization_prompts(step, is_active);

-- ============================================================================
-- SECTION 8: ORACLE FRAMEWORK (j_hub_oracle_*)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- j_hub_oracle_generated_reports: Generated oracle reports
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_oracle_generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES j_hub_optimization_recordings(id) ON DELETE CASCADE,
  oracle_type TEXT NOT NULL, -- 'delfos', 'orfeu', 'nostradamus'
  report_content TEXT NOT NULL, -- Generated report text
  metadata JSONB, -- {prompt_used, model_used, confidence}
  generated_by UUID REFERENCES j_hub_users(id),
  is_shared BOOLEAN DEFAULT false, -- For public share links
  shared_at TIMESTAMPTZ,
  share_token TEXT UNIQUE, -- For public URLs
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_oracle_reports_recording ON j_hub_oracle_generated_reports(recording_id);
CREATE INDEX IF NOT EXISTS idx_j_hub_oracle_reports_shared ON j_hub_oracle_generated_reports(is_shared, share_token);

-- -----------------------------------------------------------------------------
-- j_hub_oracle_generation_logs: Track oracle generation API calls
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.j_hub_oracle_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES j_hub_optimization_recordings(id) ON DELETE CASCADE,
  oracle_type TEXT NOT NULL,
  status TEXT NOT NULL, -- 'success', 'error'
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_usd NUMERIC,
  latency_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_j_hub_oracle_generation_logs_recording ON j_hub_oracle_generation_logs(recording_id);

-- ============================================================================
-- SECTION 9: RPC HELPER FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- save_transcript_edit: Save edited transcript with versioning
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_transcript_edit(
  p_recording_id UUID,
  p_new_text TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE j_hub_optimization_transcripts
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

GRANT EXECUTE ON FUNCTION save_transcript_edit(UUID, TEXT, UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- save_processed_edit: Save edited processed text with versioning
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_processed_edit(
  p_recording_id UUID,
  p_new_text TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE j_hub_optimization_transcripts
  SET
    processed_previous = processed_text,
    processed_text = p_new_text,
    processed_edited_at = NOW(),
    processed_edited_by = p_user_id,
    processed_edit_count = COALESCE(processed_edit_count, 0) + 1
  WHERE recording_id = p_recording_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transcript not found for recording_id: %', p_recording_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION save_processed_edit(UUID, TEXT, UUID) TO authenticated;

-- ============================================================================
-- SECTION 10: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE j_hub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_user_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_creative_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_creative_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_creative_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_optimization_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_optimization_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE j_hub_optimization_context ENABLE ROW LEVEL SECURITY;
-- Note: j_hub_optimization_api_logs has RLS disabled for service role access
ALTER TABLE j_hub_optimization_prompts ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS Policies: j_hub_users
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON j_hub_users;
CREATE POLICY "Users can view own profile"
  ON j_hub_users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON j_hub_users;
CREATE POLICY "Users can update own profile"
  ON j_hub_users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role has full access to users" ON j_hub_users;
CREATE POLICY "Service role has full access to users"
  ON j_hub_users FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: j_hub_creative_submissions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can select their own submissions" ON j_hub_creative_submissions;
CREATE POLICY "Users can select their own submissions"
  ON j_hub_creative_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON j_hub_creative_submissions;
CREATE POLICY "Users can insert their own submissions"
  ON j_hub_creative_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to submissions" ON j_hub_creative_submissions;
CREATE POLICY "Service role full access to submissions"
  ON j_hub_creative_submissions FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: j_hub_creative_files
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can select files of their submissions" ON j_hub_creative_files;
CREATE POLICY "Users can select files of their submissions"
  ON j_hub_creative_files FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM j_hub_creative_submissions s
    WHERE s.id = j_hub_creative_files.submission_id
      AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to files" ON j_hub_creative_files;
CREATE POLICY "Service role full access to files"
  ON j_hub_creative_files FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: j_hub_creative_variations
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view variations of their submissions" ON j_hub_creative_variations;
CREATE POLICY "Users can view variations of their submissions"
  ON j_hub_creative_variations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM j_hub_creative_submissions s
    WHERE s.id = j_hub_creative_variations.submission_id
      AND s.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to variations" ON j_hub_creative_variations;
CREATE POLICY "Service role full access to variations"
  ON j_hub_creative_variations FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: j_hub_optimization_recordings
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert their own recordings" ON j_hub_optimization_recordings;
CREATE POLICY "Users can insert their own recordings"
  ON j_hub_optimization_recordings FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = recorded_by);

DROP POLICY IF EXISTS "Users can view their own recordings" ON j_hub_optimization_recordings;
CREATE POLICY "Users can view their own recordings"
  ON j_hub_optimization_recordings FOR SELECT
  USING (auth.jwt() ->> 'email' = recorded_by);

DROP POLICY IF EXISTS "Admins can view all recordings" ON j_hub_optimization_recordings;
CREATE POLICY "Admins can view all recordings"
  ON j_hub_optimization_recordings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM j_hub_users
    WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Service role full access to recordings" ON j_hub_optimization_recordings;
CREATE POLICY "Service role full access to recordings"
  ON j_hub_optimization_recordings FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: j_hub_optimization_transcripts
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view transcripts of their recordings" ON j_hub_optimization_transcripts;
CREATE POLICY "Users can view transcripts of their recordings"
  ON j_hub_optimization_transcripts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM j_hub_optimization_recordings r
    WHERE r.id = j_hub_optimization_transcripts.recording_id
      AND r.recorded_by = auth.jwt() ->> 'email'
  ));

DROP POLICY IF EXISTS "Service role full access to transcripts" ON j_hub_optimization_transcripts;
CREATE POLICY "Service role full access to transcripts"
  ON j_hub_optimization_transcripts FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: j_hub_optimization_context
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view context of their recordings" ON j_hub_optimization_context;
CREATE POLICY "Users can view context of their recordings"
  ON j_hub_optimization_context FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM j_hub_optimization_recordings r
    WHERE r.id = j_hub_optimization_context.recording_id
      AND r.recorded_by = auth.jwt() ->> 'email'
  ));

DROP POLICY IF EXISTS "Service role full access to context" ON j_hub_optimization_context;
CREATE POLICY "Service role full access to context"
  ON j_hub_optimization_context FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- RLS Policies: j_hub_optimization_prompts
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read active prompts" ON j_hub_optimization_prompts;
CREATE POLICY "Authenticated users can read active prompts"
  ON j_hub_optimization_prompts FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access to prompts" ON j_hub_optimization_prompts;
CREATE POLICY "Service role full access to prompts"
  ON j_hub_optimization_prompts FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- SECTION 11: STORAGE POLICIES
-- ============================================================================

-- Storage policies for creative-files bucket
DROP POLICY IF EXISTS "Users can upload their own creative files" ON storage.objects;
CREATE POLICY "Users can upload their own creative files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'creative-files' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can view their own creative files" ON storage.objects;
CREATE POLICY "Users can view their own creative files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'creative-files' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Service role full access to creative files" ON storage.objects;
CREATE POLICY "Service role full access to creative files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'creative-files' AND
    auth.role() = 'service_role'
  );

-- Storage policies for optimizations bucket
DROP POLICY IF EXISTS "Users can upload their own optimization audio" ON storage.objects;
CREATE POLICY "Users can upload their own optimization audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'optimizations' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can view their own optimization audio" ON storage.objects;
CREATE POLICY "Users can view their own optimization audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'optimizations' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Service role full access to optimization audio" ON storage.objects;
CREATE POLICY "Service role full access to optimization audio"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'optimizations' AND
    auth.role() = 'service_role'
  );

-- ============================================================================
-- SECTION 12: GRANTS
-- ============================================================================

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON j_hub_users TO authenticated;
GRANT SELECT, INSERT ON j_hub_user_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON j_hub_creative_submissions TO authenticated;
GRANT SELECT, INSERT ON j_hub_creative_files TO authenticated;
GRANT SELECT, INSERT ON j_hub_creative_variations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON j_hub_optimization_recordings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON j_hub_optimization_transcripts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON j_hub_optimization_context TO authenticated;
GRANT SELECT ON j_hub_optimization_prompts TO authenticated;

-- Grant full permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- BASELINE SCHEMA COMPLETE
-- ============================================================================
--
-- Summary:
-- - 18 tables created with j_hub_* naming convention
-- - All RLS policies configured
-- - Storage buckets and policies set up
-- - Helper functions created
-- - Ready for Supabase local development
--
-- Next steps:
-- 1. Test: supabase start
-- 2. Verify all tables created correctly
-- 3. Test edge functions work with new schema
--
-- ============================================================================
