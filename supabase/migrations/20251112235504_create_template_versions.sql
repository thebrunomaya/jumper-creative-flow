-- Create table for storing template version history
CREATE TABLE IF NOT EXISTS j_hub_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  html_content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,

  -- Ensure unique version numbers per template
  UNIQUE(template_id, version_number)
);

-- Index for faster lookups
CREATE INDEX idx_template_versions_template_id ON j_hub_template_versions(template_id);
CREATE INDEX idx_template_versions_created_at ON j_hub_template_versions(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE j_hub_template_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all versions
CREATE POLICY "Admins can view template versions"
  ON j_hub_template_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
      AND j_hub_users.role = 'admin'
    )
  );

-- Policy: Admins can insert new versions
CREATE POLICY "Admins can create template versions"
  ON j_hub_template_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM j_hub_users
      WHERE j_hub_users.id = auth.uid()
      AND j_hub_users.role = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE j_hub_template_versions IS 'Stores version history for deck templates, allowing rollback and comparison';
COMMENT ON COLUMN j_hub_template_versions.template_id IS 'Template filename without .html extension (e.g. koko-classic)';
COMMENT ON COLUMN j_hub_template_versions.version_number IS 'Sequential version number, increments with each save';
COMMENT ON COLUMN j_hub_template_versions.html_content IS 'Complete HTML snapshot of template at this version';
COMMENT ON COLUMN j_hub_template_versions.description IS 'Optional description of changes made in this version';
