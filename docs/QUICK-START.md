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

# 2. Execute o menu interativo de setup
./localdev.sh

# Escolha a opção 3 (Complete Setup) que fará automaticamente:
# ✅ Criar backup de produção
# ✅ Iniciar Supabase Local
# ✅ Aplicar migrations
# ✅ Restaurar dados de produção
# ✅ Configurar senha de desenvolvimento
# ✅ Instalar dependências npm
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
# Menu interativo (recomendado)
./localdev.sh

# Ou direto:
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

## 🔐 Credenciais de Desenvolvimento

**Login local:**
- Email: `bruno@jumper.studio`
- Senha: `senha123`

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

### **Reset Rápido (dados corrompidos)**

```bash
# Usar script seguro que preserva backup
./localdev.sh
# Escolher opção 4 (Quick Reset)
```

### **Importar dados de produção**

```bash
./localdev.sh
# Escolher opção 2 (Backup Production)
# Depois opção 3 (Complete Setup)
```

---

## ✅ Verificação de Saúde do Ambiente

**Execute para diagnosticar problemas:**

```bash
# Status completo do Supabase
npx supabase status

# Containers Docker ativos
docker ps --filter "name=supabase"

# Validar ambiente
./localdev.sh
# Escolher opção 1 (Validate Environment)
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
```

---

## 📚 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Start dev server
npm run build           # Build production
npm run lint            # Check code quality
npm run typecheck       # Validate TypeScript

# Supabase
npx supabase status            # Ver URLs e status
npx supabase db diff           # Ver mudanças no schema

# Scripts Locais
./localdev.sh                  # Menu interativo
./localdev/4-quick-reset.sh    # Reset rápido
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
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura e decisões técnicas
- **[localdev/README.md](../localdev/README.md)** - Guia completo do ambiente local

---

**Última atualização:** 2026-01-11
