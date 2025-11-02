#!/bin/bash
# ==============================================
# SCRIPT: Reiniciar CRM Protecar
# ==============================================
# Reinicia todos os serviços
# Uso: ./scripts/restart.sh [dev|prod]

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
echo "║    🔄 CRM PROTECAR - REINICIANDO...     ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Detectar ambiente
ENVIRONMENT=${1:-development}

# Parar serviços
echo -e "${BLUE}🛑 Parando serviços...${NC}"
./scripts/stop.sh

# Aguardar cleanup
echo -e "${BLUE}⏳ Aguardando cleanup...${NC}"
sleep 3

# Iniciar serviços
echo -e "${BLUE}🚀 Iniciando serviços...${NC}"
./scripts/start.sh $ENVIRONMENT

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ CRM PROTECAR REINICIADO COM SUCESSO  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
