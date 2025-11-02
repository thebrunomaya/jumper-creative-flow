#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROD_PROJECT_REF="biwwowendjuzvpttyrlb"
PROD_HOST="aws-0-sa-east-1.pooler.supabase.com"
PROD_PORT="5432"
PROD_DB="postgres"
PROD_USER="postgres.$PROD_PROJECT_REF"

BACKUP_DIR="./localdev/db-backups"
BACKUP_FILE="${BACKUP_DIR}/production_$(date +%Y%m%d_%H%M%S).dump"

echo -e "${BLUE}📦 Backup de Produção${NC}"
echo "=========================================="
echo ""

# Validação: pg_dump
if ! which pg_dump > /dev/null 2>&1; then
    echo -e "${RED}❌ pg_dump não encontrado${NC}"
    echo ""
    echo "Para instalar:"
    echo "  brew install libpq"
    echo "  echo 'export PATH=\"/opt/homebrew/opt/libpq/bin:\$PATH\"' >> ~/.zshrc"
    echo "  source ~/.zshrc"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ pg_dump encontrado${NC}"
echo ""

# Criar pasta de backups
if [ ! -d "$BACKUP_DIR" ]; then
    echo "📁 Criando pasta de backups..."
    mkdir -p "$BACKUP_DIR"
    echo -e "   ${GREEN}✅ Pasta criada: $BACKUP_DIR${NC}"
    echo ""
fi

# Verificar backups recentes
echo "🔍 Verificando backups existentes..."

LATEST_BACKUP=$(find "$BACKUP_DIR" -name "production_*.dump" -mtime -1 2>/dev/null | sort -r | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        BACKUP_TIME=$(stat -f %m "$LATEST_BACKUP")
    else
        BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
    fi
    
    CURRENT_TIME=$(date +%s)
    BACKUP_AGE_HOURS=$(( ($CURRENT_TIME - $BACKUP_TIME) / 3600 ))
    
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    
    echo ""
    echo -e "${GREEN}✅ Backup recente encontrado:${NC}"
    echo "   Arquivo: $(basename "$LATEST_BACKUP")"
    echo "   Idade: ${BACKUP_AGE_HOURS}h"
    echo "   Tamanho: ${BACKUP_SIZE}"
    echo ""
    
    read -p "Deseja usar este backup existente? (yes/no): " USE_EXISTING
    
    if [[ $USE_EXISTING =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        echo -e "${GREEN}✅ Usando backup existente${NC}"
        echo "   Arquivo: $LATEST_BACKUP"
        echo ""
        exit 0
    fi
    
    echo ""
    echo "Continuando com novo backup..."
    echo ""
else
    echo "   Nenhum backup recente encontrado"
    echo ""
fi

# Solicitar senha
echo -e "${BLUE}🔐 Autenticação Necessária${NC}"
echo ""
echo "Este script precisa conectar ao banco de dados de produção."
echo "A senha NÃO será armazenada - existe apenas durante esta execução."
echo ""
echo "📍 Onde encontrar a senha:"
echo "   Supabase Dashboard → Settings → Database → Database Password"
echo ""

read -s -p "Digite a senha de produção: " PROD_DB_PASSWORD
echo ""
echo ""

if [ -z "$PROD_DB_PASSWORD" ]; then
    echo -e "${RED}❌ Senha não fornecida${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Senha fornecida${NC}"
echo ""

# Teste de conexão
echo "🔌 Testando conexão com produção..."

PROD_CONNECTION_STRING="postgresql://${PROD_USER}:${PROD_DB_PASSWORD}@${PROD_HOST}:${PROD_PORT}/${PROD_DB}"

TEST_RESULT=$(PGPASSWORD="$PROD_DB_PASSWORD" psql "$PROD_CONNECTION_STRING" \
    -c "\conninfo" 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha ao conectar em produção${NC}"
    echo ""
    echo "Detalhes do erro:"
    echo "$TEST_RESULT" | head -5
    echo ""
    echo "Possíveis causas:"
    echo "  1. Senha incorreta"
    echo "  2. Rede/Firewall bloqueando"
    echo "  3. Problemas no Supabase"
    echo ""
    exit 1
fi

echo -e "   ${GREEN}✅ Conexão estabelecida${NC}"
echo ""

# Backup
echo "📥 Iniciando backup..."
echo ""
echo "   Origem: Banco de produção (${PROD_PROJECT_REF})"
echo "   Destino: ${BACKUP_FILE}"
echo ""
echo "   ⏳ Isso pode demorar 2-5 minutos..."
echo ""

if PGPASSWORD="$PROD_DB_PASSWORD" pg_dump "$PROD_CONNECTION_STRING" \
    --format=custom \
    --no-owner \
    --file="$BACKUP_FILE" 2>&1 | tee /tmp/backup.log; then
    
    echo ""
    echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
    echo ""
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "📊 Informações do Backup:"
    echo "   Arquivo: $(basename "$BACKUP_FILE")"
    echo "   Tamanho: ${BACKUP_SIZE}"
    echo "   Local: ${BACKUP_FILE}"
    echo ""
    
    BACKUP_SIZE_BYTES=$(stat -f %z "$BACKUP_FILE" 2>/dev/null || stat -c %s "$BACKUP_FILE" 2>/dev/null)
    
    if [ "$BACKUP_SIZE_BYTES" -lt 1000000 ]; then
        echo -e "${YELLOW}⚠️  ATENÇÃO: Backup muito pequeno (< 1MB)${NC}"
        echo ""
    else
        echo -e "${GREEN}✅ Tamanho do backup correto${NC}"
        echo ""
    fi
    
    echo "🎯 Próximos Passos:"
    echo "   1. Para setup completo: ./localdev/3-setup-local-env.sh"
    echo "   2. Ou apenas restore: ./localdev/4-quick-reset.sh"
    echo ""
    
    exit 0
    
else
    echo ""
    echo -e "${RED}❌ Backup falhou!${NC}"
    echo ""
    echo "Verifique: cat /tmp/backup.log"
    echo ""
    
    if [ -f "$BACKUP_FILE" ]; then
        rm "$BACKUP_FILE"
    fi
    
    exit 1
fi