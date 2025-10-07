-- Adicionar 'revised' aos valores permitidos em confidence_level
ALTER TABLE j_ads_optimization_context
DROP CONSTRAINT IF EXISTS j_ads_optimization_context_confidence_level_check;

ALTER TABLE j_ads_optimization_context
ADD CONSTRAINT j_ads_optimization_context_confidence_level_check
CHECK (confidence_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text, 'revised'::text]));