# 🔧 Troubleshooting - Desenvolvimento Local

Guia de soluções para problemas comuns no ambiente de desenvolvimento.

---

## 🚨 Edge Functions - "API_KEY not configured"

### **Sintoma:**
```
❌ [TRANSCRIBE] Error: OPENAI_API_KEY not configured
❌ [ANALYZE] Error: ANTHROPIC_API_KEY not configured
```

### **Causa:**
Edge Functions locais não têm acesso às variáveis de ambiente porque `supabase/functions/.env` não existe ou não foi carregado.

### **Solução:**

```bash
# 1. Verificar se arquivo existe
ls -la supabase/functions/.env

# 2. Se não existir, criar:
cp supabase/.env supabase/functions/.env

# 3. Verificar conteúdo
cat supabase/functions/.env | grep API_KEY
# Deve conter: OPENAI_API_KEY=sk-proj-...
#              ANTHROPIC_API_KEY=sk-ant-api03-...

# 4. Reiniciar Supabase Local
npx supabase stop
npx supabase start

# 5. Validar que carregou
docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env | grep OPENAI_API_KEY
# Deve retornar: OPENAI_API_KEY=sk-proj-...
```

### **Por que isso acontece:**
- Edge Functions rodam em Docker container
- Container **NÃO** lê `.env.local` do root
- Supabase CLI carrega automaticamente `supabase/functions/.env` ao iniciar
- `npx supabase secrets set` é **APENAS** para produção remota

---

## 🌐 Frontend conectando em PRODUÇÃO ao invés de LOCAL

### **Sintoma:**
```javascript
// Console do navegador mostra:
🔗 Supabase: PRODUCTION (https://biwwowendjuzvpttyrlb.supabase.co)
```

### **Causa:**
Variáveis de ambiente do sistema (`.zshrc`, `.bashrc`) sobrescrevem `.env.local`.

Vite carrega variáveis nesta ordem de precedência:
1. **System environment variables** (HIGHEST)
2. `.env.local`
3. `.env`

### **Solução:**

```bash
# 1. Verificar variáveis do sistema
env | grep VITE

# 2. Se encontrar VITE_SUPABASE_URL com valor de produção:
# Editar ~/.zshrc ou ~/.bash_profile
nano ~/.zshrc

# 3. Comentar/deletar linhas como:
# export VITE_SUPABASE_URL=https://biwwowendjuzvpttyrlb.supabase.co
# export VITE_SUPABASE_ANON_KEY=...

# 4. Recarregar shell
source ~/.zshrc

# 5. Verificar que .env.local existe
cat .env.local
# Deve ter: VITE_SUPABASE_URL=http://127.0.0.1:54321

# 6. Reiniciar dev server
pkill -f "npm run dev"
npm run dev
```

### **Validação:**
- Abrir http://localhost:8080
- Abrir DevTools Console (F12)
- Procurar por: `🔗 Supabase: LOCAL`
- **Se ainda mostra PRODUCTION, PARE** e revise as variáveis

---

## 🐳 Edge Runtime container com status "Exited (137)"

### **Sintoma:**
```bash
docker ps -a | grep edge_runtime
# supabase_edge_runtime_... Exited (137) 4 minutes ago
```

### **Causa:**
SIGKILL por falta de memória (OOM) causado por conflito de processos.

Código 137 = 128 + 9 (SIGKILL)

### **Solução:**

**1. Verificar se há `supabase functions serve` rodando standalone:**
```bash
ps aux | grep "supabase functions serve"

# Se encontrar processo, matar:
pkill -f "supabase functions serve"
```

**2. Remover qualquer script que inicie Edge Functions manualmente**

❌ **Errado:**
```bash
# start-dev.sh (ANTIGO)
npx supabase functions serve --env-file .env.local &
```

✅ **Correto:**
```bash
# Edge Functions já incluídas no `npx supabase start`
# Não iniciar manualmente!
```

**3. Reiniciar Supabase:**
```bash
npx supabase stop
npx supabase start
```

**4. Verificar que container está UP:**
```bash
docker ps | grep edge_runtime
# Deve mostrar: Up X minutes (sem "Exited")
```

---

## 📊 Step 3 (Extract) não exibe após gerar

### **Sintoma:**
- Usuário clica "Gerar Extrato"
- Toast de sucesso aparece
- Mas extrato não aparece na tela

### **Causa:**
Edge Function não atualiza `analysis_status` para 'completed' após salvar extrato.

Frontend só renderiza se: `recording.analysis_status === 'completed'`

### **Solução (temporária - manual):**

```sql
-- 1. Encontrar recording_id (check URL ou logs)

-- 2. Verificar status
SELECT analysis_status, processing_status
FROM j_hub_optimization_recordings
WHERE id = '<recording_id>';

-- 3. Se analysis_status != 'completed', atualizar:
UPDATE j_hub_optimization_recordings
SET analysis_status = 'completed'
WHERE id = '<recording_id>';

-- 4. Recarregar página no navegador
```

### **Solução (permanente):**
Já corrigido em commit `58a33b8`. Se problema persistir, verificar se Edge Function `j_hub_optimization_extract` tem o código de update (linhas 167-176).

---

## 🔄 Database local sem dados de teste

### **Sintoma:**
```bash
SELECT COUNT(*) FROM j_hub_users;
# count: 0
```

### **Causa:**
Database local recém-criado não tem dados.

### **Solução (Opção 1 - Importar Produção):**

⚠️ **Cuidado:** Dados sensíveis! Usar apenas quando necessário.

```bash
# 1. Fazer backup da produção
npx supabase db dump --linked --data-only --use-copy \
  --file="./backups/production_data_$(date +%Y%m%d_%H%M%S).sql"

# 2. Restore no local
./scripts/restore-to-local.sh ./backups/production_data_YYYYMMDD_HHMMSS.sql
```

### **Solução (Opção 2 - Criar dados de teste):**

✅ **Recomendado para desenvolvimento:**

```sql
-- Criar usuário teste
INSERT INTO j_hub_users (email, role, nome) VALUES
  ('dev@test.com', 'admin', 'Dev Admin'),
  ('gestor@test.com', 'staff', 'Gestor Teste'),
  ('cliente@test.com', 'client', 'Cliente Teste');

-- Criar conta teste no Notion sync
-- (adicionar exemplos conforme necessário)
```

---

## 📝 Migrations não aplicadas no local

### **Sintoma:**
```bash
psql: ERROR: relation "j_hub_optimization_extracts" does not exist
```

### **Causa:**
Nova migration criada mas não aplicada no database local.

### **Solução:**

```bash
# 1. Verificar migrations pendentes
npx supabase db diff

# 2. Aplicar todas migrations
npx supabase db reset

# ⚠️ CUIDADO: Isso apaga TODOS os dados locais!
# Se quiser preservar dados, fazer backup primeiro:
npx supabase db dump --data-only > /tmp/local-backup.sql
```

---

## 🔑 RLS Policy bloqueando acesso

### **Sintoma:**
```javascript
// Frontend console
Error: new row violates row-level security policy for table "..."
```

### **Causa:**
Row Level Security (RLS) policy bloqueando operação para usuário autenticado.

### **Diagnóstico:**

```sql
-- 1. Verificar políticas da tabela
\d+ nome_da_tabela

-- 2. Testar como usuário autenticado
SET ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub": "user-id", "email": "email@test.com"}', false);
SELECT * FROM nome_da_tabela;
```

### **Solução:**
Verificar/ajustar RLS policies no arquivo de migration correspondente.

---

## 🌐 Mais Ajuda

**Documentação:**
- [CLAUDE.md](../CLAUDE.md) - Configuração completa do projeto
- [DEV-SETUP.md](./DEV-SETUP.md) - Setup inicial detalhado
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura e decisões técnicas

**Comandos Úteis:**
```bash
# Ver logs do Edge Runtime
docker logs -f supabase_edge_runtime_biwwowendjuzvpttyrlb

# Ver logs do Database
docker logs -f supabase_db_biwwowendjuzvpttyrlb

# Status completo do Supabase Local
npx supabase status

# Containers rodando
docker ps --filter "name=supabase"
```

**Se problema persistir:**
1. Verificar logs dos containers
2. Checar se todas migrations foram aplicadas
3. Validar variáveis de ambiente
4. Tentar `npx supabase stop && npx supabase start` (restart completo)
