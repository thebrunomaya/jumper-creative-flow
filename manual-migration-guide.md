# 🚀 Guia de Execução da Migration - Sistema de Error Tracking

## 📋 Resumo
Esta migration cria as tabelas necessárias para o sistema de error tracking robusto que implementamos.

## 🎯 O que será criado:
- ✅ **j_ads_error_logs** - Log estruturado de todos os erros
- ✅ **j_ads_system_metrics** - Métricas de saúde do sistema  
- ✅ **j_ads_fallback_submissions** - Fila de submissões para retry
- ✅ **Funções SQL** - Helpers para logging automático
- ✅ **Políticas RLS** - Segurança por papel (admin/manager)
- ✅ **Índices** - Performance otimizada para queries

## 🔧 Método 1: Execução Manual (Recomendado)

### Passo 1: Acessar Supabase Dashboard
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto do Jumper Ads
3. No menu lateral, clique em **"SQL Editor"**

### Passo 2: Executar Migration
1. Clique em **"New Query"**
2. Abra o arquivo: `supabase/migrations/20250817_create_error_tracking.sql`
3. Copie **TODO** o conteúdo (197 linhas)
4. Cole no SQL Editor
5. Clique em **"Run"** (Ctrl+Enter)

### Passo 3: Verificar Execução
Execute este SQL para verificar se funcionou:
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'j_ads_%';

-- Deve retornar:
-- j_ads_error_logs
-- j_ads_system_metrics  
-- j_ads_fallback_submissions
-- (+ suas tabelas existentes)
```

## 🤖 Método 2: Execução Programática

### Configurar .env primeiro:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### Executar:
```bash
node execute-migration.js
```

## 🧪 Testar o Sistema Após Migration

### 1. Verificar Tabelas:
```sql
SELECT COUNT(*) as total_error_logs FROM j_ads_error_logs;
SELECT COUNT(*) as total_metrics FROM j_ads_system_metrics;
SELECT COUNT(*) as total_fallbacks FROM j_ads_fallback_submissions;
```

### 2. Testar Função de Log:
```sql
SELECT log_system_error(
    'medium',
    'external_api', 
    'notion_api_test',
    'test_operation',
    'Test error message',
    '500',
    NULL,
    '{"test": true}'::jsonb
);
```

### 3. Verificar Permissions:
```sql
-- Como admin, deve funcionar:
SELECT * FROM j_ads_error_logs LIMIT 1;

-- Como manager, deve ver apenas próprios erros
```

## 🎉 Resultado Esperado

Após a execução bem-sucedida:

- ✅ **Sistema à prova de falhas** ativo
- ✅ **Error tracking** funcionando  
- ✅ **Fallback submissions** configurado
- ✅ **Admin dashboard** preparado
- ✅ **Logs estruturados** disponíveis

## 🚨 Se Algo Der Errado

### Erro de Permissão:
- Certifique-se de estar usando a **service_role key**
- Verifique se o usuário tem permissões de admin no projeto

### Tabela Já Existe:
- Normal se executar migration novamente
- Sistema detecta e ignora duplicatas

### Timeout:
- Execute em partes menores
- Primeiro: CREATE TABLE statements
- Depois: CREATE INDEX statements  
- Por último: Funções e políticas

## 🔄 Próximos Passos

Após migration bem-sucedida:

1. ✅ **Deploy Edge Functions** atualizadas
2. ✅ **Testar submissão** de criativo
3. ✅ **Monitorar logs** no admin dashboard
4. ✅ **Verificar fallbacks** funcionando

---

**⚠️ IMPORTANTE:** 
- Faça backup do banco antes de grandes migrations
- Teste em environment de dev primeiro
- A migration é **backward compatible** - não quebra funcionalidade existente