#!/bin/bash
# ==============================================
# SCRIPT: Backup do Banco de Dados
# ==============================================
# Cria backup do MySQL
# Uso: ./scripts/backup-db.sh [nome-do-backup]

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
echo "║    💾 CRM PROTECAR - BACKUP DB          ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se MySQL está rodando
if ! docker-compose ps mysql | grep -q "Up"; then
    echo -e "${RED}❌ MySQL não está rodando!${NC}"
    echo "Inicie com: ./scripts/start.sh"
    exit 1
fi

# Carregar configurações do .env
if [ -f "backend/.env" ]; then
    source backend/.env
elif [ -f "backend/.env.development" ]; then
    source backend/.env.development
else
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    exit 1
fi

DB_NAME=${DB_NAME:-protecar_crm}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-protecar_dev_2025}

# Criar diretório de backups se não existir
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
fi

BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql"
BACKUP_COMPRESSED="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"

echo -e "${BLUE}📦 Criando backup...${NC}"
echo -e "   Database: ${DB_NAME}"
echo -e "   Arquivo:  ${BACKUP_FILE}"
echo ""

# Criar backup
docker-compose exec -T mysql mysqldump \
    -u"$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Comprimir backup
    echo -e "${BLUE}🗜️  Comprimindo backup...${NC}"
    gzip -f "$BACKUP_FILE"
    
    # Calcular tamanho
    SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
    
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    ✅ BACKUP CRIADO COM SUCESSO          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📊 Informações:${NC}"
    echo -e "   Arquivo:  ${GREEN}${BACKUP_COMPRESSED}${NC}"
    echo -e "   Tamanho:  ${GREEN}${SIZE}${NC}"
    echo -e "   Data:     ${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    echo -e "${BLUE}💡 Para restaurar:${NC}"
    echo -e "   ${YELLOW}./scripts/restore-db.sh ${BACKUP_NAME}.sql.gz${NC}"
    echo ""
else
    echo -e "${RED}❌ Erro ao criar backup${NC}"
    exit 1
fi

# Listar backups existentes
echo -e "${BLUE}📋 Backups disponíveis:${NC}"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "   Nenhum backup encontrado"
echo ""
