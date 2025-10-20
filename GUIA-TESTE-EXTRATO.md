# 🧪 Guia de Teste - Sistema de Extrato (v2.0.23)

## 📋 Pré-requisitos

✅ **Migrations aplicadas** - Executado `npx supabase db reset`
✅ **Ambiente local rodando** - Supabase Local + Edge Functions + npm run dev

---

## 🎯 O que testar?

### **Mudança Conceitual do Step 3:**
- **ANTES:** "Análise Estruturada" (JSON verboso com análises)
- **AGORA:** "Extrato da Otimização" (bullets compactos de ações concretas)

### **4 Categorias de Ações:**
- 💰 **[VERBA]** - Budget, aumentos, reduções, realocações
- 🖼️ **[CRIATIVOS]** - Anúncios trocados, pausados, ativados
- 📊 **[CONJUNTOS]** - Ad sets modificados, targeting ajustado
- ✏️ **[COPY]** - Títulos, descrições, CTAs alterados

---

## 🚀 Fluxo de Teste Completo

### **1. Preparar Ambiente Local**

```bash
# Terminal 1: Supabase Local (se não estiver rodando)
npx supabase start

# Terminal 2: Edge Functions (CRÍTICO!)
npx supabase functions serve

# Terminal 3: Frontend
npm run dev
```

**Verificar:**
- ✅ Supabase Local em http://127.0.0.1:54321
- ✅ Supabase Studio em http://127.0.0.1:54323
- ✅ Edge Functions servindo na porta 54321
- ✅ Frontend em http://localhost:8080

---

### **2. Login e Navegação**

1. Acesse http://localhost:8080
2. Faça login com seu email @jumper.studio (admin)
3. Navegue para **Otimizações** no menu lateral
4. Clique em **"Nova Otimização"**

---

### **3. Criar Nova Otimização**

#### **3.1. Gravar Áudio**
- Selecione uma **conta** do dropdown
- Clique em **"Iniciar Gravação"**
- Fale algo como:

> **Exemplo de áudio para teste:**
>
> "Olá, essa é uma otimização da conta X. Hoje eu aumentei o budget da campanha em 30%, saindo de 500 reais para 650 reais. Também pausei 3 anúncios que estavam com CTR abaixo de 1%. Além disso, ativei um novo conjunto chamado Lookalike 1% com budget de 200 reais. Por fim, ajustei o texto do CTA de 'Saiba mais' para 'Compre agora' para melhorar a conversão."

- Clique em **"Parar e Salvar"**
- A otimização deve ser criada e aparecer na lista

---

### **4. Testar Step 1 - Transcrição**

1. Clique na otimização criada para abrir o **OptimizationEditor**
2. Verifique que o **Step 1** está visível (mas pode estar **retraído**)
3. Clique no **header do Step 1** para expandir (se estiver retraído)

**✅ Verificações:**
- [ ] Transcrição foi gerada automaticamente (Whisper)
- [ ] Transcrição tem **formatação em parágrafos** (v2.0.20)
- [ ] Botão **"Editar Transcrição"** abre modal
- [ ] Ícone 🤖 (Bot) mostra o que a IA corrigiu automaticamente
- [ ] Ícone 🐛 (Debug) está visível (apenas admin)

**Testar Edição:**
- Clique em **"Editar Transcrição"**
- Modal deve abrir com textarea editável
- Botões disponíveis: **Salvar**, **Ajustar com IA**, **Recriar**, **Desfazer**

---

### **5. Testar Step 2 - Log da Otimização**

1. Verifique que **Step 2** está **BLOQUEADO** até Step 1 completar
2. Com Step 1 completo, Step 2 deve mostrar: **"Transcrição bruta pronta. Organize em tópicos..."**
3. Clique em **"Organizar com IA"**

**✅ Verificações:**
- [ ] Step 2 processa e gera bullets organizados
- [ ] Log é exibido em **HTML renderizado** (Markdown com remark-breaks)
- [ ] Emojis e formatação são preservados
- [ ] Botão **"Editar Log"** abre modal
- [ ] Modal permite editar como Markdown

**Testar Edição:**
- Clique em **"Editar Log"**
- Modal abre com textarea de Markdown
- Botões: **Salvar**, **Ajustar com IA**, **Recriar**, **Desfazer**

---

### **6. 🎯 TESTAR STEP 3 - EXTRATO (NOVO!)**

#### **6.1. Estado Inicial (Bloqueado)**

- Verifique que **Step 3** está **BLOQUEADO** com ícone de cadeado 🔒
- Mensagem: **"Complete o Step 2 (Log da Otimização) primeiro"**

#### **6.2. Gerar Extrato com IA**

1. Com Step 2 completo, Step 3 deve mostrar:
   - Ícone 📄 (FileText)
   - Mensagem: **"Log organizado. Gere o extrato de ações realizadas."**
   - Botão: **"✨ Gerar Extrato com IA"**

2. Clique em **"Gerar Extrato com IA"**

**✅ Verificações durante processamento:**
- [ ] Botão muda para **"Gerando Extrato..."** com spinner
- [ ] Edge Function `j_hub_optimization_extract` é chamada
- [ ] Toast de sucesso: **"Extrato gerado com sucesso!"**

#### **6.3. Visualizar Extrato**

Após geração, Step 3 deve exibir:

**Formato esperado:**
```
• [VERBA] Aumentado budget em 30% (R$500 → R$650)
• [CRIATIVOS] Pausados 3 anúncios com CTR < 1%
• [CONJUNTOS] Ativado conjunto "Lookalike 1%" com budget R$200
• [COPY] Ajustado CTA de "Saiba mais" para "Compre agora"
```

**✅ Verificações visuais:**
- [ ] Cada linha tem **ícone colorido** da categoria:
  - 💰 Verde para VERBA
  - 🖼️ Azul para CRIATIVOS
  - 📊 Roxo para CONJUNTOS
  - ✏️ Laranja para COPY
- [ ] Tag **[CATEGORIA]** em negrito e colorida
- [ ] Descrição da ação em texto normal
- [ ] Layout compacto e escaneável

#### **6.4. Editar Extrato Manualmente**

1. Clique no ícone **✏️ (Edit)** no header do Step 3
2. Modal **"Editar Extrato da Otimização"** deve abrir

**✅ Verificações do modal:**
- [ ] Textarea com texto atual (editável)
- [ ] Placeholder mostra formato correto
- [ ] Info text explica categorias disponíveis
- [ ] Badge mostra **"Editado Nx"** se já foi editado
- [ ] Badge mostra data/hora da última edição

**Botões disponíveis:**
- [ ] **"💾 Salvar Edição Manual"** (desabilitado se sem mudanças)
- [ ] **"🔄 Recriar com IA"** (regenera do zero)
- [ ] **"↩️ Desfazer"** (aparece apenas se houver versão anterior)
- [ ] **"Cancelar"** (fecha sem salvar)

**Testar edição:**
1. Adicione uma nova linha:
   ```
   • [VERBA] Realocado R$100 do conjunto A para B
   ```
2. Clique em **"Salvar Edição Manual"**
3. Verifique que:
   - Modal fecha
   - Extrato atualiza na tela
   - Toast: **"Extrato salvo!"**
   - Badge mostra **"Editado 1x"**

#### **6.5. Testar "Recriar com IA"**

1. Abra modal de edição novamente
2. Clique em **"Recriar com IA"**
3. Modal fecha e IA reprocessa o Step 2

**✅ Verificações:**
- [ ] Botão muda para **"Gerando Extrato..."**
- [ ] Edge Function é chamada com `forceRegenerate: true`
- [ ] Extrato é regerado do zero
- [ ] `edit_count` é resetado para 0

#### **6.6. Testar "Desfazer"**

1. Edite o extrato manualmente (qualquer mudança)
2. Salve
3. Abra modal novamente
4. Verifique que botão **"Desfazer"** apareceu
5. Clique em **"Desfazer"**

**✅ Verificações:**
- [ ] Extrato volta para versão anterior
- [ ] Toast: **"Extrato restaurado!"**
- [ ] Botão "Desfazer" desaparece (sem mais histórico)

#### **6.7. Testar Debug Modal (Admin)**

1. Clique no ícone **🐛 (Bug)** no header do Step 3
2. Modal de debug deve abrir

**✅ Verificações:**
- [ ] Mostra logs da chamada `j_hub_optimization_extract`
- [ ] Input: contexto do Step 2 (log completo)
- [ ] Output: extrato bullet gerado
- [ ] Prompt: instruções enviadas para Claude
- [ ] Tokens: contagem de input/output

---

### **7. Testar Colapsibilidade (v2.0.22)**

**Todos os steps devem ser retráteis:**

1. Clique no **header de qualquer step** para colapsar/expandir
2. Steps começam **retraídos por padrão**
3. Ao clicar no header:
   - Chevron muda (▼ ↔ ▲)
   - Conteúdo aparece/desaparece com animação suave (300ms)
   - Hover no header muda background

**✅ Verificações:**
- [ ] Step 1, 2, 3 são colapsáveis
- [ ] Clique no header (não nos botões!) alterna estado
- [ ] Animação slide-in suave
- [ ] Steps locked mostram mensagem quando expandidos

**Exceção:**
- [ ] **Step 4 (Oracle Framework)** NÃO é colapsável (sempre expandido)
- [ ] Disponível apenas para admins
- [ ] Visível quando analysis_status === 'completed'

---

### **8. Testar Compartilhamento**

1. Com Step 3 completo, clique em **"Compartilhar"**
2. Modal de compartilhamento deve abrir

**✅ Verificações:**
- [ ] Opção de habilitar/desabilitar compartilhamento
- [ ] Geração de link público
- [ ] Opção de senha (opcional)
- [ ] Data de expiração

**Testar link público:**
1. Habilite compartilhamento
2. Copie o link gerado
3. Abra em **aba anônima** (Cmd+Shift+N)
4. Verifique que:
   - [ ] Página pública carrega sem login
   - [ ] Extrato é exibido corretamente
   - [ ] Ícones e cores funcionam

---

## 🔍 Verificações de Database

**Acesse Supabase Studio:** http://127.0.0.1:54323

### **Tabela: j_hub_optimization_extracts**

```sql
SELECT * FROM j_hub_optimization_extracts
ORDER BY created_at DESC
LIMIT 1;
```

**Campos esperados:**
- [ ] `id` (uuid)
- [ ] `recording_id` (uuid - FK)
- [ ] `extract_text` (text - bullets formatados)
- [ ] `actions` (jsonb - array estruturado)
- [ ] `previous_version` (text - para undo)
- [ ] `edit_count` (integer - quantas vezes editado)
- [ ] `created_at` (timestamp)
- [ ] `updated_at` (timestamp)

### **Logs de API: j_hub_optimization_api_logs**

```sql
SELECT step, substep, input_tokens, output_tokens, created_at
FROM j_hub_optimization_api_logs
WHERE step = 'extract'
ORDER BY created_at DESC
LIMIT 5;
```

**Verificar:**
- [ ] Logs da chamada `extract` são salvos
- [ ] `input_text` contém log do Step 2
- [ ] `output_text` contém extrato gerado
- [ ] `prompt_text` contém instruções para Claude
- [ ] Token counts estão corretos

---

## 🐛 Cenários de Erro

### **Erro 1: Edge Function não está rodando**

**Sintoma:** Ao clicar "Gerar Extrato com IA", erro:
```
Edge Function returned a non-2xx status code
```

**Solução:**
```bash
# Terminal separado
npx supabase functions serve
```

### **Erro 2: Migration não aplicada**

**Sintoma:** Tabela `j_hub_optimization_extracts` não existe

**Solução:**
```bash
npx supabase db reset
```

### **Erro 3: RLS bloqueando acesso**

**Sintoma:** Não consegue ver extrato, erro 403/permission denied

**Verificar:**
1. Usuário está autenticado?
2. Email do usuário é @jumper.studio? (admin)
3. `recording.recorded_by` corresponde ao email logado?

**Debug:**
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies
WHERE tablename = 'j_hub_optimization_extracts';

-- Testar acesso
SELECT * FROM j_hub_optimization_extracts;
```

### **Erro 4: Extrato vazio ou malformado**

**Sintoma:** IA gera extrato sem categorias ou sem bullets

**Verificar:**
1. Step 2 tem conteúdo suficiente?
2. Log do Step 2 menciona ações concretas?
3. Debug Modal mostra prompt correto?

**Melhorar prompt:**
- Editar `supabase/functions/j_hub_optimization_extract/index.ts`
- Ajustar constante `EXTRACT_PROMPT`
- Redeploy: `npx supabase functions serve` (reiniciar)

---

## ✅ Checklist Final

### **Funcionalidades Core:**
- [ ] Step 3 gera extrato com IA
- [ ] Extrato exibe bullets com ícones coloridos
- [ ] 4 categorias funcionam (VERBA, CRIATIVOS, CONJUNTOS, COPY)
- [ ] Modal de edição abre e salva corretamente
- [ ] "Recriar com IA" regenera extrato
- [ ] "Desfazer" restaura versão anterior
- [ ] Edit count incrementa corretamente

### **UX:**
- [ ] Steps são colapsáveis (v2.0.22)
- [ ] Step 3 bloqueado até Step 2 completar
- [ ] Mensagens de estado claras (pending, processing, completed, failed)
- [ ] Animações suaves (300ms)
- [ ] Toast notifications funcionam

### **Database:**
- [ ] Tabela `j_hub_optimization_extracts` criada
- [ ] RLS policies funcionando
- [ ] Logs de API salvos corretamente
- [ ] Versionamento (previous_version) funciona

### **Admin:**
- [ ] Debug modal mostra logs do extract
- [ ] Admin pode ver extratos de todos os usuários
- [ ] Edge Function funciona via Service Role

---

## 📸 Screenshots Esperados

### **Step 3 - Estado Pending (Locked)**
- Ícone cadeado 🔒
- Mensagem: "Complete o Step 2 primeiro"

### **Step 3 - Estado Ready**
- Ícone FileText 📄
- Botão "✨ Gerar Extrato com IA"

### **Step 3 - Estado Completed**
- Lista bullet com ícones coloridos
- Botão "Compartilhar" no rodapé

### **Modal de Edição**
- Textarea com extrato
- 4 botões (Salvar, Recriar, Desfazer, Cancelar)
- Badge "Editado Nx"

---

## 🎯 Resultado Esperado

**Ao final do teste, você deve ter:**

1. ✅ Uma otimização completa com 3 steps:
   - Step 1: Transcrição formatada
   - Step 2: Log organizado em bullets
   - **Step 3: Extrato de ações com categorias**

2. ✅ Extrato exibido como:
   ```
   💰 [VERBA] Aumentado budget em 30% (R$500 → R$650)
   🖼️ [CRIATIVOS] Pausados 3 anúncios com CTR < 1%
   📊 [CONJUNTOS] Ativado conjunto "Lookalike 1%" com budget R$200
   ✏️ [COPY] Ajustado CTA de "Saiba mais" para "Compre agora"
   ```

3. ✅ Database com:
   - 1 registro em `j_hub_optimization_extracts`
   - 1+ logs em `j_hub_optimization_api_logs` (step='extract')

4. ✅ Edição manual funcional:
   - Salvar mudanças
   - Recriar com IA
   - Desfazer (undo)

---

## 📞 Suporte

**Se encontrar algum problema:**

1. **Verificar console do navegador** (F12)
2. **Verificar terminal do Edge Functions** (erros aparecem lá)
3. **Verificar Supabase Studio** (dados salvos corretamente?)
4. **Chamar Claude** com prints/logs do erro

**Bom teste! 🚀**
