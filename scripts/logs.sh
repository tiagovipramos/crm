#!/bin/bash
# ==============================================
# SCRIPT: Ver Logs do CRM Protecar
# ==============================================
# Exibe logs dos serviços Docker
# Uso: ./scripts/logs.sh [serviço] [opções]
#   Serviços: mysql, backend, frontend, all (padrão)
#   Opções: -f (follow), -n 100 (últimas 100 linhas)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║    📋 CRM PROTECAR - LOGS               ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Detectar serviço
SERVICE=${1:-all}
FOLLOW=""
LINES=""

# Processar argumentos
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW="-f"
            shift
            ;;
        -n|--lines)
            LINES="--tail $2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Exibir logs conforme serviço
case $SERVICE in
    mysql)
        echo -e "${GREEN}📊 Logs do MySQL:${NC}"
        docker-compose logs $FOLLOW $LINES mysql
        ;;
    backend)
        echo -e "${GREEN}📊 Logs do Backend:${NC}"
        docker-compose logs $FOLLOW $LINES backend
        ;;
    frontend)
        echo -e "${GREEN}📊 Logs do Frontend:${NC}"
        docker-compose logs $FOLLOW $LINES frontend
        ;;
    all|*)
        echo -e "${GREEN}📊 Logs de todos os serviços:${NC}"
        docker-compose logs $FOLLOW $LINES
        ;;
esac

echo ""
echo -e "${BLUE}💡 Dicas:${NC}"
echo -e "   Ver apenas backend:     ${YELLOW}./scripts/logs.sh backend${NC}"
echo -e "   Follow mode:            ${YELLOW}./scripts/logs.sh all -f${NC}"
echo -e "   Últimas 50 linhas:      ${YELLOW}./scripts/logs.sh all -n 50${NC}"
echo ""
