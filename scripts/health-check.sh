#!/bin/bash
# ==============================================
# SCRIPT: Verificar Saúde dos Serviços
# ==============================================
# Verifica se todos os serviços estão funcionando
# Uso: ./scripts/health-check.sh

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║    🏥 CRM PROTECAR - HEALTH CHECK       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Contadores
TOTAL=0
HEALTHY=0
UNHEALTHY=0

# Função para verificar serviço
check_service() {
    local name=$1
    local url=$2
    
    ((TOTAL++))
    echo -n "   ${name}... "
    
    if curl -f -s -o /dev/null --max-time 5 "$url"; then
        echo -e "${GREEN}✅ OK${NC}"
        ((HEALTHY++))
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        ((UNHEALTHY++))
        return 1
    fi
}

# Verificar se Docker está rodando
echo -e "${BLUE}🐳 Verificando Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker está rodando${NC}"
echo ""

# Verificar containers
echo -e "${BLUE}📦 Verificando containers:${NC}"
docker-compose ps
echo ""

# Verificar MySQL
echo -e "${BLUE}🗄️  Verificando MySQL...${NC}"
if docker-compose exec -T mysql mysqladmin ping -h localhost --silent > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MySQL está respondendo${NC}"
    ((TOTAL++))
    ((HEALTHY++))
else
    echo -e "${RED}❌ MySQL não está respondendo${NC}"
    ((TOTAL++))
    ((UNHEALTHY++))
fi
echo ""

# Verificar endpoints HTTP
echo -e "${BLUE}🌐 Verificando endpoints HTTP:${NC}"
check_service "Backend API     " "http://localhost:3001/api/health"
check_service "Frontend        " "http://localhost:3000"
echo ""

# Verificar logs recentes para erros
echo -e "${BLUE}📋 Verificando logs recentes (últimos 20 erros):${NC}"
ERROR_COUNT=$(docker-compose logs --tail=100 2>&1 | grep -i "error\|fatal\|exception" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Encontrados ${ERROR_COUNT} erros nos logs${NC}"
    echo -e "${YELLOW}   Use './scripts/logs.sh' para ver detalhes${NC}"
else
    echo -e "${GREEN}✅ Nenhum erro recente encontrado${NC}"
fi
echo ""

# Verificar uso de recursos
echo -e "${BLUE}📊 Uso de recursos Docker:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose ps -q)
echo ""

# Verificar volumes
echo -e "${BLUE}💾 Volumes:${NC}"
docker volume ls | grep protecar
echo ""

# Resumo final
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Resumo do Health Check:${NC}"
echo -e "   Total de verificações:    ${TOTAL}"
echo -e "   Saudáveis:                ${GREEN}${HEALTHY}${NC}"
echo -e "   Com problemas:            ${RED}${UNHEALTHY}${NC}"

if [ "$UNHEALTHY" -eq 0 ]; then
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    ✅ TODOS OS SERVIÇOS ESTÃO OK         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║    ⚠️  ALGUNS SERVIÇOS COM PROBLEMAS     ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}💡 Sugestões:${NC}"
    echo -e "   Ver logs:      ${YELLOW}./scripts/logs.sh${NC}"
    echo -e "   Reiniciar:     ${YELLOW}./scripts/restart.sh${NC}"
    exit 1
fi
