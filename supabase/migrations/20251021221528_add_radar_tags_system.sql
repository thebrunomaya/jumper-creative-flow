/**
 * Add RADAR Tags System
 *
 * Changes:
 * 1. Add extract_format column to distinguish RADAR vs legacy formats
 * 2. Add tags JSONB column for structured tagging
 * 3. Create GIN index for efficient tag filtering
 * 4. Mark existing extracts as 'legacy' format
 * 5. Add comments for documentation
 */

-- Create ENUM for extract format
DO $$ BEGIN
  CREATE TYPE extract_format_type AS ENUM ('radar', 'legacy');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add extract_format column (defaults to 'radar' for new rows)
ALTER TABLE public.j_hub_optimization_extracts
  ADD COLUMN IF NOT EXISTS extract_format extract_format_type DEFAULT 'radar';

-- Add tags column (JSONB for flexible schema)
ALTER TABLE public.j_hub_optimization_extracts
  ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '{
    "registro": {"panorama": null, "gasto_atual": null},
    "anomalia": {"pontos_negativos": [], "pontos_positivos": []},
    "diagnostico": {},
    "acao": {"acoes_executadas": []},
    "resultado_esperado": {"proxima_acao": [], "expectativa_impacto": null}
  }'::jsonb;

-- Create GIN index for efficient tag querying
CREATE INDEX IF NOT EXISTS idx_optimization_extracts_tags
  ON public.j_hub_optimization_extracts USING GIN (tags);

-- Mark existing extracts as 'legacy' format (preserve backward compatibility)
UPDATE public.j_hub_optimization_extracts
  SET extract_format = 'legacy'
  WHERE extract_text IS NOT NULL AND extract_format IS NULL;

-- Add column comments
COMMENT ON COLUMN public.j_hub_optimization_extracts.extract_format IS
  'Format of the extract: radar (structured RADAR method) or legacy (old action list format)';

COMMENT ON COLUMN public.j_hub_optimization_extracts.tags IS
  'Structured tags for filtering and analysis. Schema: {registro: {panorama, gasto_atual}, anomalia: {pontos_negativos[], pontos_positivos[]}, diagnostico: {}, acao: {acoes_executadas[]}, resultado_esperado: {proxima_acao[], expectativa_impacto}}';
