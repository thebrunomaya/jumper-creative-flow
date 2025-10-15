# Database Backup & Restore Scripts

Scripts para importar dados de produção para ambiente local de desenvolvimento.

## 🔄 Workflow

### 1. Backup da Produção

```bash
./scripts/backup-production.sh
```

**O que faz:**
- Conecta no database de produção (biwwowendjuzvpttyrlb)
- Faz dump completo usando `pg_dump`
- Salva em `./backups/production_YYYYMMDD_HHMMSS.sql`
- Mostra tamanho do arquivo gerado

**Opções do pg_dump:**
- `--clean`: Adiciona comandos DROP antes de CREATE (limpa antes de criar)
- `--if-exists`: Usa IF EXISTS com DROP (mais seguro)
- `--no-owner`: Não restaura ownership (evita erros de permissão)
- `--no-privileges`: Não restaura privilégios (usa defaults locais)

### 2. Restore no Local

```bash
./scripts/restore-to-local.sh ./backups/production_data_20241015_124000.sql
```

**O que faz:**
- Verifica se arquivo de backup existe
- Pede confirmação (⚠️ SUBSTITUI dados locais!)
- **Desabilita triggers e foreign keys** temporariamente
- Restaura backup no Supabase Local (127.0.0.1:54322)
- **Substitui dados existentes** (não adiciona duplicados)
- Re-habilita triggers e foreign keys
- Mostra próximos passos para verificação

**⚠️ IMPORTANTE:**
- Este comando **SUBSTITUI** dados nas tabelas importadas
- Dados dummy são **removidos** e substituídos por dados reais
- O script desabilita `session_replication_role` para ignorar foreign keys durante import
- Sempre faça backup local se tiver dados importantes

### 3. Verificação

Após restore, verificar:

```bash
# 1. Abrir Supabase Studio
open http://127.0.0.1:54323

# 2. Verificar tabelas via psql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c '\dt'

# 3. Contar registros em tabela específica
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT COUNT(*) FROM j_hub_users;"

# 4. Testar aplicação
npm run dev
# Abrir: http://localhost:8080
```

## 📂 Estrutura de Arquivos

```
jumper-creative-flow/
├── scripts/
│   ├── backup-production.sh      # Script de backup
│   ├── restore-to-local.sh       # Script de restore
│   └── README.md                 # Esta documentação
└── backups/
    ├── .gitignore                # Ignora backups no git
    └── production_*.sql          # Backups (não commitados)
```

## 🔒 Segurança

**Backups contêm dados sensíveis:**
- Emails de usuários
- Dados de clientes (contas, parceiros)
- Gravações e transcrições de otimizações
- Métricas de campanhas

**Proteções:**
- ✅ Backups ignorados no `.gitignore`
- ✅ Scripts usam credenciais read-only para produção
- ✅ Confirmação explícita antes de restore
- ⚠️ **NUNCA** compartilhar backups publicamente
- ⚠️ **NUNCA** commitar arquivos `.sql` no git

## 🚨 Troubleshooting

### Erro: "pg_dump: command not found"

Instalar PostgreSQL client:

```bash
# macOS
brew install postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql-client

# Verificar instalação
pg_dump --version
```

### Erro: "connection refused" ao fazer backup

Verificar:
1. URL de produção está correta
2. Senha está correta
3. Firewall não está bloqueando conexão
4. Supabase Pooler está ativo (porta 6543)

### Erro: "relation already exists" no restore

Normal se database local já tem dados. O script usa `--clean --if-exists` para:
1. Dropar objetos existentes (se existirem)
2. Criar novamente com dados da produção

Se ainda houver erro, fazer reset completo:

```bash
npx supabase db reset
./scripts/restore-to-local.sh <backup-file>
```

### Backup muito grande / lento

Para fazer backup apenas de tabelas específicas:

```bash
# Editar backup-production.sh e adicionar opção -t:
pg_dump "${PROD_DB_URL}" \
  -t j_hub_users \
  -t j_hub_notion_db_accounts \
  --clean --if-exists --no-owner --no-privileges \
  --file="${BACKUP_FILE}"
```

## 📊 Quando Usar

**✅ Use para:**
- Testes com dados reais de produção
- Debugging de issues reportados por usuários
- Desenvolvimento de queries complexas
- Validação de migrations antes de deploy

**❌ Não use para:**
- Desenvolvimento normal de features (use dados mockados)
- Testes automatizados (use fixtures)
- Compartilhar dados com terceiros
- Backups de longo prazo (use backups oficiais da Supabase)

## 🔗 Referências

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL psql](https://www.postgresql.org/docs/current/app-psql.html)
