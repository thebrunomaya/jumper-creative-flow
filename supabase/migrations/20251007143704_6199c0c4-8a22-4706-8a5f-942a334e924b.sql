-- Add revised_at column to j_ads_optimization_context for tracking manual edits
ALTER TABLE j_ads_optimization_context
ADD COLUMN revised_at timestamptz;