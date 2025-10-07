-- Add account_context column to j_ads_optimization_recordings
ALTER TABLE public.j_ads_optimization_recordings 
ADD COLUMN account_context TEXT;