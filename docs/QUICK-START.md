# 🚀 Quick Start - Desenvolvimento Local

Guia rápido para iniciar o ambiente de desenvolvimento do Jumper Hub.

---

## ✅ Pré-requisitos

Antes de começar, certifique-se que tem instalado:

- **Node.js** 18+ e **npm** (`node --version`, `npm --version`)
- **Docker Desktop** rodando (`docker ps` deve funcionar)
- **Supabase CLI** (`npx supabase --version` deve retornar v2.48.3+)
- **Git** configurado

---

## ⚡ Setup Inicial (Primeira Vez)

**Execute uma única vez ao clonar o repositório:**

```bash
# 1. Clone o repositório (se ainda não fez)
git clone <repo-url>
cd jumper-creative-flow

# 2. Instale dependências
npm install

# 3. Execute o script de setup automático
./scripts/start-dev.sh

# O script fará automaticamente:
# ✅ Verificar Docker
# ✅ Iniciar Supabase Local
# ✅ Aplicar migrations
# ✅ Configurar variáveis de ambiente
# ✅ Iniciar dev server
```

**Verificação de sucesso:**

- Supabase Studio: http://127.0.0.1:54323 (deve abrir interface)
- Frontend: http://localhost:8080 (deve carregar aplicação)
- Console do navegador deve mostrar: `🔗 Supabase: LOCAL (http://127.0.0.1:54321)`

---

## 📋 Desenvolvimento Diário

**A cada vez que for trabalhar no projeto:**

```bash
# Opção 1: Script automático (recomendado)
./scripts/start-dev.sh

# Opção 2: Manual (se preferir controle individual)
npx supabase start        # Inicia Supabase + Edge Functions
npm run dev              # Inicia frontend (porta 8080)
```

**Para parar o ambiente:**

```bash
# Parar Supabase (mantém dados)
npx supabase stop

# Parar frontend
Ctrl+C no terminal do npm run dev
```

---

## 🔧 Configuração de Variáveis de Ambiente

### **Frontend (.env.local)**

Crie `.env.local` no diretório raiz (se não existir):

```bash
# Frontend - Conexão com Supabase Local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### **Edge Functions (supabase/functions/.env)**

Crie `supabase/functions/.env` com suas API keys:

```bash
# AI API Keys (necessárias para sistema de otimização)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase (auto-fornecido pelo Supabase Local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<obter de `npx supabase status`>
```

**⚠️ IMPORTANTE:** Ambos arquivos estão em `.gitignore` e NÃO devem ser commitados.

---

## 🗄️ Database Local

### **Opção 1: Desenvolvimento com dados vazios (recomendado)**

```bash
# Database local já vem com schema aplicado
# Crie dados de teste conforme necessário via Supabase Studio
```

### **Opção 2: Importar dados de produção**

**Quando usar:** Testes com dados reais, debugging específico.

```bash
# 1. Fazer backup da produção
npx supabase db dump --linked --data-only --use-copy \
  --file="./backups/production_$(date +%Y%m%d).sql"

# 2. Restaurar no local
./scripts/restore-to-local.sh ./backups/production_YYYYMMDD.sql

# ⚠️ Isso SUBSTITUI todos dados locais!
```

---

## ✅ Verificação de Saúde do Ambiente

**Execute para diagnosticar problemas:**

```bash
# Status completo do Supabase
npx supabase status

# Containers Docker ativos
docker ps --filter "name=supabase"

# Verificar Edge Runtime especificamente
docker ps | grep edge_runtime
# Deve mostrar: "Up X minutes" (NÃO "Exited")

# Verificar API keys no Edge Runtime
docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env | grep OPENAI_API_KEY
# Deve retornar: OPENAI_API_KEY=sk-proj-...
```

---

## 🚨 Problemas Comuns

### **Frontend conecta em PRODUÇÃO ao invés de LOCAL**

**Sintoma:** Console mostra `🔗 Supabase: PRODUCTION`

**Solução:**
```bash
# Verificar variáveis de sistema
env | grep VITE

# Se encontrar VITE_SUPABASE_URL com valor de produção:
# Editar ~/.zshrc e comentar/deletar linhas VITE_*
# Então recarregar shell:
source ~/.zshrc
```

### **Edge Functions retorna "API_KEY not configured"**

**Sintoma:** Erro 500 ao transcrever áudio

**Solução:**
```bash
# Verificar se arquivo existe
ls -la supabase/functions/.env

# Se não existir, criar:
cp supabase/.env supabase/functions/.env

# Reiniciar Supabase
npx supabase stop
npx supabase start

# Validar que carregou
docker exec supabase_edge_runtime_biwwowendjuzvpttyrlb env | grep OPENAI_API_KEY
```

### **Container Edge Runtime com status "Exited (137)"**

**Sintoma:** `docker ps -a` mostra container parado

**Solução:**
```bash
# Matar processos conflitantes
pkill -f "supabase functions serve"

# Reiniciar Supabase
npx supabase stop
npx supabase start
```

**📖 Guia completo:** [DEV-TROUBLESHOOTING.md](./DEV-TROUBLESHOOTING.md)

---

## 📚 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Start dev server
npm run build           # Build production
npm run lint            # Check code quality
npm run typecheck       # Validate TypeScript

# Supabase
npx supabase status     # Ver URLs e status
npx supabase db reset   # Reaplicar migrations (apaga dados!)
npx supabase db diff    # Ver mudanças no schema

# Logs
docker logs -f supabase_edge_runtime_biwwowendjuzvpttyrlb  # Edge Functions
docker logs -f supabase_db_biwwowendjuzvpttyrlb            # Database
```

---

## 🔗 Links Úteis

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:8080 |
| **Supabase Studio** | http://127.0.0.1:54323 |
| **Mailpit (emails)** | http://127.0.0.1:54324 |
| **Database** | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

---

## 📖 Documentação Adicional

- **[CLAUDE.md](../CLAUDE.md)** - Visão geral completa do projeto
- **[DEV-TROUBLESHOOTING.md](./DEV-TROUBLESHOOTING.md)** - Troubleshooting detalhado
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura e decisões técnicas
- **[DEV-SETUP.md](./DEV-SETUP.md)** - Setup detalhado passo a passo

---

## 🎯 Próximos Passos

Após setup inicial completo:

1. ✅ Ambiente local funcionando
2. ✅ Frontend acessível em http://localhost:8080
3. ✅ Edge Functions respondendo
4. 📝 Começar desenvolvimento!

**Dica:** Mantenha Supabase Studio aberto (http://127.0.0.1:54323) para visualizar database em tempo real enquanto desenvolve.

---

**Última atualização:** 2025-10-20
