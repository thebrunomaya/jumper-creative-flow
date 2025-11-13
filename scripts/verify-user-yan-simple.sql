-- ============================================================================
-- VERIFICAÇÃO RÁPIDA: yan@jumper.studio (Copie e cole no Supabase Dashboard)
-- ============================================================================

-- 1. Usuário em j_hub_users
SELECT
  '1️⃣ USUÁRIO EM J_HUB_USERS' as verificacao,
  id,
  email,
  role,
  nome,
  is_active,
  created_at
FROM j_hub_users
WHERE email = 'yan@jumper.studio';

-- 2. Yan como Gestor em contas
SELECT
  '2️⃣ CONTAS ONDE YAN É GESTOR/ATENDIMENTO' as verificacao,
  "Name" as account_name,
  "Gestor" as gestores,
  "Atendimento" as supervisores
FROM j_hub_notion_db_accounts
WHERE "Gestor" ILIKE '%yan%' OR "Atendimento" ILIKE '%yan%'
ORDER BY "Name"
LIMIT 10;

-- 3. Yan em DB_Gerentes
SELECT
  '3️⃣ YAN EM DB_GERENTES (NOTION)' as verificacao,
  "Nome",
  "E-Mail",
  "Função"
FROM j_hub_notion_db_managers
WHERE "E-Mail" ILIKE '%yan%';

-- 4. Diagnóstico automático
WITH diagnostico AS (
  SELECT
    EXISTS(SELECT 1 FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_exists,
    (SELECT role FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_role,
    (SELECT is_active FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_active,
    EXISTS(
      SELECT 1 FROM j_hub_notion_db_accounts
      WHERE "Gestor" ILIKE '%yan@jumper.studio%' OR "Atendimento" ILIKE '%yan@jumper.studio%'
    ) as has_accounts
)
SELECT
  '4️⃣ DIAGNÓSTICO' as verificacao,
  CASE
    WHEN NOT user_exists THEN '❌ Usuário NÃO existe - Nunca fez login'
    WHEN user_role NOT IN ('admin', 'manager', 'supervisor') THEN '❌ Role incorreta: ' || user_role
    WHEN NOT user_active THEN '❌ Usuário INATIVO'
    WHEN NOT has_accounts THEN '⚠️ Sem contas - Sync do Notion não rodou'
    ELSE '✅ TUDO OK'
  END as status,
  CASE
    WHEN NOT user_exists THEN 'Testar login após deploy v2.1.37'
    WHEN user_role NOT IN ('admin', 'manager', 'supervisor') THEN 'Rodar sync do Notion'
    WHEN NOT user_active THEN 'UPDATE j_hub_users SET is_active=true WHERE email=''yan@jumper.studio'''
    WHEN NOT has_accounts THEN 'Verificar campo Gestor tem EMAIL (não NOME)'
    ELSE 'Logout + Login via Notion'
  END as proxima_acao
FROM diagnostico;
