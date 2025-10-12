-- Migration: Add generated_reports column to j_hub_optimization_context
-- Purpose: Store generated oracle reports (DELFOS, ORFEU, NOSTRADAMUS)
-- Author: Claude Code + Bruno Maya
-- Date: 2025-10-12

-- Add generated_reports JSONB column to store oracle outputs
ALTER TABLE j_hub_optimization_context
ADD COLUMN IF NOT EXISTS generated_reports JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN j_hub_optimization_context.generated_reports IS
'Stores generated oracle reports in format:
{
  "delfos": "🏛️ DELFOS - Account Name...",
  "orfeu": "🎵 ORFEU - Account Name...",
  "nostradamus": "📜 NOSTRADAMUS - Account Name...",
  "generated_at": "2025-10-12T14:30:00Z",
  "last_oracle_used": "orfeu"
}';

-- Create index for faster queries on generated_reports existence
CREATE INDEX IF NOT EXISTS idx_optimization_context_has_reports
ON j_hub_optimization_context ((generated_reports <> '{}'::jsonb))
WHERE generated_reports <> '{}'::jsonb;

-- Create index for faster queries on last_oracle_used
CREATE INDEX IF NOT EXISTS idx_optimization_context_last_oracle
ON j_hub_optimization_context ((generated_reports->>'last_oracle_used'))
WHERE generated_reports->>'last_oracle_used' IS NOT NULL;
