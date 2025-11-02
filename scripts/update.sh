#!/bin/bash
# ==============================================
# SCRIPT: Atualizar Sistema CRM Protecar
# ==============================================
# Atualiza código e reconstrói containers
# Uso: ./scripts/update.sh [--no-backup]

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
echo "║    🔄 CRM PROTECAR - UPDATE             ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar argumento --no-backup
DO_BACKUP=true
if [ "$1" = "--no-backup" ]; then
    DO_BACKUP=false
    echo -e "${YELLOW}⚠️  Backup desabilitado${NC}"
fi

# Fazer backup antes de atualizar (se habilitado)
if [ "$DO_BACKUP" = true ]; then
    echo -e "${BLUE}💾 Criando backup de segurança...${NC}"
    ./scripts/backup-db.sh "pre_update_$(date +%Y%m%d_%H%M%S)" || {
        echo -e "${RED}❌ Erro ao criar backup!${NC}"
        echo -e "${YELLOW}Continue mesmo assim? (s/n)${NC}"
        read -r response
        if [ "$response" != "s" ] && [ "$response" != "S" ]; then
            exit 1
        fi
    }
    echo ""
fi

# Atualizar código do Git (se for repositório Git)
if [ -d ".git" ]; then
    echo -e "${BLUE}📥 Atualizando código do Git...${NC}"
    git pull || {
        echo -e "${YELLOW}⚠️  Erro ao fazer git pull${NC}"
        echo -e "${YELLOW}Continue mesmo assim? (s/n)${NC}"
        read -r response
        if [ "$response" != "s" ] && [ "$response" != "S" ]; then
            exit 1
        fi
    }
    echo ""
else
    echo -e "${YELLOW}⚠️  Não é um repositório Git, pulando atualização de código${NC}"
    echo ""
fi

# Parar serviços
echo -e "${BLUE}🛑 Parando serviços...${NC}"
docker-compose down
echo ""

# Limpar cache de build (opcional)
echo -e "${YELLOW}Limpar cache de build Docker? (recomendado) (s/n)${NC}"
read -r response
if [ "$response" = "s" ] || [ "$response" = "S" ]; then
    echo -e "${BLUE}🧹 Limpando cache...${NC}"
    docker builder prune -f
    echo ""
fi

# Reconstruir imagens
echo -e "${BLUE}🏗️  Reconstruindo imagens...${NC}"
docker-compose build --no-cache
echo ""

# Iniciar serviços
echo -e "${BLUE}🚀 Iniciando serviços atualizados...${NC}"
docker-compose up -d
echo ""

# Aguardar serviços ficarem prontos
echo -e "${BLUE}⏳ Aguardando serviços iniciarem...${NC}"
sleep 10

# Verificar saúde
echo -e "${BLUE}🏥 Verificando saúde dos serviços...${NC}"
./scripts/health-check.sh

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✅ SISTEMA ATUALIZADO COM SUCESSO     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📝 Comandos úteis:${NC}"
echo -e "   Ver logs:        ${YELLOW}./scripts/logs.sh${NC}"
echo -e "   Health check:    ${YELLOW}./scripts/health-check.sh${NC}"
echo ""
