# 📋 POST-DEPLOY TESTING CHECKLIST - Jumper Hub Migration

**Session Date:** 2025-10-13
**Commit:** 40d442d
**Status:** ⏳ Awaiting GitHub → Supabase deployment + user validation

---

## 🎯 OBJETIVO

Validar que a consolidação de migrations (43 → 1) e renomeação de tabelas (`j_hub_creative_*`) foi deployada corretamente em produção e está funcionando sem erros.

---

## ⏳ PARTE 1: VERIFICAR DEPLOYMENT (2-5 minutos)

### 1.1 GitHub Actions (se configurado)
- [ ] Abrir: https://github.com/thebrunomaya/jumper-creative-flow/actions
- [ ] Verificar workflow rodou sem erros
- [ ] Status: ✅ Success

### 1.2 Supabase Dashboard - Migrations
- [ ] Abrir Supabase Dashboard
- [ ] Ir para: **Database → Migrations**
- [ ] Verificar migration baseline apareceu: `20250101000000_jumper_hub_baseline_schema.sql`

**⚠️ IMPORTANTE:**
- Se status = **"Failed"**: NORMAL! (tabelas já existiam em prod)
- Se status = **"Success"**: Ótimo! (baseline aplicada)
- **Em ambos os casos:** Continue testando! 🎯

### 1.3 Supabase Dashboard - Edge Functions
- [ ] Ir para: **Edge Functions**
- [ ] Verificar status: **"Deployed"** ✅
- [ ] Verificar timestamp: Deve ser após 2025-10-13 14:30
- [ ] Total de functions: ~18 functions

**Lista de Edge Functions esperadas:**
```
✅ j_ads_submit_ad
✅ j_hub_admin_dashboard
✅ j_hub_admin_users
✅ j_hub_auth_roles
✅ j_hub_manager_dashboard
✅ j_hub_user_accounts
✅ j_hub_notion_sync_*
✅ j_hub_optimization_* (7 functions)
```

---

## 🧪 PARTE 2: TESTES FUNCIONAIS (10-15 minutos)

### 2.1 Login e Navegação Básica
- [ ] Abrir: https://hub.jumper.studio
- [ ] Fazer login com sua conta
- [ ] Login funcionou sem erros? ✅
- [ ] Dashboard carregou corretamente? ✅

### 2.2 Sistema de Criativos (CRÍTICO - tabelas renomeadas)

**⚠️ ESTA É A ÁREA MAIS IMPORTANTE DO TESTE**

#### 2.2.1 Upload de Criativo (Gerente)
- [ ] Navegar para página de upload de criativo
- [ ] Preencher formulário básico:
  - Nome do criativo: "Teste Migration Cleanup"
  - Cliente: [selecionar qualquer]
  - Plataforma: Meta Ads
  - Adicionar 1 arquivo de imagem
- [ ] Clicar em "Enviar Criativo"
- [ ] **RESULTADO ESPERADO:** ✅ Submissão bem-sucedida
- [ ] **SE ERRO:** Copiar mensagem de erro completa

#### 2.2.2 Dashboard Admin (listar criativos)
- [ ] Acessar Dashboard Admin
- [ ] Verificar lista de criativos aparece
- [ ] **RESULTADO ESPERADO:** ✅ Criativos listados
- [ ] **SE ERRO:** Copiar mensagem de erro completa

#### 2.2.3 Aprovar/Publicar Criativo (Admin/Staff)
- [ ] Encontrar criativo de teste criado acima
- [ ] Tentar aprovar/publicar
- [ ] **RESULTADO ESPERADO:** ✅ Publicação bem-sucedida
- [ ] **SE ERRO:** Copiar mensagem de erro completa

### 2.3 Sistema de Optimization (opcional, mas recomendado)

#### 2.3.1 Gravar Áudio
- [ ] Navegar para Optimization System
- [ ] Iniciar gravação de áudio (pode ser teste rápido de 5s)
- [ ] Parar gravação
- [ ] **RESULTADO ESPERADO:** ✅ Upload bem-sucedido

#### 2.3.2 Ver Recordings
- [ ] Listar recordings
- [ ] **RESULTADO ESPERADO:** ✅ Lista aparece sem erros

### 2.4 User Management (Admin)
- [ ] Ir para Admin → Users
- [ ] Listar usuários
- [ ] **RESULTADO ESPERADO:** ✅ Lista aparece sem erros

---

## 🔍 PARTE 3: VERIFICAR LOGS (se houver erros)

### 3.1 Supabase Edge Function Logs
- [ ] Ir para: **Logs → Edge Functions**
- [ ] Filtrar por data: Hoje (2025-10-13)
- [ ] Procurar por mensagens de erro relacionadas a:
  - `j_ads_creative_submissions`
  - `j_ads_creative_files`
  - `j_ads_creative_variations`
  - `relation does not exist`
  - `table not found`

**Se encontrar erros:**
- [ ] Copiar mensagem completa do erro
- [ ] Anotar qual Edge Function causou o erro
- [ ] Anotar timestamp do erro

### 3.2 Browser Console (se houver erros no frontend)
- [ ] Abrir DevTools (F12)
- [ ] Ir para aba Console
- [ ] Verificar erros relacionados a Supabase queries
- [ ] Copiar erros se houver

---

## ✅ PARTE 4: RESULTADOS

### Cenário A: TUDO FUNCIONANDO ✅
- [ ] Todos os testes passaram
- [ ] Zero erros nos logs
- [ ] Sistema operando normalmente
- **Ação:** 🎉 Missão completa! Pode usar normalmente.

### Cenário B: Erros relacionados a tabelas antigas ❌
**Sintomas:**
- Erro: `relation "j_ads_creative_submissions" does not exist`
- Erro: `table "j_ads_creative_files" not found`

**Causa provável:** Produção tem tabelas antigas (`j_ads_creative_*`) que não foram renomeadas.

**Solução:**
1. Abrir Supabase Dashboard
2. Ir para SQL Editor
3. Executar rename manual:
```sql
-- Renomear tabelas creative
ALTER TABLE j_ads_creative_submissions RENAME TO j_hub_creative_submissions;
ALTER TABLE j_ads_creative_files RENAME TO j_hub_creative_files;
ALTER TABLE j_ads_creative_variations RENAME TO j_hub_creative_variations;

-- Atualizar constraints (se necessário)
ALTER TABLE j_hub_creative_files
  DROP CONSTRAINT IF EXISTS creative_files_submission_id_fkey;

ALTER TABLE j_hub_creative_files
  ADD CONSTRAINT j_hub_creative_files_submission_id_fkey
  FOREIGN KEY (submission_id)
  REFERENCES j_hub_creative_submissions(id)
  ON DELETE CASCADE;
```

### Cenário C: Outros erros ❌
**Ação:** Anotar mensagem completa de erro e reportar na próxima sessão.

---

## 📊 SUMÁRIO DE VALIDAÇÃO

**Data do teste:** ________________
**Hora:** ________________
**Testado por:** Bruno Maya

### Status por Sistema:

| Sistema | Status | Notas |
|---------|--------|-------|
| Login/Auth | [ ] ✅ [ ] ❌ | |
| Upload Criativo | [ ] ✅ [ ] ❌ | |
| Dashboard Admin | [ ] ✅ [ ] ❌ | |
| Publicação Criativo | [ ] ✅ [ ] ❌ | |
| Optimization | [ ] ✅ [ ] ❌ | |
| User Management | [ ] ✅ [ ] ❌ | |

### Resultado Geral:
- [ ] ✅ **APROVADO** - Sistema funcionando 100%
- [ ] ⚠️ **PARCIAL** - Alguns erros encontrados (detalhar abaixo)
- [ ] ❌ **REPROVADO** - Erros críticos impedem uso

### Erros Encontrados (se houver):
```
[Colar mensagens de erro aqui]
```

---

## 🚨 CONTATO PARA PRÓXIMA SESSÃO

**Se tudo funcionou:**
✅ Marcar como completo e seguir em frente!

**Se houve erros:**
❌ Trazer estas informações na próxima sessão:
1. Mensagens de erro completas (logs)
2. Qual funcionalidade falhou
3. Screenshots se possível
4. Este checklist preenchido

---

## 📌 CONTEXTO TÉCNICO

**O que foi feito nesta sessão:**
- Consolidadas 43 migrations em 1 baseline
- Renomeadas 3 tabelas: `creative_*` → `j_hub_creative_*`
- Atualizados 8 arquivos (Edge Functions + React)
- 58 referências de código atualizadas
- Commit: 40d442d
- Push: 2025-10-13 ~14:30

**Arquivos de referência:**
- `MIGRATION-CLEANUP-SUMMARY.md` - Resumo completo da sessão
- `supabase/migrations/20250101000000_jumper_hub_baseline_schema.sql` - Nova baseline
- `supabase/migrations/_archive_pre_baseline/README.md` - Histórico das 43 migrations antigas

---

**Tempo estimado para testes:** 15-20 minutos
**Melhor momento:** Logo após confirmar deploy no Supabase Dashboard
**Prioridade:** 🔥 ALTA - Validar antes de qualquer outro desenvolvimento
