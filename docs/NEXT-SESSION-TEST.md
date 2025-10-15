# 🧪 Teste para Próxima Sessão

**Objetivo:** Validar completamente o sistema de setup automatizado criado nesta sessão.

---

## ⚠️ IMPORTANTE: Leia Antes de Começar

Esta sessão criou **ferramentas automatizadas** que ainda não foram testadas end-to-end em um ambiente "limpo".

Este documento guia você no teste completo para garantir que tudo funciona perfeitamente.

---

## 🎯 O Que Vamos Testar

1. ✅ Script automatizado `start-dev.sh` funciona do zero
2. ✅ Dados de produção são importados corretamente
3. ✅ Dummy data é substituída por dados reais
4. ✅ Ambiente local conecta em LOCAL (não PRODUCTION)
5. ✅ Aplicação funciona com dados reais

---

## 📋 Pré-Teste (Preparação)

### 1. Certifique-se que Docker Desktop está rodando

```bash
# Verificar Docker
docker ps

# Se não estiver rodando:
# - Abrir Docker Desktop
# - Aguardar ícone ficar verde
```

### 2. Pare qualquer Supabase rodando

```bash
cd /Applications/Claude/jumper-creative-flow
npx supabase stop --no-backup
```

Isso garante que estamos testando **do zero**.

---

## 🧪 Teste Principal (Automatizado)

### Passo 1: Executar Script de Setup

```bash
cd /Applications/Claude/jumper-creative-flow
./scripts/start-dev.sh
```

### Passo 2: Observar Saída

**✅ Sucesso esperado:**

```
🚀 Jumper Hub - Development Environment Setup
==============================================

📦 Step 1/6: Checking Docker...
✅ Docker is running

🐳 Step 2/6: Starting Supabase Local...
✅ Supabase started

📊 Step 3/6: Checking local database...
⚠️  No production data found (or only dummy data)

   Do you want to import production data? (yes/no)
   → yes

   Looking for recent backups...
   ✅ Using backup: ./backups/production_data_20251015_124000.sql

   Importing data...
✅ Production data imported

📦 Step 4/6: Checking NPM dependencies...
✅ Dependencies already installed

🔧 Step 5/6: Checking environment variables...
✅ .env.local created

🎯 Step 6/6: Ready to start!

✅ All checks passed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Environment Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🐳 Supabase Local:  http://127.0.0.1:54321
   🗄️  Database:        postgresql://postgres:postgres@127.0.0.1:54322/postgres
   🎨 Studio:          http://127.0.0.1:54323
   📧 Mailpit:         http://127.0.0.1:54324
   👥 Real Users:      9

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Starting Development Server...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:8080/
```

**❌ Se algo falhar:**
- Anotar o erro completo
- Ver seção "Troubleshooting" abaixo
- Reportar para próxima sessão Claude

---

## ✅ Validação (Checklist Obrigatório)

### ✓ 1. Verificar Supabase Status

```bash
# Em outro terminal (deixe o dev server rodando)
npx supabase status
```

**Esperado:** Todos serviços rodando na porta 54XXX

---

### ✓ 2. Verificar Dados Reais (Não Dummy)

```bash
docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "SELECT email, nome, role FROM j_hub_users ORDER BY email;"
```

**✅ Esperado (usuários REAIS):**
```
         email         |      nome      |  role
-----------------------+----------------+--------
 alice@estudiocru.com  | Alice Leal     | client
 bruno@jumper.studio   | Bruno Maya     | admin
 claudio@jumper.studio | Claudio Wender | staff
 gabriel@koko.ag       | gabriel        | client
 joe@jumper.studio     | Joe            | staff
 kemuel@jumper.studio  |                | staff
 pedro@jumper.studio   | Pedro Waghabi  | staff
 raul@jumper.studio    | Raul Lisboa    | staff
```

**❌ FALHOU SE:**
- Aparecer emails com `@exemplo.com`
- Aparecer "Ana Silva", "Carlos Mendes", etc (dummy data)
- Menos de 9 usuários

---

### ✓ 3. Verificar Browser Console (CRÍTICO!)

1. Abrir: http://localhost:8080
2. Abrir DevTools (F12 ou Cmd+Option+I)
3. Ir para aba **Console**
4. Procurar log de conexão

**✅ Esperado:**
```
🔗 Supabase: LOCAL (http://127.0.0.1:54321)
```

**❌ FALHOU SE:**
```
🔗 Supabase: PRODUCTION (https://biwwowendjuzvpttyrlb.supabase.co)
```

**Se mostrar PRODUCTION:**
- **PARE IMEDIATAMENTE!**
- Você está conectado em produção!
- Ver seção "Troubleshooting - Console mostra PRODUCTION"

---

### ✓ 4. Testar Login

1. Na página http://localhost:8080
2. Digitar: `bruno@jumper.studio`
3. Clicar "Enviar link mágico"

**✅ Esperado:**
- Toast verde: "Link enviado com sucesso!"
- **NÃO** deve aparecer erro

4. Abrir Mailpit: http://127.0.0.1:54324
5. Ver email de login recebido
6. Clicar no link

**✅ Esperado:**
- Redirecionado para dashboard
- Ver nome "Bruno Maya"
- Ver role "admin"

---

### ✓ 5. Verificar Dados no Dashboard

Após login bem-sucedido:

**Se você é Admin:**
- Ir para página "Admin"
- Ver lista de usuários
- Verificar que são usuários reais (não dummy)

**Contagens esperadas:**
- Usuários: ~9
- Contas: ~48
- Gerentes: ~24

---

## 🎉 Sucesso Total

Se **TODOS** os checks passaram:

- ✅ Script automatizado funciona perfeitamente
- ✅ Dados de produção importados corretamente
- ✅ Ambiente local 100% isolado de produção
- ✅ Sistema pronto para desenvolvimento

**Próximo passo:** Começar a desenvolver features normalmente!

---

## 🚨 Troubleshooting

### Problema: Script para no Step 2 (Docker)

**Erro:** `❌ Docker is not running`

**Solução:**
1. Abrir Docker Desktop
2. Aguardar inicializar completamente
3. Verificar: `docker ps` funciona
4. Rodar script novamente

---

### Problema: Script para no Step 3 (Backup não encontrado)

**Sintoma:** `No backup found. Creating new backup...` e depois erro

**Causa:** Projeto não está "linked" ao Supabase

**Solução:**
```bash
# Link do projeto manualmente
npx supabase link --project-ref biwwowendjuzvpttyrlb

# Criar backup manualmente
npx supabase db dump --linked --data-only --use-copy \
  --file="./backups/production_data_$(date +%Y%m%d_%H%M%S).sql"

# Rodar script novamente
./scripts/start-dev.sh
```

---

### Problema: Console mostra "PRODUCTION"

**Causa:** Variáveis de ambiente erradas

**Solução:**
```bash
# 1. Parar dev server (Ctrl+C)

# 2. Verificar .env.local
cat .env.local

# Deve conter:
# VITE_SUPABASE_URL=http://127.0.0.1:54321
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Se estiver errado, recriar:
cat > .env.local <<'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF

# 4. Reiniciar dev server
npm run dev
```

---

### Problema: Usuários ainda são dummy

**Sintoma:** Aparecem emails `@exemplo.com` no banco

**Causa:** Restore não funcionou corretamente

**Solução:**
```bash
# 1. Verificar que backup tem dados reais
grep -A 12 'COPY.*j_hub_users' backups/production_data_*.sql | head -15

# Deve mostrar emails reais (@jumper.studio, @estudiocru.com, etc)

# 2. Forçar re-import
./scripts/restore-to-local.sh ./backups/production_data_LATEST.sql

# 3. Verificar novamente
docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "SELECT email FROM j_hub_users;"
```

---

### Problema: npm run dev não inicia

**Erro:** `Cannot find module ...`

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Reportar Resultados

**Se tudo funcionou:**
- ✅ Marcar todos os checks acima como OK
- ✅ Começar desenvolvimento normalmente
- ✅ Documentação está validada

**Se algo falhou:**
- ❌ Anotar qual step falhou
- ❌ Copiar mensagem de erro completa
- ❌ Ver se está em Troubleshooting
- ❌ Reportar para próxima sessão Claude

---

## 🔗 Documentação de Referência

Se precisar de mais detalhes:

- **[docs/DEV-SETUP.md](./DEV-SETUP.md)** - Guia completo passo-a-passo
- **[docs/QUICK-START.md](./QUICK-START.md)** - Quick reference
- **[scripts/README.md](../scripts/README.md)** - Detalhes técnicos dos scripts

---

**Boa sorte com os testes! 🚀**

**Última atualização:** 2024-10-15
