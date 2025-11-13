-- ============================================================================
-- DIAGNÓSTICO: "Database error saving new user" para yan@jumper.studio
-- ============================================================================
-- Erro: Edge Function j_hub_auth_roles falha ao criar registro em j_hub_users
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1️⃣ VERIFICAR SE YAN JÁ EXISTE EM j_hub_users (Registro Órfão)
SELECT
  '1️⃣ VERIFICAR REGISTRO ÓRFÃO' as diagnostico,
  id,
  email,
  role,
  nome,
  is_active,
  created_at,
  '❌ PROBLEMA: UUID já existe - Edge Function tenta criar duplicata' as possivel_causa
FROM j_hub_users
WHERE email = 'yan@jumper.studio';

-- Se retornar 1 linha: Yan já existe (registro órfão de tentativa anterior)
-- Se retornar 0 linhas: Yan não existe (problema é outra constraint)

-- 2️⃣ VERIFICAR SE EMAIL EXISTE COM UUID DIFERENTE (Duplicata)
SELECT
  '2️⃣ VERIFICAR EMAIL DUPLICADO' as diagnostico,
  COUNT(*) as total_registros,
  STRING_AGG(id::text, ', ') as uuids_encontrados,
  CASE
    WHEN COUNT(*) > 1 THEN '❌ PROBLEMA: Email duplicado com UUIDs diferentes'
    WHEN COUNT(*) = 1 THEN '✅ OK: Email único'
    ELSE '✅ OK: Email não existe'
  END as status
FROM j_hub_users
WHERE email = 'yan@jumper.studio';

-- 3️⃣ VERIFICAR YAN EM j_hub_notion_db_managers (Dependência FK)
SELECT
  '3️⃣ VERIFICAR FK DEPENDENCY (notion_manager_id)' as diagnostico,
  notion_id,
  "Nome",
  "E-Mail",
  CASE
    WHEN notion_id IS NOT NULL THEN '✅ OK: Yan existe em DB_Gerentes (FK válida)'
    ELSE '❌ PROBLEMA: Yan não existe em DB_Gerentes (FK violation se tentar usar)'
  END as status
FROM j_hub_notion_db_managers
WHERE "E-Mail" ILIKE '%yan%';

-- 4️⃣ VERIFICAR CONSTRAINTS DA TABELA j_hub_users
SELECT
  '4️⃣ CONSTRAINTS ATIVAS' as diagnostico,
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
  END as type_description,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'j_hub_users'::regclass
ORDER BY contype;

-- 5️⃣ VERIFICAR RLS POLICIES DE INSERT
SELECT
  '5️⃣ RLS POLICIES (INSERT)' as diagnostico,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'j_hub_users'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 6️⃣ VERIFICAR SE SERVICE_ROLE TEM PERMISSÃO
SELECT
  '6️⃣ SERVICE ROLE PERMISSIONS' as diagnostico,
  grantee,
  privilege_type,
  is_grantable,
  CASE
    WHEN privilege_type IN ('INSERT', 'ALL') THEN '✅ OK: Service role pode inserir'
    ELSE '⚠️ AVISO: Verificar se service role tem INSERT'
  END as status
FROM information_schema.role_table_grants
WHERE table_name = 'j_hub_users'
  AND grantee IN ('service_role', 'postgres')
ORDER BY grantee, privilege_type;

-- 7️⃣ VERIFICAR COLUNAS DA TABELA (Schema Check)
SELECT
  '7️⃣ SCHEMA DA TABELA j_hub_users' as diagnostico,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE
    WHEN is_nullable = 'NO' AND column_default IS NULL THEN '⚠️ REQUIRED (NOT NULL sem default)'
    WHEN is_nullable = 'NO' THEN '✅ REQUIRED (tem default)'
    ELSE '✅ OPTIONAL'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'j_hub_users'
ORDER BY ordinal_position;

-- 8️⃣ DIAGNÓSTICO FINAL
WITH checks AS (
  SELECT
    EXISTS(SELECT 1 FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_exists,
    (SELECT COUNT(*) FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_count,
    EXISTS(SELECT 1 FROM j_hub_notion_db_managers WHERE "E-Mail" ILIKE '%yan%') as in_db_gerentes,
    EXISTS(
      SELECT 1 FROM pg_policies
      WHERE tablename = 'j_hub_users'
        AND cmd = 'INSERT'
        AND 'service_role' = ANY(roles)
    ) as has_insert_policy
)
SELECT
  '8️⃣ DIAGNÓSTICO FINAL' as diagnostico,
  CASE
    WHEN user_count > 1 THEN '❌ ERRO: Email duplicado (' || user_count || ' registros)'
    WHEN user_exists THEN '❌ ERRO: Registro órfão existe (tentativa anterior falhou)'
    WHEN NOT in_db_gerentes THEN '⚠️ AVISO: Yan não está em DB_Gerentes (pode causar FK error se Edge Function usar notion_manager_id)'
    WHEN NOT has_insert_policy THEN '❌ ERRO: Sem RLS policy para service_role INSERT'
    ELSE '✅ DATABASE OK: Pronto para criar usuário'
  END as resultado,
  CASE
    WHEN user_count > 1 THEN 'DELETE duplicatas, manter apenas 1 registro'
    WHEN user_exists THEN 'DELETE registro órfão: DELETE FROM j_hub_users WHERE email=''yan@jumper.studio'''
    WHEN NOT in_db_gerentes THEN 'Adicionar Yan em DB_Gerentes do Notion OU modificar Edge Function para não usar notion_manager_id'
    WHEN NOT has_insert_policy THEN 'Criar policy: CREATE POLICY "Service role can insert" ON j_hub_users FOR INSERT TO service_role USING (true)'
    ELSE 'Verificar logs da Edge Function j_hub_auth_roles para erro específico'
  END as proxima_acao
FROM checks;

-- ============================================================================
-- PRÓXIMOS PASSOS APÓS RODAR ESTE SCRIPT:
-- ============================================================================
-- 1. Envie o resultado do item 8️⃣ (DIAGNÓSTICO FINAL)
-- 2. Eu te darei o comando SQL exato para corrigir
-- 3. Você roda o fix e Yan tenta login novamente
-- ============================================================================
