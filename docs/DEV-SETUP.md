# 🚀 Guia de Setup - Ambiente de Desenvolvimento Local

**Objetivo:** Configurar ambiente local com clone do database de produção para desenvolvimento seguro.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ **Docker Desktop** rodando
- ✅ **Node.js** (v18+)
- ✅ **Supabase CLI** (via npx)
- ✅ **Git** (para pull do código)

**Verificar:**
```bash
docker --version          # Docker version 20.10+
node --version            # v18.0.0+
npx supabase --version    # 2.48.3+
```

---

## 🔄 Passo-a-Passo Completo

### **1. Abrir o Projeto**

```bash
# Navegar para o diretório do projeto
cd /Applications/Claude/jumper-creative-flow

# Atualizar código do GitHub (se necessário)
git pull origin main
```

---

### **2. Iniciar Supabase Local**

```bash
# Iniciar containers Docker (PostgreSQL, Auth, Storage, etc)
npx supabase start
```

**Saída esperada:**
```
✅ Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
    Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
```

**⏱️ Tempo:** ~30 segundos (primeira vez pode demorar mais para baixar imagens Docker)

---

### **3. Verificar Status**

```bash
npx supabase status
```

**Deve mostrar:**
- ✅ Database rodando na porta 54322
- ✅ Studio rodando na porta 54323
- ✅ API rodando na porta 54321

---

### **4. Importar Dados de Produção**

#### **Opção A: Usar Backup Existente (Recomendado)**

Se você já tem um backup recente (menos de 7 dias):

```bash
# Listar backups disponíveis
ls -lh backups/*.sql

# Restaurar o mais recente
./scripts/restore-to-local.sh ./backups/production_data_YYYYMMDD_HHMMSS.sql

# Confirmar quando perguntado:
# ⚠️  This will REPLACE all local data. Continue? (yes/no): yes
```

#### **Opção B: Criar Novo Backup e Restaurar**

Se não tem backup ou está desatualizado (>7 dias):

```bash
# 1. Fazer backup da produção
npx supabase db dump --linked --data-only --use-copy \
  --file="./backups/production_data_$(date +%Y%m%d_%H%M%S).sql"

# ⏱️ Tempo: ~30-60 segundos (depende do tamanho do database)

# 2. Restaurar no local
./scripts/restore-to-local.sh ./backups/production_data_YYYYMMDD_HHMMSS.sql
```

**Saída esperada:**
```
✅ Restore completed successfully!

🎯 Next steps:
   1. Verify data in Supabase Studio: http://127.0.0.1:54323
   2. Test application: npm run dev
```

---

### **5. Verificar Dados Importados**

```bash
# Verificar usuários reais (não dummy)
docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "SELECT email, nome, role FROM j_hub_users LIMIT 5;"
```

**Deve mostrar usuários reais:**
```
         email         |      nome      |  role
-----------------------+----------------+--------
 bruno@jumper.studio   | Bruno Maya     | admin
 pedro@jumper.studio   | Pedro Waghabi  | staff
 alice@estudiocru.com  | Alice Leal     | client
```

**❌ Se aparecer `exemplo.com`, algo deu errado!**

---

### **6. Instalar Dependências do Frontend**

```bash
# Instalar pacotes NPM (se ainda não instalou)
npm install
```

**⏱️ Tempo:** ~30-60 segundos

---

### **7. Configurar Variáveis de Ambiente**

```bash
# Verificar se .env existe
cat .env

# Deve conter (para produção):
VITE_SUPABASE_URL=https://biwwowendjuzvpttyrlb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Para rodar em LOCAL, use:**
```bash
# Criar arquivo .env.local (sobrescreve .env)
cat > .env.local <<'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
```

**OU rodar com variáveis inline:**
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 \
npm run dev
```

---

### **8. Iniciar Servidor de Desenvolvimento**

```bash
npm run dev
```

**Saída esperada:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**⏱️ Tempo:** ~5 segundos

---

### **9. Verificar Conexão no Browser**

1. **Abrir aplicação:** http://localhost:8080

2. **Verificar DevTools Console:**
   - Pressionar `F12` ou `Cmd+Option+I`
   - Na aba Console, procurar:

   ```
   🔗 Supabase: LOCAL (http://127.0.0.1:54321)
   ```

   **✅ Se aparecer "LOCAL" → Correto!**

   **❌ Se aparecer "PRODUCTION" → PARE! Você está conectado em produção!**

3. **Fazer Login:**
   - Email: `bruno@jumper.studio`
   - Clicar em "Enviar link mágico"
   - Abrir Mailpit: http://127.0.0.1:54324
   - Clicar no link de login recebido

---

### **10. Verificar Supabase Studio** (Opcional)

```bash
# Abrir Supabase Studio Local
open http://127.0.0.1:54323
```

**O que você pode fazer:**
- Ver todas as tabelas
- Executar queries SQL
- Ver logs em tempo real
- Gerenciar usuários Auth

---

## ✅ Checklist de Validação

Antes de começar a desenvolver, confirme:

- [ ] `npx supabase status` mostra serviços rodando
- [ ] Backup de produção importado com sucesso
- [ ] `j_hub_users` tem usuários **reais** (não dummy)
- [ ] `.env.local` configurado para LOCAL OU variáveis inline
- [ ] Browser console mostra "🔗 Supabase: LOCAL"
- [ ] `npm run dev` rodando sem erros
- [ ] Login funcionando via http://localhost:8080

---

## 🛑 Parar Ambiente Local

Quando terminar o desenvolvimento:

```bash
# Parar Supabase Local (mantém dados)
npx supabase stop

# OU parar e apagar todos os dados
npx supabase stop --no-backup
```

---

## 🔄 Resumo dos Comandos (Copy-Paste)

```bash
# === SETUP COMPLETO ===
cd /Applications/Claude/jumper-creative-flow
git pull origin main
npx supabase start

# Importar dados (use backup existente ou crie novo)
./scripts/restore-to-local.sh ./backups/production_data_LATEST.sql

# Verificar dados
docker run --rm --network host postgres:15 \
  psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "SELECT COUNT(*) FROM j_hub_users;"

# Iniciar frontend (com LOCAL)
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 \
npm run dev

# Abrir: http://localhost:8080
# Verificar console: deve mostrar "LOCAL"
```

---

## ⚠️ Troubleshooting

### **Problema: Console mostra "PRODUCTION"**

**Causa:** Variáveis de ambiente apontando para produção.

**Solução:**
```bash
# Verificar variáveis do sistema
env | grep VITE

# Se encontrar, remover de ~/.zshrc ou ~/.bash_profile
# Depois recarregar:
source ~/.zshrc

# E rodar com variáveis inline
VITE_SUPABASE_URL=http://127.0.0.1:54321 npm run dev
```

---

### **Problema: Erro "connection refused" no restore**

**Causa:** Supabase Local não está rodando.

**Solução:**
```bash
npx supabase status
# Se não aparecer nada, iniciar:
npx supabase start
```

---

### **Problema: Backup tem usuários dummy**

**Causa:** Backup não foi feito corretamente ou importado incorretamente.

**Solução:**
```bash
# 1. Fazer novo backup com --data-only
npx supabase db dump --linked --data-only --use-copy \
  --file="./backups/production_fresh_$(date +%Y%m%d_%H%M%S).sql"

# 2. Verificar que tem dados reais
grep -A 5 "COPY.*j_hub_users" ./backups/production_fresh_*.sql | head -10

# 3. Restaurar
./scripts/restore-to-local.sh ./backups/production_fresh_*.sql
```

---

### **Problema: Docker não está rodando**

**Solução:**
1. Abrir Docker Desktop
2. Aguardar inicializar (ícone na barra superior)
3. Verificar: `docker ps`

---

## 📊 Dados Importados (Referência)

Após importação completa, você deve ter:

| Tabela | Registros Aprox. | Descrição |
|--------|-----------------|-----------|
| `j_rep_metaads_bronze` | ~35,000 | Dados Meta Ads |
| `j_hub_optimization_*` | ~60-200 | Sistema de otimizações |
| `j_hub_notion_db_accounts` | ~48 | Contas de clientes |
| `j_hub_notion_db_managers` | ~24 | Gerentes |
| `j_hub_users` | ~9 | Usuários do sistema |
| `j_ads_creative_*` | ~5-10 | Criativos submetidos |

---

## 🔗 Links Úteis

- **Frontend Local:** http://localhost:8080
- **Supabase Studio:** http://127.0.0.1:54323
- **Mailpit (emails):** http://127.0.0.1:54324
- **Supabase API:** http://127.0.0.1:54321
- **Database URL:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

---

## 📚 Documentação Relacionada

- [CLAUDE.md](../CLAUDE.md) - Instruções gerais do projeto
- [scripts/README.md](../scripts/README.md) - Documentação dos scripts de backup/restore
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema

---

**Última atualização:** 2024-10-15
**Autor:** Claude Code Assistant
