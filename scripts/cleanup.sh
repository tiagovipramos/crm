#!/bin/bash
# ==============================================
# SCRIPT: Limpar Recursos Docker
# ==============================================
# Remove volumes, imagens e containers não utilizados
# Uso: ./scripts/cleanup.sh [--all]

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
echo "║    🧹 CRM PROTECAR - CLEANUP            ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

CLEAN_ALL=false
if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
    CLEAN_ALL=true
    echo -e "${YELLOW}⚠️  Modo: LIMPEZA COMPLETA (incluindo volumes)${NC}"
else
    echo -e "${BLUE}Modo: LIMPEZA PARCIAL (preserva volumes)${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️  Esta operação irá remover:${NC}"
if [ "$CLEAN_ALL" = true ]; then
    echo -e "   - Containers parados"
    echo -e "   - Imagens não utilizadas"
    echo -e "   - Volumes órfãos"
    echo -e "   - Networks não utilizadas"
    echo -e "   - Cache de build"
    echo -e "   ${RED}⚠️  DADOS DO BANCO SERÃO PERDIDOS!${NC}"
else
    echo -e "   - Containers parados"
    echo -e "   - Imagens não utilizadas"
    echo -e "   - Networks não utilizadas"
    echo -e "   - Cache de build"
    echo -e "   ${GREEN}✅ Volumes preservados (dados seguros)${NC}"
fi

echo ""
echo -e "${YELLOW}Deseja continuar? (s/n)${NC}"
read -r response

if [ "$response" != "s" ] && [ "$response" != "S" ]; then
    echo -e "${BLUE}❌ Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🧹 Iniciando limpeza...${NC}"
echo ""

# Parar containers
echo -e "${BLUE}🛑 Parando containers...${NC}"
docker-compose down

# Remover containers parados
echo -e "${BLUE}🗑️  Removendo containers parados...${NC}"
docker container prune -f

# Remover imagens não utilizadas
echo -e "${BLUE}🗑️  Removendo imagens não utilizadas...${NC}"
docker image prune -f

# Remover networks não utilizadas
echo -e "${BLUE}🗑️  Removendo networks não utilizadas...${NC}"
docker network prune -f

# Remover cache de build
echo -e "${BLUE}🗑️  Removendo cache de build...${NC}"
docker builder prune -f

# Se --all, remover volumes
if [ "$CLEAN_ALL" = true ]; then
    echo -e "${YELLOW}🗑️  Removendo volumes...${NC}"
    docker volume prune -f
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✅ LIMPEZA CONCLUÍDA COM SUCESSO      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# Mostrar espaço liberado
echo -e "${BLUE}📊 Estatísticas Docker:${NC}"
docker system df

echo ""
echo -e "${BLUE}💡 Para iniciar novamente:${NC}"
echo -e "   ${YELLOW}./scripts/start.sh${NC}"
echo ""
