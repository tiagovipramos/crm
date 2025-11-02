#!/bin/bash
# ==============================================
# SCRIPT: Executar Migrations do CRM Protecar
# ==============================================
# Executa migrations SQL no banco de dados
# Uso: ./scripts/migrate.sh [arquivo.sql]
#   Se nenhum arquivo for especificado, executa todas as migrations em ordem

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
echo "║    📊 CRM PROTECAR - MIGRATIONS         ║"
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

# Função para executar SQL
execute_sql() {
    local file=$1
    local filename=$(basename "$file")
    
    echo -e "${BLUE}📝 Executando: ${filename}${NC}"
    
    docker-compose exec -T mysql mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${filename} executado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao executar ${filename}${NC}"
        return 1
    fi
}

# Se foi especificado um arquivo
if [ -n "$1" ]; then
    if [ -f "backend/migrations/$1" ]; then
        execute_sql "backend/migrations/$1"
    else
        echo -e "${RED}❌ Arquivo não encontrado: backend/migrations/$1${NC}"
        exit 1
    fi
else
    # Executar todas as migrations em ordem numérica
    echo -e "${YELLOW}📋 Executando todas as migrations...${NC}"
    echo ""
    
    # Listar arquivos .sql ordenados
    migrations=$(find backend/migrations -name "*.sql" -type f | sort)
    
    if [ -z "$migrations" ]; then
        echo -e "${YELLOW}⚠️  Nenhuma migration encontrada${NC}"
        exit 0
    fi
    
    total=0
    success=0
    failed=0
    
    for migration in $migrations; do
        ((total++))
        if execute_sql "$migration"; then
            ((success++))
        else
            ((failed++))
            echo -e "${RED}❌ Parando execução devido a erro${NC}"
            break
        fi
        echo ""
    done
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}📊 Resumo:${NC}"
    echo -e "   Total:     ${total}"
    echo -e "   Sucesso:   ${GREEN}${success}${NC}"
    echo -e "   Falhas:    ${RED}${failed}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
fi

echo ""
echo -e "${GREEN}✅ Migrations concluídas!${NC}"
echo ""
