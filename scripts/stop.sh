#!/bin/bash
# ==============================================
# SCRIPT: Parar CRM Protecar
# ==============================================
# Para todos os serviços do Docker Compose
# Uso: ./scripts/stop.sh [--remove-volumes]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║    🛑 CRM PROTECAR - PARANDO...         ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se deve remover volumes
REMOVE_VOLUMES=false
if [ "$1" = "--remove-volumes" ] || [ "$1" = "-v" ]; then
    REMOVE_VOLUMES=true
    echo -e "${YELLOW}⚠️  ATENÇÃO: Volumes serão removidos (dados do banco serão perdidos!)${NC}"
    echo -e "${YELLOW}Aguarde 5 segundos para cancelar (Ctrl+C)...${NC}"
    sleep 5
fi

# Parar containers
echo -e "${BLUE}🛑 Parando containers...${NC}"
docker-compose stop

# Remover containers
echo -e "${BLUE}🗑️  Removendo containers...${NC}"
if [ "$REMOVE_VOLUMES" = true ]; then
    docker-compose down -v
    echo -e "${YELLOW}⚠️  Volumes removidos (dados perdidos)${NC}"
else
    docker-compose down
    echo -e "${GREEN}✅ Volumes preservados${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✅ CRM PROTECAR PARADO COM SUCESSO    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📝 Para reiniciar:${NC}"
echo -e "   ${YELLOW}./scripts/start.sh${NC}"
echo ""
