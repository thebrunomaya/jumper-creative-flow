# ⚡ Quick Start - Jumper Hub Development

**Um comando para começar:**

```bash
./scripts/start-dev.sh
```

---

## 📝 Passo-a-Passo Manual

### 1️⃣ Iniciar Supabase Local
```bash
npx supabase start
```

### 2️⃣ Importar Dados de Produção
```bash
# Usar backup existente
./scripts/restore-to-local.sh ./backups/production_data_LATEST.sql

# OU criar novo backup
npx supabase db dump --linked --data-only --use-copy \
  --file="./backups/production_data_$(date +%Y%m%d_%H%M%S).sql"
```

### 3️⃣ Iniciar Frontend (LOCAL)
```bash
# Opção A: Criar .env.local
cat > .env.local <<'EOF'
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF
npm run dev

# Opção B: Variáveis inline
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 \
npm run dev
```

### 4️⃣ Verificar
- **App:** http://localhost:8080
- **Console:** Deve mostrar "🔗 Supabase: LOCAL"
- **Studio:** http://127.0.0.1:54323

---

## 🛑 Parar Ambiente

```bash
# Parar Supabase (mantém dados)
npx supabase stop

# Parar + apagar dados
npx supabase stop --no-backup
```

---

## ✅ Checklist

- [ ] Docker Desktop rodando
- [ ] `npx supabase status` funcionando
- [ ] Dados de produção importados
- [ ] Console mostra "LOCAL" (não "PRODUCTION")
- [ ] Login funcionando

---

## 🔗 Links Úteis

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:8080 |
| **Supabase Studio** | http://127.0.0.1:54323 |
| **Mailpit (emails)** | http://127.0.0.1:54324 |
| **Database** | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

---

## 📚 Documentação Completa

- **[DEV-SETUP.md](./DEV-SETUP.md)** - Guia detalhado passo-a-passo
- **[CLAUDE.md](../CLAUDE.md)** - Instruções gerais do projeto
- **[scripts/README.md](../scripts/README.md)** - Documentação dos scripts

---

**Última atualização:** 2024-10-15
