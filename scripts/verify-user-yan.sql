-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO: yan@jumper.studio
-- ============================================================================
-- Execute no Supabase Dashboard > SQL Editor
-- Este script verifica se o usuário está cadastrado corretamente
-- ============================================================================

\echo '===================='
\echo 'VERIFICAÇÃO 1: Usuário em j_hub_users'
\echo '===================='
\echo 'Esperado: 1 linha com role=manager/admin, is_active=true'
\echo ''

SELECT
  id,
  email,
  role,
  nome,
  is_active,
  notion_manager_id,
  created_at,
  CASE
    WHEN role IN ('admin', 'manager') THEN '✅ Role OK (Staff)'
    WHEN role = 'supervisor' THEN '⚠️ Role Supervisor (pode ser OK)'
    ELSE '❌ Role incorreta (cliente)'
  END as status_role,
  CASE
    WHEN is_active THEN '✅ Usuário ativo'
    ELSE '❌ Usuário inativo'
  END as status_ativo
FROM j_hub_users
WHERE email = 'yan@jumper.studio';

\echo ''
\echo '===================='
\echo 'VERIFICAÇÃO 2: Yan como Gestor em contas'
\echo '===================='
\echo 'Esperado: Contas onde Yan aparece no campo "Gestor" (deve ter EMAIL, não nome)'
\echo ''

SELECT
  "Name" as account_name,
  "Gestor" as gestores,
  "Atendimento" as supervisores,
  CASE
    WHEN "Gestor" ILIKE '%yan@jumper.studio%' THEN '✅ Email no Gestor (correto)'
    WHEN "Gestor" ILIKE '%yan%' THEN '❌ Nome no Gestor (sync não rodou)'
    ELSE '⚠️ Yan não é Gestor'
  END as status_gestor,
  CASE
    WHEN "Atendimento" ILIKE '%yan@jumper.studio%' THEN '✅ Email no Atendimento (correto)'
    WHEN "Atendimento" ILIKE '%yan%' THEN '❌ Nome no Atendimento (sync não rodou)'
    ELSE '⚠️ Yan não é Atendimento'
  END as status_supervisor
FROM j_hub_notion_db_accounts
WHERE
  "Gestor" ILIKE '%yan%'
  OR "Atendimento" ILIKE '%yan%'
ORDER BY "Name";

\echo ''
\echo '===================='
\echo 'VERIFICAÇÃO 3: Yan em DB_Gerentes (Notion)'
\echo '===================='
\echo 'Esperado: 1 linha com dados do Yan'
\echo ''

SELECT
  "Nome",
  "E-Mail",
  "Função",
  CASE
    WHEN "E-Mail" = 'yan@jumper.studio' THEN '✅ Email correto'
    ELSE '❌ Email incorreto'
  END as status_email,
  CASE
    WHEN "Função" ILIKE '%admin%' THEN '✅ Função: Admin'
    WHEN "Função" ILIKE '%gestor%' THEN '✅ Função: Gestor'
    WHEN "Função" ILIKE '%manager%' THEN '✅ Função: Manager'
    ELSE '⚠️ Função: ' || COALESCE("Função", 'não definida')
  END as status_funcao
FROM j_hub_notion_db_managers
WHERE "E-Mail" ILIKE '%yan%';

\echo ''
\echo '===================='
\echo 'VERIFICAÇÃO 4: Contagem de contas acessíveis'
\echo '===================='
\echo 'Esperado: Número > 0 (Yan deve ter acesso a pelo menos algumas contas)'
\echo ''

WITH yan_as_gestor AS (
  SELECT notion_id, "Name"
  FROM j_hub_notion_db_accounts
  WHERE "Gestor" ILIKE '%yan@jumper.studio%'
),
yan_as_supervisor AS (
  SELECT notion_id, "Name"
  FROM j_hub_notion_db_accounts
  WHERE "Atendimento" ILIKE '%yan@jumper.studio%'
),
yan_user AS (
  SELECT id, role, notion_manager_id
  FROM j_hub_users
  WHERE email = 'yan@jumper.studio'
)
SELECT
  (SELECT COUNT(*) FROM yan_as_gestor) as contas_como_gestor,
  (SELECT COUNT(*) FROM yan_as_supervisor) as contas_como_supervisor,
  (SELECT role FROM yan_user) as role_atual,
  CASE
    WHEN (SELECT role FROM yan_user) = 'admin' THEN 'TODAS (Admin tem acesso total)'
    WHEN (SELECT COUNT(*) FROM yan_as_gestor) + (SELECT COUNT(*) FROM yan_as_supervisor) > 0 THEN
      '✅ ' || ((SELECT COUNT(*) FROM yan_as_gestor) + (SELECT COUNT(*) FROM yan_as_supervisor))::text || ' contas'
    ELSE '❌ Nenhuma conta acessível'
  END as status_acesso;

\echo ''
\echo '===================='
\echo 'VERIFICAÇÃO 5: Últimas tentativas de auth (Supabase Auth)'
\echo '===================='
\echo 'Esperado: Ver tentativas recentes de login'
\echo 'NOTA: Execute manualmente no Dashboard > Authentication > Logs'
\echo 'Filtro: email = yan@jumper.studio, last 7 days'
\echo ''

-- Não podemos consultar auth.users via SQL Editor (tabela protegida)
-- Instruções para verificação manual:
SELECT
  '⚠️ AÇÃO MANUAL NECESSÁRIA:' as aviso,
  'Dashboard > Authentication > Logs' as onde,
  'Filtrar por: yan@jumper.studio' as como,
  'Procurar: "Successful sign in" ou "Failed sign in"' as o_que_procurar;

\echo ''
\echo '===================='
\echo 'VERIFICAÇÃO 6: Edge Function logs (j_hub_auth_roles)'
\echo '===================='
\echo 'Esperado: Ver execução da Edge Function após login OAuth'
\echo 'NOTA: Execute manualmente no Dashboard > Edge Functions'
\echo ''

SELECT
  '⚠️ AÇÃO MANUAL NECESSÁRIA:' as aviso,
  'Dashboard > Edge Functions > j_hub_auth_roles > Logs' as onde,
  'Procurar por: "yan@jumper.studio"' as como,
  'Verificar: "Detecting role" ou "role: manager/admin"' as o_que_procurar;

\echo ''
\echo '===================='
\echo 'RESUMO DE DIAGNÓSTICO'
\echo '===================='
\echo ''

WITH diagnostico AS (
  SELECT
    EXISTS(SELECT 1 FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_exists,
    (SELECT role FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_role,
    (SELECT is_active FROM j_hub_users WHERE email = 'yan@jumper.studio') as user_active,
    EXISTS(
      SELECT 1 FROM j_hub_notion_db_accounts
      WHERE "Gestor" ILIKE '%yan@jumper.studio%' OR "Atendimento" ILIKE '%yan@jumper.studio%'
    ) as has_accounts,
    EXISTS(
      SELECT 1 FROM j_hub_notion_db_managers
      WHERE "E-Mail" ILIKE '%yan%'
    ) as in_db_gerentes
)
SELECT
  CASE
    WHEN NOT user_exists THEN '❌ PROBLEMA: Usuário NÃO existe em j_hub_users'
    WHEN user_role NOT IN ('admin', 'manager', 'supervisor') THEN '❌ PROBLEMA: Role incorreta (' || user_role || ')'
    WHEN NOT user_active THEN '❌ PROBLEMA: Usuário está inativo'
    WHEN NOT has_accounts THEN '⚠️ AVISO: Não aparece como Gestor/Atendimento em nenhuma conta'
    WHEN NOT in_db_gerentes THEN '⚠️ AVISO: Não está em DB_Gerentes do Notion'
    ELSE '✅ CADASTRO OK: Usuário existe, role correta, ativo, e tem contas'
  END as status_geral,
  CASE
    WHEN NOT user_exists THEN 'Yan nunca fez login com sucesso. Edge Function não rodou. Testar login após deploy do fix v2.1.37'
    WHEN user_role NOT IN ('admin', 'manager', 'supervisor') THEN 'Edge Function rodou mas atribuiu role errada. Verificar se contas têm EMAIL ou NOME no campo Gestor. Rodar sync do Notion.'
    WHEN NOT user_active THEN 'Usuário foi desativado. Atualizar is_active=true via SQL'
    WHEN NOT has_accounts THEN 'Usuário OK mas sem contas. Adicionar Yan como Gestor em pelo menos uma conta no Notion.'
    WHEN NOT in_db_gerentes THEN 'Usuário OK mas não está em DB_Gerentes. Pode impactar features futuras. Adicionar no Notion.'
    ELSE 'Nenhuma ação necessária no cadastro. Se login falhar, problema é de sessão/OAuth. Fazer logout completo e tentar novamente.'
  END as proxima_acao
FROM diagnostico;

\echo ''
\echo '===================='
\echo 'FIM DA VERIFICAÇÃO'
\echo '====================';
