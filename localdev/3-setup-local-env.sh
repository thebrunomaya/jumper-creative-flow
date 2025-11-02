#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Setup Ambiente Local Completo${NC}"
echo "=========================================="
echo ""

# Etapa 1: Validar Backup
echo -e "${BLUE}📋 Etapa 1/7: Validando Backup${NC}"
echo ""

BACKUP_DIR="./localdev/db-backups"
LATEST_BACKUP=$(find "$BACKUP_DIR" -name "production_*.dump" -type f 2>/dev/null | sort -r | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${YELLOW}⚠️  Nenhum backup encontrado${NC}"
    echo ""
    read -p "Deseja criar um backup agora? (yes/no): " CREATE_BACKUP
    
    if [[ $CREATE_BACKUP =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        echo "Executando script de backup..."
        echo ""
        
        if ./localdev/2-backup-production.sh; then
            LATEST_BACKUP=$(find "$BACKUP_DIR" -name "production_*.dump" -type f 2>/dev/null | sort -r | head -1)
            
            if [ -z "$LATEST_BACKUP" ]; then
                echo ""
                echo -e "${RED}❌ Backup não foi criado${NC}"
                exit 1
            fi
        else
            echo ""
            echo -e "${RED}❌ Falha ao criar backup${NC}"
            exit 1
        fi
    else
        echo ""
        echo -e "${RED}❌ Setup cancelado${NC}"
        echo ""
        echo "Execute primeiro: ./localdev/2-backup-production.sh"
        echo ""
        exit 1
    fi
fi

if [[ "$OSTYPE" == "darwin"* ]]; then
    BACKUP_TIME=$(stat -f %m "$LATEST_BACKUP")
else
    BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
fi

CURRENT_TIME=$(date +%s)
BACKUP_AGE_HOURS=$(( ($CURRENT_TIME - $BACKUP_TIME) / 3600 ))
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)

echo -e "${GREEN}✅ Backup encontrado:${NC}"
echo "   Arquivo: $(basename "$LATEST_BACKUP")"
echo "   Idade: ${BACKUP_AGE_HOURS}h"
echo "   Tamanho: ${BACKUP_SIZE}"
echo ""

# Etapa 2: Iniciar Supabase
echo -e "${BLUE}📋 Etapa 2/7: Iniciando Supabase Local${NC}"
echo ""

if supabase status > /dev/null 2>&1; then
    echo "ℹ️  Supabase já está rodando"
    echo ""
    read -p "Deseja reiniciar? (yes/no): " RESTART
    
    if [[ $RESTART =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        echo "Parando Supabase..."
        supabase stop
        echo ""
        echo "Iniciando Supabase..."
        supabase start
    fi
else
    echo "Iniciando Supabase Local..."
    echo "(Primeira vez: 2-3 minutos baixando imagens)"
    echo ""
    
    supabase start
fi

echo ""
echo -e "${GREEN}✅ Supabase Local iniciado${NC}"
echo ""

# Etapa 3: Reset Database
echo -e "${BLUE}📋 Etapa 3/7: Resetando Banco de Dados${NC}"
echo ""
echo -e "${YELLOW}⚠️  Isso vai apagar todos os dados atuais${NC}"
echo ""

read -p "Continuar com reset? (yes/no): " CONFIRM_RESET

if [[ ! $CONFIRM_RESET =~ ^[Yy][Ee][Ss]$ ]]; then
    echo ""
    echo -e "${RED}❌ Setup cancelado${NC}"
    exit 1
fi

echo ""
echo "Executando reset..."
echo ""

supabase db reset

echo ""
echo -e "${GREEN}✅ Database resetado${NC}"
echo ""

# Etapa 4: Restaurar Dados
echo -e "${BLUE}📋 Etapa 4/7: Restaurando Dados de Produção${NC}"
echo ""
echo "Arquivo: $(basename "$LATEST_BACKUP")"
echo ""
echo "⏳ Isso pode demorar 1-3 minutos..."
echo ""

if pg_restore \
    --dbname="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    --data-only \
    --no-owner \
    "$LATEST_BACKUP" 2>&1 | tee /tmp/restore.log; then
    
    echo ""
    echo -e "${GREEN}✅ Dados restaurados${NC}"
    echo ""
    
    USER_COUNT=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
        -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | xargs || echo "0")
    
    if [ "$USER_COUNT" != "0" ]; then
        echo "   ✅ Importados $USER_COUNT usuários"
    else
        echo -e "   ${YELLOW}⚠️  Nenhum usuário encontrado${NC}"
    fi
    echo ""
else
    echo ""
    echo -e "${RED}❌ Falha ao restaurar dados${NC}"
    echo ""
    echo "Logs: cat /tmp/restore.log"
    echo ""
    exit 1
fi

# Etapa 5: Senha Dev
echo -e "${BLUE}📋 Etapa 5/7: Configurando Senha de Desenvolvimento${NC}"
echo ""

DEV_EMAIL="bruno@jumper.studio"
DEV_PASSWORD="senha123"

echo "Configurando senha para: $DEV_EMAIL"
echo ""

USER_EXISTS=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -t -c "SELECT COUNT(*) FROM auth.users WHERE email = '$DEV_EMAIL';" 2>/dev/null | xargs)

if [ "$USER_EXISTS" != "1" ]; then
    echo -e "${YELLOW}⚠️  Usuário não encontrado${NC}"
    echo "   Use suas credenciais reais"
    echo ""
else
    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
        -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" > /dev/null 2>&1
    
    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
        -c "UPDATE auth.users SET encrypted_password = crypt('$DEV_PASSWORD', gen_salt('bf')) WHERE email = '$DEV_EMAIL';" \
        > /dev/null 2>&1
    
    echo -e "   ${GREEN}✅ Senha configurada: $DEV_PASSWORD${NC}"
    echo ""
fi

# Etapa 6: Dependências
echo -e "${BLUE}📋 Etapa 6/7: Instalando Dependências${NC}"
echo ""

if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    echo "(Pode demorar 2-3 minutos)"
    echo ""
    npm install
else
    echo "node_modules existe"
    echo ""
    read -p "Reinstalar dependências? (yes/no): " REINSTALL
    
    if [[ $REINSTALL =~ ^[Yy][Ee][Ss]$ ]]; then
        echo ""
        npm install
    else
        echo "   ⏭️  Pulando instalação"
    fi
fi

echo ""
echo -e "${GREEN}✅ Dependências prontas${NC}"
echo ""

# Etapa 7: Dev Server
echo -e "${BLUE}📋 Etapa 7/7: Iniciando Servidor${NC}"
echo ""

PORT_PID=$(lsof -ti:8080 2>/dev/null)

if [ -n "$PORT_PID" ]; then
    echo -e "${YELLOW}⚠️  Porta 8080 em uso (PID: $PORT_PID)${NC}"
    read -p "Matar processo e iniciar novo? (yes/no): " KILL_PORT
    
    if [[ $KILL_PORT =~ ^[Yy][Ee][Ss]$ ]]; then
        kill -9 $PORT_PID 2>/dev/null
        sleep 2
    else
        echo ""
        echo "⏭️  Servidor não iniciado"
        echo "   Inicie manualmente: npm run dev"
        echo ""
        PORT_PID=""
    fi
fi

if [ -z "$PORT_PID" ] || [[ $KILL_PORT =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Iniciando Vite..."
    echo ""
    
    npm run dev > /tmp/vite-dev.log 2>&1 &
    VITE_PID=$!
    
    sleep 3
    
    if kill -0 $VITE_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Servidor iniciado (PID: $VITE_PID)${NC}"
        
        if grep -q "Local:" /tmp/vite-dev.log; then
            DEV_URL=$(grep "Local:" /tmp/vite-dev.log | awk '{print $NF}')
            echo "   🌐 URL: $DEV_URL"
        else
            echo "   🌐 URL: http://localhost:8080"
        fi
    else
        echo -e "${RED}❌ Falha ao iniciar servidor${NC}"
        echo ""
        echo "Logs: cat /tmp/vite-dev.log"
    fi
fi

echo ""

# Resumo
echo "=========================================="
echo -e "${GREEN}🎉 Setup Completo!${NC}"
echo "=========================================="
echo ""
echo "📍 Pontos de Acesso:"
echo "   🌐 Frontend:        http://localhost:8080"
echo "   🎨 Supabase Studio: http://127.0.0.1:54323"
echo "   🗄️  Database:        postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo "   ⚡ Edge Functions:  http://127.0.0.1:54321/functions/v1/"
echo ""
echo "🔑 Credenciais:"
echo "   Email:    $DEV_EMAIL"
echo "   Senha:    $DEV_PASSWORD"
echo ""
echo "🎯 Validação:"
echo "   1. Abra http://localhost:8080"
echo "   2. Console (F12)"
echo "   3. Verifique: 🔗 Supabase: LOCAL"
echo ""