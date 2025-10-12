# 🚀 Jumper Ads Platform v2.0 - Migration Plan

**Objetivo:** Migrar toda nomenclatura de `j_ads_*` para `j_hub_*` para refletir o rebranding para **Jumper Hub**.

**Data de início:** 2025-10-12
**Versão atual:** v1.95 (j_ads_* + j_hub_optimization_*)
**Versão alvo:** v2.0 (100% j_hub_*)

---

## 📊 Inventário Atual

### **Edge Functions (17 total)**

#### ✅ Já migradas (8 - sistema de otimização):
- `j_hub_optimization_transcribe`
- `j_hub_optimization_process`
- `j_hub_optimization_analyze`
- `j_hub_optimization_improve_transcript`
- `j_hub_optimization_improve_processed`
- `j_hub_optimization_update_context`
- `j_hub_optimization_view_shared`
- `j_hub_optimization_create_share`

#### ⚠️ A migrar (9 - outros sistemas):
1. `j_ads_admin_dashboard` → `j_hub_admin_dashboard`
2. `j_ads_admin_users` → `j_hub_admin_users`
3. `j_ads_auth_roles` → `j_hub_auth_roles`
4. `j_ads_manager_dashboard` → `j_hub_manager_dashboard`
5. `j_ads_user_accounts` → `j_hub_user_accounts`
6. `j_ads_notion_sync_accounts` → `j_hub_notion_sync_accounts`
7. `j_ads_notion_sync_managers` → `j_hub_notion_sync_managers`
8. `j_ads_notion_sync_scheduler` → `j_hub_notion_sync_scheduler`
9. `j_ads_submit_ad` → `j_hub_creative_submit`

---

### **Database Tables (~30+ tabelas)**

#### ✅ Já migradas (sistema de otimização):
- `j_ads_optimization_recordings`
- `j_ads_optimization_transcripts`
- `j_ads_optimization_context`
- `j_ads_optimization_prompts`
- `j_ads_optimization_api_logs`
- `j_ads_optimization_shares`

#### ⚠️ A migrar (por sistema):

**Core User Management:**
- `j_ads_users` → `j_hub_users` ⭐ **CRITICAL**
- `j_ads_user_audit_log` → `j_hub_user_audit_log`

**Creative System:**
- `j_ads_creative_submissions` → `j_hub_creative_submissions`
- `j_ads_creative_files` → `j_hub_creative_files`
- `j_ads_creative_variations` → `j_hub_creative_variations`

**Notion Sync:**
- `j_ads_notion_db_managers` → `j_hub_notion_managers`
- `j_ads_notion_db_accounts` → `j_hub_notion_accounts`
- `j_ads_notion_db_partners` → `j_hub_notion_partners`
- `j_ads_notion_sync_logs` → `j_hub_notion_sync_logs`

**Reports System:**
- `j_rep_metaads_bronze` → `j_hub_reports_metaads_bronze`

**System Health:**
- `j_ads_error_logs` → `j_hub_error_logs`
- `j_ads_metrics` → `j_hub_metrics`

---

## 🎯 Estratégia de Migração

### **Princípios:**
1. ✅ **Zero downtime** - Sistema nunca para
2. ✅ **Backwards compatibility** - Manter ambas nomenclaturas temporariamente
3. ✅ **Incremental rollout** - Migrar por sistema, não tudo de uma vez
4. ✅ **Easy rollback** - Possível reverter em caso de problemas

### **Abordagem: Database Views + Gradual Migration**

```
FASE 1: CREATE VIEWS (aliases)
  j_hub_users → VIEW → j_ads_users

FASE 2: UPDATE CODE
  Substituir todas referências de j_ads_* → j_hub_*

FASE 3: DUAL WRITE
  Gravar em ambas as tabelas temporariamente

FASE 4: MIGRATE DATA
  Copiar dados históricos j_ads_* → j_hub_*

FASE 5: CUTOVER
  Apontar views para novas tabelas

FASE 6: CLEANUP
  Deletar tabelas antigas j_ads_*
```

---

## 📋 Plano de Execução Detalhado

### **FASE 0: Preparação (1-2 horas)**

**Objetivo:** Documentar dependências e criar plano de rollback

#### Tasks:
- [ ] Mapear todas as referências de `j_ads_*` no código (grep completo)
- [ ] Identificar foreign keys entre tabelas
- [ ] Criar backup completo do banco antes da migração
- [ ] Documentar ordem de dependências das tabelas
- [ ] Criar script de rollback automático

**Deliverables:**
- `MIGRATION-DEPENDENCIES.md` com mapa completo
- `rollback-v2.0.sql` script pronto

---

### **FASE 1: Edge Functions Migration (2-3 horas)**

**Objetivo:** Renomear todas as 9 edge functions restantes

#### Sistema 1: Admin & Auth (CRITICAL - fazer primeiro)
```
j_ads_admin_dashboard → j_hub_admin_dashboard
j_ads_admin_users → j_hub_admin_users
j_ads_auth_roles → j_hub_auth_roles
```

**Impacto:**
- Admin.tsx (dashboard)
- AdminUsers.tsx (user management)
- useUserRole.ts (RPC has_role)

**Steps:**
1. Renomear diretórios localmente
2. Atualizar referências no código
3. Deploy novas funções para Supabase
4. Testar funcionalidade admin
5. Deletar funções antigas
6. Commit + Push

---

#### Sistema 2: Manager & Accounts
```
j_ads_manager_dashboard → j_hub_manager_dashboard
j_ads_user_accounts → j_hub_user_accounts
```

**Impacto:**
- Manager.tsx
- useMyNotionAccounts.ts
- CreativeSystem.tsx

**Steps:** (mesmos de Sistema 1)

---

#### Sistema 3: Notion Sync
```
j_ads_notion_sync_accounts → j_hub_notion_sync_accounts
j_ads_notion_sync_managers → j_hub_notion_sync_managers
j_ads_notion_sync_scheduler → j_hub_notion_sync_scheduler
```

**Impacto:**
- NotionSyncControl.tsx
- systemHealth.ts
- Cron jobs (scheduled functions)

**Steps:** (mesmos de Sistema 1)

---

#### Sistema 4: Creative Submit
```
j_ads_submit_ad → j_hub_creative_submit
```

**Impacto:**
- CreativeSystem.tsx (main submission flow)
- Step4.tsx
- Resilience system (fallback logic)

**⚠️ CRITICAL:** Esta é a função mais complexa (1000+ linhas com retry logic)

**Steps:**
1. Renomear função
2. Atualizar referências
3. **Testar completamente** o fluxo de submissão
4. Deploy
5. Monitorar logs por 1 hora
6. Se OK, deletar antiga

---

### **FASE 2: Database Tables Migration (4-6 horas)**

**Objetivo:** Criar views de compatibilidade e novas tabelas

#### **Sistema 1: Core Users (CRITICAL - fazer primeiro)**

**Tabelas:**
- `j_ads_users` → `j_hub_users`
- `j_ads_user_audit_log` → `j_hub_user_audit_log`

**Migration Script:**
```sql
-- Step 1: Create new table with exact same structure
CREATE TABLE j_hub_users (LIKE j_ads_users INCLUDING ALL);

-- Step 2: Copy all data
INSERT INTO j_hub_users SELECT * FROM j_ads_users;

-- Step 3: Create view for backwards compatibility
CREATE OR REPLACE VIEW j_ads_users AS SELECT * FROM j_hub_users;

-- Step 4: Create triggers to keep both in sync (temporary)
CREATE OR REPLACE FUNCTION sync_users_table()
RETURNS TRIGGER AS $$
BEGIN
  -- Dual write logic
  IF TG_OP = 'INSERT' THEN
    -- Insert happens on new table, no action needed
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update happens on new table, no action needed
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Code Updates:**
- Update all `.from('j_ads_users')` → `.from('j_hub_users')`
- Update all RPC functions referencing j_ads_users
- Update all foreign keys

**Testing Checklist:**
- [ ] Login still works
- [ ] Role checking works (has_role RPC)
- [ ] User creation works
- [ ] User updates work
- [ ] Admin panel works
- [ ] Audit logs work

---

#### **Sistema 2: Creative System**

**Tabelas:**
- `j_ads_creative_submissions` → `j_hub_creative_submissions`
- `j_ads_creative_files` → `j_hub_creative_files`
- `j_ads_creative_variations` → `j_hub_creative_variations`

**Ordem de migração:**
1. `j_hub_creative_submissions` (parent)
2. `j_hub_creative_files` (child - FK submissions)
3. `j_hub_creative_variations` (child - FK submissions)

**Migration Script Template:**
```sql
-- 1. Create new table
CREATE TABLE j_hub_creative_submissions (
  LIKE j_ads_creative_submissions INCLUDING ALL
);

-- 2. Migrate data
INSERT INTO j_hub_creative_submissions
SELECT * FROM j_ads_creative_submissions;

-- 3. Create backwards compat view
CREATE OR REPLACE VIEW j_ads_creative_submissions AS
SELECT * FROM j_hub_creative_submissions;

-- 4. Update foreign keys
ALTER TABLE j_hub_creative_files
  ADD CONSTRAINT fk_submission
  FOREIGN KEY (submission_id)
  REFERENCES j_hub_creative_submissions(id);
```

**Testing Checklist:**
- [ ] Creative submission works
- [ ] File upload works
- [ ] Variations save correctly
- [ ] Admin can publish
- [ ] Manager can view submissions

---

#### **Sistema 3: Notion Sync**

**Tabelas:**
- `j_ads_notion_db_managers` → `j_hub_notion_managers`
- `j_ads_notion_db_accounts` → `j_hub_notion_accounts`
- `j_ads_notion_db_partners` → `j_hub_notion_partners`
- `j_ads_notion_sync_logs` → `j_hub_notion_sync_logs`

**⚠️ SPECIAL CONSIDERATION:**
Estas tabelas são **atualizadas automaticamente** via sync scheduler. Precisamos garantir que o scheduler escreva nas novas tabelas.

**Steps:**
1. Migrar tabelas (create + copy data)
2. Atualizar edge functions de sync
3. **Testar sync manual** antes de scheduler
4. Monitorar primeiro sync automático
5. Verificar dados sincronizados

---

#### **Sistema 4: Reports System**

**Tabelas:**
- `j_rep_metaads_bronze` → `j_hub_reports_metaads`

**⚠️ LARGE TABLE:** Esta tabela pode ter milhões de rows (dados de Meta Ads).

**Migration Strategy:**
```sql
-- Use partitioning for large data migration
CREATE TABLE j_hub_reports_metaads (
  LIKE j_rep_metaads_bronze INCLUDING ALL
) PARTITION BY RANGE (date_start);

-- Migrate in chunks by date
INSERT INTO j_hub_reports_metaads
SELECT * FROM j_rep_metaads_bronze
WHERE date_start >= '2025-01-01' AND date_start < '2025-02-01';
-- Repeat for each month...
```

**Testing Checklist:**
- [ ] All 9 dashboards load
- [ ] Metrics calculate correctly
- [ ] Date filters work
- [ ] Performance acceptable (<2s load)

---

#### **Sistema 5: System Health**

**Tabelas:**
- `j_ads_error_logs` → `j_hub_error_logs`
- `j_ads_metrics` → `j_hub_metrics`

**Low Risk:** Estas são tabelas de logging, podem ser migradas por último.

---

### **FASE 3: Code Updates (3-4 horas)**

**Objetivo:** Atualizar todas as referências no código

#### **Search & Replace Pattern:**
```bash
# Edge Functions
j_ads_admin_ → j_hub_admin_
j_ads_manager_ → j_hub_manager_
j_ads_user_ → j_hub_user_
j_ads_notion_ → j_hub_notion_
j_ads_submit_ad → j_hub_creative_submit
j_ads_auth_roles → j_hub_auth_roles

# Database Tables
.from('j_ads_ → .from('j_hub_
FROM j_ads_ → FROM j_hub_
INSERT INTO j_ads_ → INSERT INTO j_hub_
UPDATE j_ads_ → UPDATE j_hub_
```

#### **Files to Update (44+ files):**

**Components (React):**
- src/components/OptimizationList.tsx
- src/components/OptimizationRecorder.tsx
- src/components/NotionSyncControl.tsx
- src/components/CreativeSystem.tsx
- src/components/optimization/*.tsx (multiple files)
- src/components/steps/*.tsx

**Pages:**
- src/pages/Admin.tsx
- src/pages/Manager.tsx
- src/pages/Optimization.tsx
- src/pages/OptimizationEditor.tsx
- src/pages/SharedOptimization.tsx

**Hooks:**
- src/hooks/useMyNotionAccounts.ts
- src/hooks/useManagers.ts
- src/hooks/useNotionData.ts
- src/hooks/useUserRole.ts
- src/hooks/useOptimizationPrompts.ts

**Utils:**
- src/utils/systemHealth.ts
- src/utils/checkWhitelist.ts
- src/utils/setupTestManagers.ts

**Contexts:**
- src/contexts/AuthContext.tsx

**Edge Functions:**
- supabase/functions/j_hub_*/*.ts (all new names)
- supabase/functions/_shared/*.ts

**Migrations:**
- Create new migrations for table renames
- Update RPC functions

---

### **FASE 4: Testing & Validation (2-3 horas)**

**Objetivo:** Garantir que tudo funciona perfeitamente

#### **Test Suite Completo:**

**1. Authentication & Authorization:**
- [ ] Login com email/password
- [ ] Login com OAuth (Notion)
- [ ] Logout
- [ ] Password reset
- [ ] Role detection (admin/manager/gerente)
- [ ] Protected routes

**2. Creative System:**
- [ ] Upload criativo (imagem)
- [ ] Upload criativo (vídeo)
- [ ] Multiple variations
- [ ] File validation
- [ ] Admin publish
- [ ] Manager view
- [ ] Gerente submit

**3. Optimization System:**
- [ ] Record audio
- [ ] Transcribe
- [ ] Process transcript
- [ ] Analyze with AI
- [ ] Edit analysis
- [ ] Share optimization
- [ ] View shared link (public)
- [ ] All 5 j_hub_optimization_* functions

**4. Admin Panel:**
- [ ] View all users
- [ ] Change user role
- [ ] Toggle user status
- [ ] Reset password
- [ ] Force logout
- [ ] Audit logs

**5. Manager Dashboard:**
- [ ] View assigned accounts
- [ ] View submissions
- [ ] View reports

**6. Notion Sync:**
- [ ] Manual sync trigger
- [ ] Accounts sync
- [ ] Managers sync
- [ ] Scheduler runs (cron)
- [ ] Data appears correctly

**7. Reports System:**
- [ ] All 9 dashboards load
- [ ] Metrics correct
- [ ] Date filters work
- [ ] Performance indicators
- [ ] Export data

---

### **FASE 5: Deployment (1 hora)**

**Objetivo:** Deploy v2.0 para produção

#### **Pre-Deploy Checklist:**
- [ ] All tests passing
- [ ] No console errors
- [ ] Lint clean
- [ ] TypeScript errors = 0
- [ ] Database backup created
- [ ] Rollback script ready

#### **Deploy Steps:**
1. **Database Migration:**
   ```bash
   # Run all migration scripts in order
   npx supabase db push
   ```

2. **Edge Functions:**
   ```bash
   # Deploy all 17 functions
   npx supabase functions deploy --project-ref biwwowendjuzvpttyrlb
   ```

3. **Frontend:**
   ```bash
   # Commit & push (Vercel auto-deploys)
   git add .
   git commit -m "feat: Jumper Ads v2.0 - Complete rebrand to Jumper Hub"
   git push origin main
   ```

4. **Monitor:**
   - Watch Vercel deployment logs
   - Monitor Supabase function logs
   - Check error tracking
   - Monitor for 1 hour

---

### **FASE 6: Cleanup (1 hora)**

**Objetivo:** Remover código e tabelas antigas

#### **After 7 Days of Stable Operation:**

1. **Delete Old Edge Functions:**
   ```bash
   npx supabase functions delete j_ads_admin_dashboard --project-ref ...
   # Repeat for all 9 old functions
   ```

2. **Drop Old Tables:**
   ```sql
   -- Remove views first
   DROP VIEW IF EXISTS j_ads_users CASCADE;
   DROP VIEW IF EXISTS j_ads_creative_submissions CASCADE;
   -- etc...

   -- Then drop old tables
   DROP TABLE IF EXISTS j_ads_users CASCADE;
   DROP TABLE IF EXISTS j_ads_creative_submissions CASCADE;
   -- etc...
   ```

3. **Remove Compatibility Code:**
   - Delete any dual-write logic
   - Remove view definitions
   - Clean up temporary functions

---

## 📊 Timeline Estimado

| Fase | Duração | Responsável | Status |
|------|---------|-------------|--------|
| FASE 0: Preparação | 1-2h | Claude + Bruno | ⏳ Pending |
| FASE 1: Edge Functions | 2-3h | Claude + Bruno | ⏳ Pending |
| FASE 2: Database Tables | 4-6h | Claude + Bruno | ⏳ Pending |
| FASE 3: Code Updates | 3-4h | Claude + Bruno | ⏳ Pending |
| FASE 4: Testing | 2-3h | Bruno | ⏳ Pending |
| FASE 5: Deployment | 1h | Claude + Bruno | ⏳ Pending |
| FASE 6: Cleanup | 1h | Claude | ⏳ Pending (after 7 days) |
| **TOTAL** | **14-20h** | | |

**Sugestão:** Executar em 2-3 sessões:
- **Sessão 1 (4-6h):** FASE 0 + FASE 1 completa
- **Sessão 2 (6-8h):** FASE 2 + FASE 3 completa
- **Sessão 3 (4-6h):** FASE 4 + FASE 5 + monitoring

---

## ⚠️ Riscos e Mitigações

### **RISCO 1: Perda de dados durante migração**
**Mitigação:**
- Backup completo antes de começar
- Usar dual-write temporariamente
- Testar migração em ambiente dev primeiro

### **RISCO 2: Downtime em produção**
**Mitigação:**
- Usar views para backwards compatibility
- Deploy fora de horário comercial
- Rollback script pronto

### **RISCO 3: Foreign key conflicts**
**Mitigação:**
- Mapear todas as FKs antes
- Migrar em ordem de dependências
- Atualizar FKs incrementalmente

### **RISCO 4: Performance degradation**
**Mitigação:**
- Testar queries antes e depois
- Recriar indexes após migração
- Monitorar performance 24h após deploy

---

## 🎯 Success Criteria

**v2.0 será considerada bem-sucedida quando:**

✅ **Zero referências** a `j_ads_*` no código
✅ **Todas as 17 edge functions** usam `j_hub_*`
✅ **Todas as tabelas** migradas para `j_hub_*`
✅ **Todos os testes** passando
✅ **Zero downtime** durante migração
✅ **Performance mantida** ou melhorada
✅ **Produção estável** por 7 dias

---

## 📝 Notas Finais

- Este plano é **flexível** - pode ser ajustado conforme necessário
- **Comunicação constante** entre Claude e Bruno durante execução
- **Documentar tudo** - decisões, problemas encontrados, soluções
- **Celebrar** quando v2.0 estiver no ar! 🎉

---

**Criado em:** 2025-10-12
**Última atualização:** 2025-10-12
**Status:** 📋 PLANO PRONTO - Aguardando aprovação para execução
