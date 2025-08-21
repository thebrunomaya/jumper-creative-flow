-- Script SQL para adicionar managers de teste
-- Execute este script no SQL Editor do Supabase

-- Inserir managers de teste
INSERT INTO j_ads_notion_managers (email, name, notion_id, role)
VALUES 
  ('gerente.teste@empresa.com', 'Gerente Teste', 'test-notion-id-1', 'gerente'),
  ('maria.silva@jumper.studio', 'Maria Silva', 'test-notion-id-2', 'supervisor'),
  ('joao.santos@parceiro.com', 'João Santos', 'test-notion-id-3', 'gerente')
ON CONFLICT (email) 
DO UPDATE SET 
  name = EXCLUDED.name,
  notion_id = EXCLUDED.notion_id,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verificar se foram inseridos
SELECT * FROM j_ads_notion_managers;