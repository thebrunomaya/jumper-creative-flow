
-- Recriar o registro da gravação deletada da conta RioCard
INSERT INTO public.j_ads_optimization_recordings (
  id,
  account_id,
  audio_file_path,
  recorded_by,
  recorded_at,
  created_at,
  duration_seconds,
  transcription_status,
  analysis_status,
  platform,
  account_context,
  override_context,
  selected_objectives
) VALUES (
  '5427a051-8e7c-4c06-afc9-737be21a242e',
  '162db609-4968-80df-830a-f17e87989106',
  'optimizations/162db609-4968-80df-830a-f17e87989106/2025-10-07T20-27-01-341Z.webm',
  'bruno@maya.company',
  '2025-10-07 20:27:02+00',
  '2025-10-07 20:27:02+00',
  0,
  'pending',
  'pending',
  'meta',
  NULL,
  NULL,
  ARRAY['Engajamento', 'Seguidores', 'Tráfego']
);
