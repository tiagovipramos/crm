#!/bin/bash
# ==============================================
# SCRIPT: Iniciar CRM Protecar
# ==============================================
# Inicia todos os serviços usando Docker Compose
# Uso: ./scripts/start.sh [dev|prod]

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
echo "║    🚀 CRM PROTECAR - INICIANDO...       ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Detectar ambiente
ENVIRONMENT=${1:-development}

if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "production" ]; then
    ENVIRONMENT="production"
    ENV_FILE=".env.production"
    echo -e "${YELLOW}⚙️  Modo: PRODUÇÃO${NC}"
else
    ENVIRONMENT="development"
    ENV_FILE=".env.development"
    echo -e "${YELLOW}⚙️  Modo: DESENVOLVIMENTO${NC}"
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não está instalado!${NC}"
    echo "Instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não está instalado!${NC}"
    echo "Instale o Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f "backend/$ENV_FILE" ]; then
    echo -e "${RED}❌ Arquivo backend/$ENV_FILE não encontrado!${NC}"
    echo "Copie backend/.env.example para backend/$ENV_FILE e configure"
    exit 1
fi

# Criar link simbólico .env se não existir
if [ ! -f "backend/.env" ]; then
    echo -e "${BLUE}🔗 Criando link simbólico backend/.env -> $ENV_FILE${NC}"
    ln -s "$ENV_FILE" "backend/.env"
fi

# Parar containers existentes (se houver)
echo -e "${BLUE}🛑 Parando containers existentes...${NC}"
docker-compose down 2>/dev/null || true

# Construir imagens
echo -e "${BLUE}🏗️  Construindo imagens Docker...${NC}"
NODE_ENV=$ENVIRONMENT docker-compose build

# Iniciar serviços
echo -e "${BLUE}🚀 Iniciando serviços...${NC}"
NODE_ENV=$ENVIRONMENT docker-compose up -d

# Aguardar serviços ficarem saudáveis
echo -e "${BLUE}⏳ Aguardando serviços iniciarem...${NC}"
sleep 5

# Verificar status
echo ""
echo -e "${GREEN}✅ Verificando status dos serviços:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✅ CRM PROTECAR INICIADO COM SUCESSO  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Serviços disponíveis:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:   ${GREEN}http://localhost:3001${NC}"
echo -e "   MySQL:     ${GREEN}localhost:3306${NC}"
echo ""
echo -e "${BLUE}📝 Comandos úteis:${NC}"
echo -e "   Ver logs:        ${YELLOW}./scripts/logs.sh${NC}"
echo -e "   Parar:           ${YELLOW}./scripts/stop.sh${NC}"
echo -e "   Restart:         ${YELLOW}./scripts/restart.sh${NC}"
echo -e "   Health check:    ${YELLOW}./scripts/health-check.sh${NC}"
echo ""
