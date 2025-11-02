#!/bin/bash
# ==============================================
# SCRIPT: Restaurar Backup do Banco de Dados
# ==============================================
# Restaura backup do MySQL
# Uso: ./scripts/restore-db.sh <arquivo-backup.sql.gz>

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
echo "║    ♻️  CRM PROTECAR - RESTORE DB        ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se foi fornecido arquivo
if [ -z "$1" ]; then
    echo -e "${RED}❌ Erro: Nome do arquivo de backup não fornecido${NC}"
    echo ""
    echo -e "${BLUE}Uso:${NC}"
    echo -e "   ${YELLOW}./scripts/restore-db.sh <arquivo-backup.sql.gz>${NC}"
    echo ""
    echo -e "${BLUE}📋 Backups disponíveis:${NC}"
    ls -1 backups/*.sql.gz 2>/dev/null || echo "   Nenhum backup encontrado"
    exit 1
fi

# Verificar se MySQL está rodando
if ! docker-compose ps mysql | grep -q "Up"; then
    echo -e "${RED}❌ MySQL não está rodando!${NC}"
    echo "Inicie com: ./scripts/start.sh"
    exit 1
fi

# Determinar caminho do arquivo
if [ -f "$1" ]; then
    BACKUP_FILE="$1"
elif [ -f "backups/$1" ]; then
    BACKUP_FILE="backups/$1"
else
    echo -e "${RED}❌ Arquivo não encontrado: $1${NC}"
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

echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá SUBSTITUIR todos os dados atuais!${NC}"
echo -e "${YELLOW}Arquivo: ${BACKUP_FILE}${NC}"
echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo ""
echo -e "${YELLOW}Deseja continuar? (s/n)${NC}"
read -r response

if [ "$response" != "s" ] && [ "$response" != "S" ]; then
    echo -e "${BLUE}❌ Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔄 Restaurando backup...${NC}"

# Descompactar se necessário
TEMP_FILE="/tmp/restore_temp.sql"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${BLUE}📦 Descompactando arquivo...${NC}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
    cp "$BACKUP_FILE" "$TEMP_FILE"
fi

# Restaurar banco
echo -e "${BLUE}♻️  Restaurando dados...${NC}"
docker-compose exec -T mysql mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    ✅ BACKUP RESTAURADO COM SUCESSO      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
    echo ""
else
    echo -e "${RED}❌ Erro ao restaurar backup${NC}"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Limpar arquivo temporário
rm -f "$TEMP_FILE"

echo -e "${BLUE}💡 Dica:${NC}"
echo -e "   Reinicie os serviços para garantir que tudo está funcionando:"
echo -e "   ${YELLOW}./scripts/restart.sh${NC}"
echo ""
