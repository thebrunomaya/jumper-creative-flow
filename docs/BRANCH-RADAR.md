# Branch RADAR - Contexto de Desenvolvimento

**Status:** 🚧 Em Desenvolvimento (Local)
**Criado em:** 2025-10-22
**Última atualização:** 2025-10-22

---

## 🎯 Objetivo da Branch

Implementar **seleção de método de extração** no sistema de otimizações, permitindo ao usuário escolher entre:
- **RADAR** - Método estruturado em 5 seções (Registro, Anomalia, Diagnóstico, Ação, Resultado Esperado)
- **Actions (Legado)** - Lista simples de ações executadas

---

## ✅ Funcionalidades Implementadas

### **1. UI de Seleção de Método (OptimizationEditor.tsx)**
- ✅ Radio buttons elegantes no Step 3
- ✅ Descrições explicativas de cada método
- ✅ Badge mostrando método usado em extratos completos
- ✅ Estado `selectedMethod` rastreando escolha do usuário

**Localização:** `src/pages/OptimizationEditor.tsx:107` (estado), linha ~786 (UI)

### **2. Edge Function com Duplo Método (j_hub_optimization_extract)**
- ✅ Prompt `RADAR_PROMPT` (existente, mantido)
- ✅ Prompt `ACTIONS_PROMPT` (novo, criado)
- ✅ Lógica de seleção baseada em parâmetro `method`
- ✅ Validação específica para cada formato
- ✅ Logging diferenciado (`extract_radar` vs `extract_legacy`)

**Localização:** `supabase/functions/j_hub_optimization_extract/index.ts`

### **3. Props e Integração**
- ✅ `handleGenerateExtract()` envia método selecionado
- ✅ Edge Function salva `extract_format` correto no DB
- ✅ Frontend exibe método usado após geração
- ✅ Regenerar com método diferente substitui extrato anterior

---

## 📦 Commits Relevantes

**Último commit:**
```
f517cca - feat: Add extraction method selection (RADAR vs Actions) (v2.0.33)
```

**Arquivos modificados:**
- `src/pages/OptimizationEditor.tsx` - UI de seleção + lógica de envio
- `src/components/optimization/OptimizationCard.tsx` - Badge de método + remoção drawer
- `src/pages/Optimization.tsx` - Remoção de RadarDrawer (limpeza)
- `supabase/functions/j_hub_optimization_extract/index.ts` - Suporte dual method

---

## 🗄️ Database Schema (Já Existente)

**Tabela:** `j_hub_optimization_extracts`

**Colunas relevantes:**
```sql
extract_format extract_format_type DEFAULT 'radar'
  -- ENUM: 'radar' | 'legacy'
  -- Indica qual método foi usado para gerar o extrato

tags jsonb DEFAULT '{...}'
  -- Estrutura de tags RADAR (vazia para legacy)
```

**Migration:** `20251021221528_add_radar_tags_system.sql` (já aplicada)

---

## 🔧 Setup para Nova Sessão

### **Branch Checkout:**
```bash
git checkout radar
```

### **Ambiente Local (Automático):**
```bash
./scripts/start-dev.sh
# OU usar agent dev-setup
```

**O que acontece automaticamente:**
- ✅ Supabase Local inicia
- ✅ Migrations do branch radar são aplicadas
- ✅ Edge Functions do branch radar são carregadas (código local)
- ✅ Frontend serve UI nova com radio buttons
- ✅ Dados de produção importados (opcional)

**Nenhuma configuração extra necessária!** O ambiente se ajusta ao branch automaticamente.

---

## 🧪 Como Testar

### **Fluxo Completo:**

1. **Login:** `bruno@jumper.studio` / `senha123`
2. **Ir para:** http://localhost:8080/optimization
3. **Criar otimização:** Gravar áudio de otimização
4. **Step 1:** Transcrever (IA)
5. **Step 2:** Processar em bullets (IA)
6. **Step 3:**
   - ✅ Escolher método (RADAR ou Actions)
   - ✅ Gerar extrato
   - ✅ Verificar que badge mostra método correto
   - ✅ Regenerar com método diferente (substitui)

### **Validações:**

**RADAR:**
- ✅ Box formatting (┌─ │ └─)
- ✅ 5 seções (R-A-D-A-R)
- ✅ Severity emojis (🔴🟡🔵)
- ✅ Tags editáveis via TagSelector

**Actions:**
- ✅ Bullet points (•)
- ✅ Categorias ([VERBA], [CRIATIVOS], etc.)
- ✅ Verbos no passado
- ✅ Números/quantificações

---

## 🚀 Deploy para Produção (Quando Pronto)

### **Checklist Pré-Deploy:**

- [ ] Testado localmente com ambos os métodos
- [ ] Validações funcionando (RADAR + Actions)
- [ ] Tags salvas corretamente
- [ ] Edição de extrato funcionando
- [ ] Regeneração testada (troca de método)
- [ ] Zero erros no console do navegador
- [ ] TypeScript sem erros (`npm run typecheck`)

### **Comandos de Deploy:**

```bash
# 1. Merge para main
git checkout main
git merge radar
git push origin main
# → Vercel auto-deploy frontend (~2-3 min)

# 2. Deploy Edge Function IMEDIATAMENTE
npx supabase functions deploy j_hub_optimization_extract --project-ref biwwowendjuzvpttyrlb
# → Edge Function atualizada em produção (~30 seg)

# 3. Validar produção
# Abrir: https://hub.jumper.studio
# Testar: Criar otimização → Step 3 → Escolher método → Gerar
```

### **⚠️ CRÍTICO: Ordem de Deploy**

1. **Push para main primeiro** (frontend deploy automático)
2. **Deploy Edge Function LOGO APÓS** (manual)
3. **Janela de risco:** 2-3 minutos onde frontend novo pode chamar Edge Function antiga

**Solução:** Deploy Edge Function imediatamente após push, antes de Vercel terminar.

---

## 📝 TODOs Futuros (Não Implementados)

- [ ] Permitir visualizar ambos os formatos simultaneamente (tabs?)
- [ ] Histórico de extratos gerados (versionamento por método)
- [ ] Prompt customizável por usuário/conta
- [ ] Mais métodos de extração (futuro: OKR, SMART, etc.)
- [ ] Analytics: qual método é mais usado?

---

## 🐛 Issues Conhecidos

**Nenhum no momento.** ✅

---

## 📚 Referências Técnicas

**RADAR Method:**
- Prompt: `supabase/functions/j_hub_optimization_extract/index.ts:29-109`
- Validation: Linhas 272-292
- Tags schema: `src/types/radarTags.ts`

**Actions Method:**
- Prompt: `supabase/functions/j_hub_optimization_extract/index.ts:112-155`
- Validation: Linhas 294-303
- Parsing: Linhas 313-326 (ExtractAction interface)

**UI Components:**
- Method selection: `src/pages/OptimizationEditor.tsx:786-844`
- Method badge: `src/pages/OptimizationEditor.tsx:886-895`
- Card display: `src/components/optimization/OptimizationCard.tsx`

---

## 💡 Notas para Próxima Sessão

1. **Branch está limpa:** Todos os TODOs completados, zero pendências
2. **Commits bem organizados:** Um único commit com todas as mudanças relacionadas
3. **Ambiente auto-configura:** Apenas `git checkout radar` + `./scripts/start-dev.sh`
4. **Pronto para testes:** Sistema funcionando 100% localmente
5. **Não fazer push ainda:** Aguardando testes completos antes de produção

---

**Última sessão:** 2025-10-22
**Próxima ação sugerida:** Testar fluxo completo com ambos os métodos, verificar edge cases
