-- Migration: Enable Storage RLS Policies for Local Development
-- Created: 2025-10-20
-- Purpose: Allow authenticated users and service role to upload/download files in storage buckets

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BUCKET: optimizations (audio recordings for optimization system)
-- ============================================================================

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Service role full access to optimizations" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload optimization audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view optimization audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete optimization audio" ON storage.objects;

-- Policy 1: Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access to optimizations"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'optimizations')
WITH CHECK (bucket_id = 'optimizations');

-- Policy 2: Authenticated users can upload files (any folder, organized by account_id)
CREATE POLICY "Authenticated users can upload optimization audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'optimizations');

-- Policy 3: Authenticated users can view files (any folder)
CREATE POLICY "Authenticated users can view optimization audio"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'optimizations');

-- Policy 4: Authenticated users can delete files (any folder)
CREATE POLICY "Authenticated users can delete optimization audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'optimizations');

-- ============================================================================
-- BUCKET: creative-files (creative submissions)
-- ============================================================================

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Service role full access to creative-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload creative files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view creative files" ON storage.objects;

-- Policy 1: Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access to creative-files"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'creative-files')
WITH CHECK (bucket_id = 'creative-files');

-- Policy 2: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload creative files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'creative-files');

-- Policy 3: Authenticated users can view files (public bucket)
CREATE POLICY "Authenticated users can view creative files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'creative-files');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects';

  RAISE NOTICE 'Storage RLS policies created successfully. Total policies: %', policy_count;
END $$;
