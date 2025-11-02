-- Seed para ambiente local
-- Executar após migrações: supabase db reset && supabase db seed

BEGIN;
SET CONSTRAINTS ALL DEFERRED;

-- 1) Usuários Auth (3 usuários)
-- Observação: no local, inserir direto em auth.users é ok para seed. Ajuste senhas/metadados conforme necessário.
-- Use UUIDs fixos para facilitar RLS e relacionamentos
-- admin, staff, client
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, email_confirmed_at, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com', '{"provider":"email","providers":["email"]}', '{"name":"Admin Test"}', now(), now(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, email_confirmed_at, role)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'staff@example.com', '{"provider":"email","providers":["email"]}', '{"name":"Staff Test"}', now(), now(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, email_confirmed_at, role)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'client@example.com', '{"provider":"email","providers":["email"]}', '{"name":"Client Test"}', now(), now(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 2) j_hub_users vinculados aos IDs do Auth
INSERT INTO public.j_hub_users (id, email, role, nome, created_at, updated_at, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com', 'admin', 'Admin Test', now(), now(), true),
  ('22222222-2222-2222-2222-222222222222', 'staff@example.com', 'staff', 'Staff Test', now(), now(), true),
  ('33333333-3333-3333-3333-333333333333', 'client@example.com', 'client', 'Client Test', now(), now(), true)
ON CONFLICT (id) DO NOTHING;

-- 3) Notion: managers e accounts mínimos (para FKs)
INSERT INTO public.j_hub_notion_db_managers (id, notion_id, "Nome", "E-Mail", "Função", created_at, updated_at)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'mgr_demo_1', 'Gestor Demo', 'gestor@example.com', 'Manager', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.j_hub_notion_db_accounts (id, notion_id, "Conta", "Status", "Tier", "Gestor", created_at, updated_at)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'acct_demo_1', 'Conta Demo 1', 'Ativo', 1, 'Gestor Demo', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 4) Fluxo principal de otimização (recording -> transcripts/context/extracts)
-- Recording
INSERT INTO public.j_hub_optimization_recordings
  (id, account_id, recorded_by, recorded_at, audio_file_path, duration_seconds,
   transcription_status, analysis_status, created_at, account_context, platform, selected_objectives,
   public_slug, share_enabled)
VALUES
  ('66666666-6666-6666-6666-666666666666', 'acct_demo_1', 'admin@example.com', now(),
   'recordings/demo1.mp3', 1200, 'completed', 'pending', now(),
   'Contexto breve do cliente demo', 'meta', ARRAY['leads','sales'], 'conta-demo-1-otimizacao-abc123', false)
ON CONFLICT (id) DO NOTHING;

-- Transcript (unique por recording)
INSERT INTO public.j_hub_optimization_transcripts
  (id, recording_id, full_text, language, confidence_score, segments, created_at, edit_count)
VALUES
  ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666',
   'Transcrição completa simulada para testes locais.',
   'pt', 0.92, '[{"start":0,"end":10,"text":"Olá time..."},{"start":10,"end":20,"text":"Resultados..."}]'::jsonb,
   now(), 0)
ON CONFLICT (id) DO NOTHING;

-- Context (unique por recording)
INSERT INTO public.j_hub_optimization_context
  (id, recording_id, account_id, summary, actions_taken, metrics_mentioned, strategy, timeline, confidence_level, client_report_generated, created_at)
VALUES
  ('88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', 'acct_demo_1',
   'Resumo organizado do áudio em bullets.', '[{"action":"ajuste_cpc","adset":"Remarketing"}]'::jsonb,
   '[{"metric":"CPA","value":"R$ 25"}]'::jsonb, '{"focus":"otimizar ROAS"}'::jsonb,
   '[{"week":"2025-W40","note":"testes criativos"}]'::jsonb,
   'high', false, now())
ON CONFLICT (id) DO NOTHING;

-- Extracts (unique por recording)
INSERT INTO public.j_hub_optimization_extracts
  (id, recording_id, extract_text, actions, edit_count, created_at, updated_at)
VALUES
  ('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666',
   'Resumo final com recomendações priorizadas.',
   '[{"priority":1,"what":"pausar criativos com baixo CTR"},{"priority":2,"what":"aumentar orçamento top performer"}]'::jsonb,
   0, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 5) Prompts base (um por tipo)
INSERT INTO public.j_hub_optimization_prompts
  (id, platform, objective, prompt_type, prompt_text, is_default, created_at, updated_at)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'meta', 'leads', 'transcribe', 'Contexto Whisper (exemplo)', true, now(), now()),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'meta', 'leads', 'process', 'Organize em bullets (exemplo)', true, now(), now()),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'meta', 'leads', 'analyze', 'Gere insights finais (exemplo)', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 6) Logs de API (RLS off, para inspeção)
INSERT INTO public.j_hub_optimization_api_logs
  (id, recording_id, step, model_used, tokens_used, latency_ms, success, created_at)
VALUES
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '66666666-6666-6666-6666-666666666666', 'transcribe', 'whisper-1', 50000, 120000, true, now()),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '66666666-6666-6666-6666-666666666666', 'process', 'claude-3-5', 3500, 8000, true, now()),
  ('bbbbbbb3-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '66666666-6666-6666-6666-666666666666', 'analyze', 'claude-3-5', 2500, 6000, true, now())
ON CONFLICT (id) DO NOTHING;

-- 7) Storage (opcional, caso sua app liste/valide objetos)
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('assets', 'assets', true, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.objects
  (id, bucket_id, name, owner_id, created_at, updated_at, last_accessed_at, metadata, version)
VALUES
  ('ccccccc1-cccc-cccc-cccc-ccccccccccc1', 'assets', 'recordings/demo1.mp3', NULL, now(), now(), now(),
   '{"mimetype":"audio/mpeg","size":12345}'::jsonb, 'v1')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Ajuste de sequences (se houver sequences inteiras)
-- Exemplo: SELECT setval(pg_get_serial_sequence('public.j_hub_optimization_api_logs','tokens_used'), COALESCE((SELECT MAX(tokens_used)::bigint FROM public.j_hub_optimization_api_logs),1), true);