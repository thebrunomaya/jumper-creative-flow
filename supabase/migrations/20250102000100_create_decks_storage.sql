-- Create Storage bucket for decks
-- Migration created: 2024-11-02

-- Create 'decks' bucket (public for easy sharing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'decks',
  'decks',
  true, -- Public bucket for generated HTML files
  10485760, -- 10MB limit per file
  ARRAY['text/html', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'decks' bucket

-- Policy: Authenticated users can upload files to their own folder
CREATE POLICY "Users can upload own decks"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'decks'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Authenticated users can update files in their own folder
CREATE POLICY "Users can update own decks"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'decks'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Authenticated users can delete files in their own folder
CREATE POLICY "Users can delete own decks"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'decks'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Anyone can view files in public bucket (for sharing)
CREATE POLICY "Public decks are viewable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'decks');

-- Add comment for documentation
COMMENT ON COLUMN storage.buckets.name IS 'decks bucket stores generated HTML presentations and PDFs';
