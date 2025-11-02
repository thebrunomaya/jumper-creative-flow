#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}⚡ Reset Rápido do Banco Local${NC}"
echo "=========================================="
echo ""

# Pré-requisito 1: Supabase rodando
echo "🔍 Verificando pré-requisitos..."
echo ""

if ! supabase status > /dev/null 2>&1; then
    echo -e "${RED}❌ Supabase Local não está rodando${NC}"
    echo ""
    echo "Para setup inicial completo:"
    echo "   ./localdev/3-setup-local-env.sh"
    echo ""
    echo "Ou apenas inicie:"
    echo "   supabase start"
    echo ""
    exit 1
fi

echo -e "   ${GREEN}✅ Supabase Local rodando${NC}"

# Pré-requisito 2: Backup
BACKUP_DIR="./localdev/db-backups"
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "production_*.dump" -type f 2>/dev/null | sort -r | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "   ${RED}❌ Nenhum backup encontrado${NC}"
    echo ""
    echo "Crie um primeiro:"
    echo "   ./localdev/2-backup-production.sh"
    echo ""
    exit 1
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    BACKUP_TIME=$(stat -f %m "$LATEST_BACKUP")
else
    BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
fi

CURRENT_TIME=$(date +%s)
BACKUP_AGE_HOURS=$(( ($CURRENT_TIME - $BACKUP_TIME) / 3600 ))
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)

echo -e "   ${GREEN}✅ Backup disponível${NC}"
echo "      Arquivo: $(basename "$LATEST_BACKUP")"
echo "      Idade: ${BACKUP_AGE_HOURS}h"
echo "      Tamanho: ${BACKUP_SIZE}"

echo ""

if [ $BACKUP_AGE_HOURS -gt 168 ]; then
    echo -e "   ${YELLOW}⚠️  Backup tem mais de 7 dias${NC}"
    echo ""
    read -p "   Criar backup atualizado? (yes/no): " UPDATE_BACKUP
    
    if [[ $UPDATE_BACKUP =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        echo "   Executando backup..."
        echo ""
        
        if ./localdev/2-backup-production.sh; then
            LATEST_BACKUP=$(find "$BACKUP_DIR" -name "production_*.dump" -type f 2>/dev/null | sort -r | head -1)
            echo ""
            echo -e "   ${GREEN}✅ Backup atualizado${NC}"
            echo ""
        else
            echo ""
            echo -e "   ${YELLOW}⚠️  Falha - usando backup existente${NC}"
            echo ""
        fi
    fi
fi

# Confirmação
echo -e "${YELLOW}⚠️  AVISO: Operação Destrutiva${NC}"
echo ""
echo "Este script vai:"
echo "  1. Apagar TODOS os dados do banco local"
echo "  2. Reaplicar todas as migrations"
echo "  3. Restaurar dados: $(basename "$LATEST_BACKUP")"
echo ""

read -p "Continuar? (yes/no): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
    echo ""
    echo -e "${RED}❌ Operação cancelada${NC}"
    exit 0
fi

echo ""

# Etapa 1: Reset
echo -e "${BLUE}🗄️  Etapa 1/3: Resetando banco...${NC}"
echo ""

if supabase db reset 2>&1 | tail -5; then
    echo ""
    echo -e "   ${GREEN}✅ Database resetado${NC}"
else
    echo ""
    echo -e "   ${RED}❌ Falha ao resetar${NC}"
    echo ""
    echo "   Tente:"
    echo "   1. supabase stop"
    echo "   2. supabase start"
    echo "   3. Execute este script novamente"
    echo ""
    exit 1
fi

echo ""

# Etapa 2: Restaurar
echo -e "${BLUE}📥 Etapa 2/3: Restaurando dados...${NC}"
echo ""

echo "   Limpando dados do seed..."
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" << 'EOF' > /dev/null 2>&1
SET session_replication_role = replica;
TRUNCATE TABLE auth.users CASCADE;
TRUNCATE TABLE storage.objects CASCADE;
SET session_replication_role = DEFAULT;
EOF

echo -e "   ${GREEN}✅ Tabelas limpas${NC}"
echo ""

echo "   Arquivo: $(basename "$LATEST_BACKUP")"
echo ""

if pg_restore \
    --dbname="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    --data-only \
    --no-owner \
    "$LATEST_BACKUP" 2>&1 | grep -v "permission denied" | grep -v "system trigger"; then
    
    echo ""
    echo -e "   ${GREEN}✅ Restauração concluída${NC}"
    
    USER_COUNT=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
        -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | xargs || echo "0")
    
    if [ "$USER_COUNT" != "0" ]; then
        echo "   ✅ Importados $USER_COUNT usuários"
    else
        echo -e "   ${YELLOW}⚠️  Nenhum usuário encontrado${NC}"
    fi
else
    echo ""
    echo -e "   ${RED}❌ Falha na restauração${NC}"
    echo ""
    exit 1
fi

echo ""

# Etapa 3: Senha Dev
echo -e "${BLUE}🔐 Etapa 3/3: Configurando senha dev...${NC}"
echo ""

DEV_EMAIL="bruno@jumper.studio"
DEV_PASSWORD="senha123"

USER_EXISTS=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -t -c "SELECT COUNT(*) FROM auth.users WHERE email = '$DEV_EMAIL';" 2>/dev/null | xargs)

if [ "$USER_EXISTS" != "1" ]; then
    echo -e "   ${YELLOW}⚠️  Usuário não encontrado${NC}"
    echo "   Use credenciais de produção"
else
    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
        -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" > /dev/null 2>&1
    
    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
        -c "UPDATE auth.users SET encrypted_password = crypt('$DEV_PASSWORD', gen_salt('bf')) WHERE email = '$DEV_EMAIL';" \
        > /dev/null 2>&1
    
    echo -e "   ${GREEN}✅ Senha configurada: $DEV_PASSWORD${NC}"
fi

echo ""

# Resumo
echo "=========================================="
echo -e "${GREEN}✅ Reset Completo!${NC}"
echo "=========================================="
echo ""
echo "📊 Estado Atual:"
echo "   • Banco resetado com migrations recentes"
echo "   • Dados restaurados (${BACKUP_AGE_HOURS}h atrás)"
echo "   • Senha dev configurada"
echo ""
echo "🔑 Login:"
echo "   Email:    $DEV_EMAIL"
echo "   Senha:    $DEV_PASSWORD"
echo ""
echo "🌐 Acesse:"
echo "   Frontend: http://localhost:8080"
echo "   Studio:   http://127.0.0.1:54323"
echo ""
echo "💡 Para resetar novamente:"
echo "   ./localdev/4-quick-reset.sh"
echo ""