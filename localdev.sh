#!/usr/bin/env bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Development Environment - Interactive Setup${NC}"
echo "=============================================="
echo ""
echo "Selecione os scripts que deseja executar:"
echo ""
echo "1. [ ] Validar ambiente (validate-environment.sh)"
echo "2. [ ] Backup de produção (backup-production.sh)"
echo "3. [ ] Setup completo (setup-local-env.sh)"
echo "4. [ ] Reset rápido (quick-reset.sh)"
echo ""
echo "Digite os números separados por espaço (ex: 1 2 4)"
echo "Ou 'all' para executar todos em ordem"
echo ""
read -p "Sua escolha: " CHOICES

# Converter 'all' para '1 2 3 4'
if [[ $CHOICES == "all" ]]; then
    CHOICES="1 2 3 4"
fi

# Array de scripts
declare -A SCRIPTS
SCRIPTS[1]="localdev/1-validate-env.sh|Validação de Ambiente"
SCRIPTS[2]="localdev/2-backup-production.sh|Backup de Produção"
SCRIPTS[3]="localdev/3-setup-local-env.sh|Setup Completo"
SCRIPTS[4]="localdev/4-quick-reset.sh|Reset Rápido"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Scripts que serão executados:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Validar e mostrar preview
VALID_CHOICES=()
for choice in $CHOICES; do
    if [[ -n "${SCRIPTS[$choice]}" ]]; then
        script_file=$(echo "${SCRIPTS[$choice]}" | cut -d'|' -f1)
        script_name=$(echo "${SCRIPTS[$choice]}" | cut -d'|' -f2)
        echo "   $choice. $script_name (./$script_file)"
        VALID_CHOICES+=($choice)
    else
        echo -e "   ${YELLOW}⚠️  Opção inválida: $choice (ignorada)${NC}"
    fi
done

if [ ${#VALID_CHOICES[@]} -eq 0 ]; then
    echo ""
    echo -e "${RED}❌ Nenhuma opção válida selecionada${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Confirmar execução? (yes/no): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
    echo ""
    echo -e "${YELLOW}❌ Execução cancelada${NC}"
    exit 0
fi

# Executar scripts em sequência
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🚀 Iniciando execução...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FAILED=false

for choice in "${VALID_CHOICES[@]}"; do
    script_file=$(echo "${SCRIPTS[$choice]}" | cut -d'|' -f1)
    script_name=$(echo "${SCRIPTS[$choice]}" | cut -d'|' -f2)
    
    echo ""
    echo -e "${BLUE}▶️  Executando: $script_name${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Executar script (PATH CORRIGIDO)
    if ./$script_file; then
        echo ""
        echo -e "${GREEN}✅ $script_name - Concluído com sucesso${NC}"
        echo ""
    else
        EXIT_CODE=$?
        echo ""
        echo -e "${RED}❌ $script_name - Falhou (exit code: $EXIT_CODE)${NC}"
        echo ""
        
        read -p "Continuar com próximos scripts? (yes/no): " CONTINUE
        
        if [[ ! $CONTINUE =~ ^[Yy][Ee][Ss]$ ]]; then
            FAILED=true
            break
        fi
    fi
done

# Resumo final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAILED" = true ]; then
    echo -e "${YELLOW}⚠️  Execução interrompida${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Alguns scripts foram executados, mas o processo foi interrompido."
    exit 1
else
    echo -e "${GREEN}🎉 Todos os scripts foram executados!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Setup concluído com sucesso"
    echo ""
    echo "🌐 Ambiente pronto em: http://localhost:8080"
    echo "🎨 Supabase Studio: http://127.0.0.1:54323"
    echo ""
fi