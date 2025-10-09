-- ============================================================================
-- OPTIMIZER Branch - Week 1 MVP
-- Audio recording tables and storage
-- ============================================================================

-- Create bucket for optimization audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('optimizations', 'optimizations', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TABLE: j_ads_optimization_recordings
-- Stores metadata for audio recordings
-- ============================================================================

CREATE TABLE IF NOT EXISTS j_ads_optimization_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  recorded_by TEXT NOT NULL,           -- Email do gestor que gravou
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Audio metadata
  audio_file_path TEXT,                -- Path no Supabase Storage
  duration_seconds INT,

  -- Processing status
  transcription_status TEXT DEFAULT 'pending',  -- pending | processing | completed | failed
  analysis_status TEXT DEFAULT 'pending',       -- pending | processing | completed | failed

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  FOREIGN KEY (account_id) REFERENCES j_ads_notion_db_accounts(notion_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recordings_account ON j_ads_optimization_recordings(account_id);
CREATE INDEX IF NOT EXISTS idx_recordings_date ON j_ads_optimization_recordings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON j_ads_optimization_recordings(transcription_status, analysis_status);

-- ============================================================================
-- RLS POLICIES for j_ads_optimization_recordings
-- ============================================================================

ALTER TABLE j_ads_optimization_recordings ENABLE ROW LEVEL SECURITY;

-- Users can insert their own recordings
DROP POLICY IF EXISTS "Users can insert their own recordings" ON j_ads_optimization_recordings;
CREATE POLICY "Users can insert their own recordings"
ON j_ads_optimization_recordings
FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'email' = recorded_by
);

-- Users can view recordings they created
DROP POLICY IF EXISTS "Users can view their own recordings" ON j_ads_optimization_recordings;
CREATE POLICY "Users can view their own recordings"
ON j_ads_optimization_recordings
FOR SELECT
USING (
  auth.jwt() ->> 'email' = recorded_by
);

-- Admins can view all recordings
DROP POLICY IF EXISTS "Admins can view all recordings" ON j_ads_optimization_recordings;
CREATE POLICY "Admins can view all recordings"
ON j_ads_optimization_recordings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update recordings (for processing status)
DROP POLICY IF EXISTS "Admins can update recordings" ON j_ads_optimization_recordings;
CREATE POLICY "Admins can update recordings"
ON j_ads_optimization_recordings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- STORAGE POLICIES for optimizations bucket
-- ============================================================================

-- Users can upload audio to their own folder
DROP POLICY IF EXISTS "Users can upload their own optimization audio" ON storage.objects;
CREATE POLICY "Users can upload their own optimization audio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'optimizations' AND
  auth.role() = 'authenticated'
);

-- Users can view their own recordings
DROP POLICY IF EXISTS "Users can view their own optimization audio" ON storage.objects;
CREATE POLICY "Users can view their own optimization audio"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'optimizations' AND
  auth.role() = 'authenticated'
);

-- Users can delete their own recordings
DROP POLICY IF EXISTS "Users can delete their own optimization audio" ON storage.objects;
CREATE POLICY "Users can delete their own optimization audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'optimizations' AND
  auth.role() = 'authenticated'
);

-- Admins can view all optimization audio
DROP POLICY IF EXISTS "Admins can view all optimization audio" ON storage.objects;
CREATE POLICY "Admins can view all optimization audio"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'optimizations' AND
  EXISTS (
    SELECT 1 FROM j_ads_users
    WHERE id = auth.uid() AND role = 'admin'
  )
);