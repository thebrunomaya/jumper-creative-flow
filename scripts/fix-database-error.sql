-- ============================================================================
-- CORREÇÃO: "Database error saving new user" para yan@jumper.studio
-- ============================================================================
-- ⚠️ ATENÇÃO: Execute APENAS a seção apropriada baseada no diagnóstico
-- ⚠️ Não execute todas as queries de uma vez - escolha o fix correto
-- ============================================================================

-- ============================================================================
-- FIX A: DELETAR REGISTRO ÓRFÃO
-- ============================================================================
-- Use quando: Diagnóstico mostrou "Registro órfão existe"
-- Sintoma: Yan existe em j_hub_users mas login OAuth falha
-- Causa: Tentativa anterior criou registro incompleto
-- ============================================================================

-- CONFIRMAR ANTES DE DELETAR:
SELECT
  'PREVIEW: Registro que será deletado' as aviso,
  id,
  email,
  role,
  nome,
  created_at
FROM j_hub_users
WHERE email = 'yan@jumper.studio';

-- SE CONFIRMAR QUE É REGISTRO ÓRFÃO, EXECUTE:
-- DELETE FROM j_hub_users WHERE email = 'yan@jumper.studio';

-- DEPOIS: Yan tenta login via Notion novamente


-- ============================================================================
-- FIX B: DELETAR DUPLICATAS (Manter Mais Recente)
-- ============================================================================
-- Use quando: Diagnóstico mostrou "Email duplicado"
-- Sintoma: Múltiplos registros com mesmo email
-- Causa: Tentativas múltiplas criaram registros duplicados
-- ============================================================================

-- CONFIRMAR DUPLICATAS:
SELECT
  'PREVIEW: Duplicatas encontradas' as aviso,
  id,
  email,
  role,
  nome,
  created_at,
  CASE
    WHEN created_at = (SELECT MAX(created_at) FROM j_hub_users WHERE email = 'yan@jumper.studio')
      THEN '✅ MANTER (mais recente)'
    ELSE '❌ DELETAR (antigo)'
  END as acao
FROM j_hub_users
WHERE email = 'yan@jumper.studio'
ORDER BY created_at DESC;

-- SE CONFIRMAR, DELETAR REGISTROS ANTIGOS (MANTÉM MAIS RECENTE):
-- DELETE FROM j_hub_users
-- WHERE email = 'yan@jumper.studio'
--   AND created_at < (SELECT MAX(created_at) FROM j_hub_users WHERE email = 'yan@jumper.studio');

-- DEPOIS: Yan tenta login via Notion novamente


-- ============================================================================
-- FIX C: CRIAR RLS POLICY PARA SERVICE_ROLE
-- ============================================================================
-- Use quando: Diagnóstico mostrou "Sem RLS policy para service_role INSERT"
-- Sintoma: Edge Function não consegue inserir em j_hub_users
-- Causa: RLS ativa mas sem policy permitindo INSERT via service_role
-- ============================================================================

-- VERIFICAR POLICIES ATUAIS:
SELECT
  'PREVIEW: Policies atuais de INSERT' as aviso,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'j_hub_users'
  AND cmd = 'INSERT';

-- SE NÃO EXISTIR POLICY PARA SERVICE_ROLE, CRIAR:
-- CREATE POLICY "Service role can insert users"
-- ON j_hub_users
-- FOR INSERT
-- TO service_role
-- WITH CHECK (true);

-- DEPOIS: Yan tenta login via Notion novamente


-- ============================================================================
-- FIX D: INSERIR YAN EM DB_GERENTES (Se FK Exigida)
-- ============================================================================
-- Use quando: Diagnóstico mostrou "Yan não está em DB_Gerentes"
-- Sintoma: Edge Function falha ao tentar setar notion_manager_id
-- Causa: FK constraint exige que notion_manager_id exista em j_hub_notion_db_managers
-- ============================================================================

-- VERIFICAR SE YAN EXISTE:
SELECT
  'PREVIEW: Yan em DB_Gerentes' as aviso,
  notion_id,
  "Nome",
  "E-Mail",
  "Função"
FROM j_hub_notion_db_managers
WHERE "E-Mail" ILIKE '%yan%';

-- SE NÃO EXISTIR, VERIFICAR SE EDGE FUNCTION USA notion_manager_id:
SELECT
  '⚠️ VERIFICAÇÃO NECESSÁRIA' as aviso,
  'Checar Edge Function j_hub_auth_roles/index.ts' as onde,
  'Ver se INSERT inclui notion_manager_id' as o_que,
  'Se sim, adicionar Yan no Notion DB_Gerentes ANTES' as acao;

-- OPÇÃO ALTERNATIVA: Modificar Edge Function para NÃO usar notion_manager_id
-- (notion_manager_id é usado apenas para clientes/gerentes, não para @jumper.studio)


-- ============================================================================
-- FIX E: RESET COMPLETO (Última Opção)
-- ============================================================================
-- Use quando: Todos os outros fixes falharam
-- Sintoma: Database em estado inconsistente
-- Causa: Múltiplos problemas simultâneos
-- ============================================================================

-- BACKUP PRIMEIRO (se houver dados importantes):
-- SELECT * FROM j_hub_users WHERE email = 'yan@jumper.studio';

-- RESET:
-- DELETE FROM j_hub_users WHERE email = 'yan@jumper.studio';
-- DELETE FROM auth.users WHERE email = 'yan@jumper.studio'; -- ⚠️ CUIDADO: Deleta auth completo

-- RECRIAR POLICIES (se necessário):
-- DROP POLICY IF EXISTS "Service role can insert users" ON j_hub_users;
-- CREATE POLICY "Service role can insert users"
-- ON j_hub_users FOR INSERT TO service_role WITH CHECK (true);

-- DEPOIS: Yan tenta login via Notion novamente (primeiro acesso completo)


-- ============================================================================
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- ============================================================================
-- Execute após aplicar qualquer fix para confirmar correção:

SELECT
  'VERIFICAÇÃO PÓS-FIX' as status,
  EXISTS(SELECT 1 FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_exists,
  (SELECT COUNT(*) FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_count,
  (SELECT role FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_role,
  (SELECT is_active FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_active,
  CASE
    WHEN NOT EXISTS(SELECT 1 FROM j_hub_users WHERE email = 'yan@jumper.studio') THEN '✅ LIMPO: Pronto para novo login'
    WHEN (SELECT COUNT(*) FROM j_hub_users WHERE email = 'yan@jumper.studio') > 1 THEN '❌ PROBLEMA: Ainda tem duplicatas'
    WHEN (SELECT role FROM j_hub_users WHERE email = 'yan@jumper.studio') IN ('admin', 'manager') THEN '✅ OK: Usuário configurado corretamente'
    ELSE '⚠️ AVISO: Verificar role'
  END as resultado;

-- ============================================================================
-- DEPOIS DE APLICAR O FIX:
-- ============================================================================
-- 1. Executar VERIFICAÇÃO PÓS-FIX (acima)
-- 2. Confirmar resultado = "✅ LIMPO" ou "✅ OK"
-- 3. Yan faz logout completo (Dashboard > Authentication > Yan > Sign Out)
-- 4. Yan tenta login via Notion novamente
-- 5. Verificar logs da Edge Function j_hub_auth_roles
-- ============================================================================
