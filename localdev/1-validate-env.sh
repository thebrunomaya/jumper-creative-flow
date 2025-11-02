#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROBLEMS_FOUND=0
CRITICAL_FAILURE=false

echo -e "${BLUE}🔍 Validando Ambiente de Desenvolvimento${NC}"
echo "=========================================="
echo ""

# 1. Docker Desktop
echo "1. Verificando Docker Desktop..."

if docker ps > /dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    echo -e "   ${GREEN}✅ Docker está rodando${NC}"
    echo "      Versão: $DOCKER_VERSION"
else
    echo -e "   ${RED}❌ Docker não está rodando${NC}"
    echo ""
    echo "   Docker Desktop precisa estar aberto e inicializado."
    echo "   Por favor:"
    echo "   1. Abra a aplicação Docker Desktop"
    echo "   2. Aguarde até o ícone ficar estável (30-60 segundos)"
    echo "   3. Execute este script novamente"
    echo ""
    
    PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
    CRITICAL_FAILURE=true
fi

echo ""

# 2. PostgreSQL Tools
echo "2. Verificando PostgreSQL Tools..."

if which pg_dump > /dev/null 2>&1; then
    PG_VERSION=$(pg_dump --version)
    echo -e "   ${GREEN}✅ pg_dump encontrado${NC}"
    echo "      Versão: $PG_VERSION"
    
    if which pg_restore > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ pg_restore encontrado${NC}"
    else
        echo -e "   ${YELLOW}⚠️  pg_restore não encontrado${NC}"
        PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
    fi
else
    echo -e "   ${RED}❌ pg_dump não encontrado${NC}"
    echo ""
    echo "   Para instalar:"
    echo "   brew install libpq"
    echo "   echo 'export PATH=\"/opt/homebrew/opt/libpq/bin:\$PATH\"' >> ~/.zshrc"
    echo "   source ~/.zshrc"
    echo ""
    
    PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
    CRITICAL_FAILURE=true
fi

echo ""

# 3. Node.js e npm
echo "3. Verificando Node.js e npm..."

if which node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo -e "   ${GREEN}✅ Node.js instalado${NC}"
    echo "      Node: $NODE_VERSION"
    echo "      npm: $NPM_VERSION"
    
    NODE_MAJOR=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "   ${YELLOW}⚠️  Node.js versão antiga (recomendado: v20+)${NC}"
    fi
else
    echo -e "   ${RED}❌ Node.js não encontrado${NC}"
    echo ""
    echo "   Para instalar: brew install node"
    echo ""
    
    PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
    CRITICAL_FAILURE=true
fi

echo ""

# 4. Supabase CLI
echo "4. Verificando Supabase CLI..."

if which supabase > /dev/null 2>&1; then
    SUPABASE_VERSION=$(supabase --version)
    echo -e "   ${GREEN}✅ Supabase CLI instalado${NC}"
    echo "      Versão: $SUPABASE_VERSION"
else
    echo -e "   ${RED}❌ Supabase CLI não encontrado${NC}"
    echo ""
    echo "   Para instalar: brew install supabase/tap/supabase"
    echo ""
    
    PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
    CRITICAL_FAILURE=true
fi

echo ""

# 5. Autenticação Supabase CLI
echo "5. Verificando autenticação Supabase CLI..."

if supabase projects list > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Supabase CLI autenticado${NC}"
    
    if supabase projects list 2>&1 | grep -q "biwwowendjuzvpttyrlb"; then
        echo -e "   ${GREEN}✅ Projeto J-1 encontrado${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Projeto J-1 não encontrado${NC}"
        echo "      Link: supabase link --project-ref biwwowendjuzvpttyrlb"
        PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
    fi
else
    echo -e "   ${RED}❌ Supabase CLI não autenticado${NC}"
    echo ""
    echo "   Para autenticar:"
    echo "   supabase login"
    echo "   supabase link --project-ref biwwowendjuzvpttyrlb"
    echo ""
    
    PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
    CRITICAL_FAILURE=true
fi

echo ""

# 6. Arquivos de Configuração
echo "6. Verificando arquivos de configuração..."

if [ -f ".env.local" ]; then
    echo -e "   ${GREEN}✅ .env.local existe${NC}"
    
    if grep -q "127.0.0.1:54321" .env.local; then
        echo -e "      ${GREEN}✅ Configurado para LOCAL${NC}"
    elif grep -q "supabase.co" .env.local; then
        echo -e "      ${RED}❌ PERIGO: Configurado para PRODUCTION!${NC}"
        echo "      Mude VITE_SUPABASE_URL para: http://127.0.0.1:54321"
        PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
        CRITICAL_FAILURE=true
    else
        echo -e "      ${YELLOW}⚠️  Configuração não reconhecida${NC}"
    fi
else
    echo -e "   ${RED}❌ .env.local não encontrado${NC}"
    echo ""
    echo "   Para criar:"
    echo "   cat > .env.local << 'EOF'"
    echo "   VITE_SUPABASE_URL=http://127.0.0.1:54321"
    echo "   VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
    echo "   EOF"
    echo ""
    
    PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
    CRITICAL_FAILURE=true
fi

echo ""

# 7. Variáveis Conflitantes
echo "7. Verificando variáveis de sistema conflitantes..."

CONFLICTING_VARS=$(env | grep "^VITE_" || true)

if [ -z "$CONFLICTING_VARS" ]; then
    echo -e "   ${GREEN}✅ Nenhuma variável VITE_* no sistema${NC}"
else
    echo -e "   ${YELLOW}⚠️  Variáveis VITE_* encontradas no sistema:${NC}"
    echo ""
    echo "$CONFLICTING_VARS" | while IFS= read -r line; do
        echo "      $line"
    done
    echo ""
    echo "   Essas variáveis vão sobrescrever .env.local!"
    echo ""
    
    PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
fi

echo ""

# 8. Espaço em Disco
echo "8. Verificando espaço em disco..."

DISK_AVAIL=$(df -h / | tail -1 | awk '{print $4}')
echo "   ℹ️  Espaço disponível: $DISK_AVAIL"

DISK_NUM=$(echo $DISK_AVAIL | sed 's/[^0-9]//g')

if [ -n "$DISK_NUM" ] && [ "$DISK_NUM" -lt 5 ]; then
    echo -e "   ${YELLOW}⚠️  Espaço em disco baixo (< 5GB)${NC}"
    PROBLEMS_FOUND=$((PROBLEMS_FOUND + 1))
else
    echo -e "   ${GREEN}✅ Espaço em disco suficiente${NC}"
fi

echo ""

# Resumo Final
echo "=========================================="
echo -e "${BLUE}📊 Resumo da Validação${NC}"
echo "=========================================="
echo ""

if [ "$CRITICAL_FAILURE" = true ]; then
    echo -e "${RED}❌ Problemas críticos encontrados: $PROBLEMS_FOUND${NC}"
    echo ""
    echo "Não é possível prosseguir até resolver os itens acima."
    echo ""
    exit 1
elif [ $PROBLEMS_FOUND -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Avisos encontrados: $PROBLEMS_FOUND${NC}"
    echo ""
    echo "Ambiente pode funcionar, mas há itens que merecem atenção."
    echo ""
    exit 0
else
    echo -e "${GREEN}✅ Tudo certo! Ambiente está pronto para setup.${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Execute: ./localdev/2-backup-production.sh"
    echo "2. Execute: ./localdev/3-setup-local-env.sh"
    echo ""
    exit 0
fi
