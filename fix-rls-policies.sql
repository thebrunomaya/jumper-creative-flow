-- Script para corrigir políticas RLS da tabela j_ads_notion_managers
-- Execute este script no SQL Editor do Supabase

-- 1. Permitir que qualquer usuário leia a tabela (para verificação de whitelist)
CREATE POLICY "Allow anonymous read for whitelist check" ON j_ads_notion_managers
FOR SELECT USING (true);

-- 2. Verificar se a política foi criada
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'j_ads_notion_managers';