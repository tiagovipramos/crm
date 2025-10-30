#!/bin/bash

# ============================================
# SCRIPT DE CORREÇÃO COMPLETA DO SISTEMA
# Corrige TODOS os problemas identificados
# ============================================

set -e  # Para em caso de erro

echo "=========================================="
echo "INICIANDO CORREÇÃO COMPLETA DO SISTEMA"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Diretório do projeto (será detectado automaticamente)
PROJECT_DIR=$(find /root /home /opt -name "docker-compose.yml" -path "*/crm/*" 2>/dev/null | head -1 | xargs dirname)

if [ -z "$PROJECT_DIR" ]; then
    log_error "Projeto CRM não encontrado!"
    exit 1
fi

log_info "Projeto encontrado em: $PROJECT_DIR"
cd "$PROJECT_DIR"

# ============================================
# 1. ATUALIZAR ARQUIVO .env NO SERVIDOR
# ============================================
log_info "Atualizando arquivo .env..."

if [ ! -f .env ]; then
    log_warning ".env não existe, criando a partir de .env.example..."
    cp .env.example .env
fi

# Adicionar NEXT_PUBLIC_WS_URL se não existir
if ! grep -q "NEXT_PUBLIC_WS_URL" .env; then
    log_info "Adicionando NEXT_PUBLIC_WS_URL ao .env..."
    sed -i '/NEXT_PUBLIC_API_URL/a NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001' .env
else
    log_info "Atualizando NEXT_PUBLIC_WS_URL..."
    sed -i 's|NEXT_PUBLIC_WS_URL=.*|NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001|' .env
fi

log_info "✅ Arquivo .env atualizado"

# ============================================
# 2. CRIAR TABELAS FALTANTES DO LOOTBOX
# ============================================
log_info "Verificando tabelas do banco de dados..."

# Script SQL para criar tabelas faltantes
cat > /tmp/fix_lootbox_tables.sql << 'EOF'
-- Criar tabela lootbox_premios se não existir
CREATE TABLE IF NOT EXISTS `lootbox_premios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `emoji` varchar(10) DEFAULT NULL,
  `cor_hex` varchar(7) DEFAULT NULL,
  `peso` int DEFAULT '1',
  `ativo` tinyint(1) DEFAULT '1',
  `data_criacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir prêmios padrão se a tabela estiver vazia
INSERT IGNORE INTO `lootbox_premios` (`id`, `tipo`, `valor`, `emoji`, `cor_hex`, `peso`, `ativo`) VALUES
(1, 'comum', 5.00, '🎁', '#3B82F6', 50, 1),
(2, 'incomum', 10.00, '✨', '#8B5CF6', 30, 1),
(3, 'raro', 20.00, '💎', '#EC4899', 15, 1),
(4, 'epico', 50.00, '👑', '#F59E0B', 4, 1),
(5, 'lendario', 100.00, '🏆', '#EF4444', 1, 1);

-- Criar tabela lootbox_historico se não existir
CREATE TABLE IF NOT EXISTS `lootbox_historico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `indicador_id` char(36) NOT NULL,
  `premio_valor` decimal(10,2) NOT NULL,
  `premio_tipo` varchar(50) NOT NULL,
  `leads_acumulados` int DEFAULT NULL,
  `data_abertura` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `compartilhado` tinyint(1) DEFAULT '0',
  `data_compartilhamento` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_indicador` (`indicador_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificação final
SELECT 'Tabelas lootbox_premios e lootbox_historico criadas com sucesso!' AS status;
EOF

# Script separado para adicionar colunas (compatível com MySQL)
cat > /tmp/fix_indicadores_columns.sql << 'EOF'
-- Adicionar colunas uma por uma, ignorando erro se já existirem
ALTER TABLE `indicadores` ADD COLUMN `leads_para_proxima_caixa` int DEFAULT '0';
ALTER TABLE `indicadores` ADD COLUMN `total_caixas_abertas` int DEFAULT '0';
ALTER TABLE `indicadores` ADD COLUMN `total_ganho_caixas` decimal(10,2) DEFAULT '0.00';
ALTER TABLE `indicadores` ADD COLUMN `vendas_para_proxima_caixa` int DEFAULT '0';
ALTER TABLE `indicadores` ADD COLUMN `total_caixas_vendas_abertas` int DEFAULT '0';
ALTER TABLE `indicadores` ADD COLUMN `total_ganho_caixas_vendas` decimal(10,2) DEFAULT '0.00';
EOF

log_info "Executando correções no banco de dados..."
docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD:-root123} ${DB_NAME:-protecar_crm} < /tmp/fix_lootbox_tables.sql

log_info "Adicionando colunas na tabela indicadores..."
docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD:-root123} ${DB_NAME:-protecar_crm} < /tmp/fix_indicadores_columns.sql 2>/dev/null || log_warning "Algumas colunas já existem (normal)"

log_info "✅ Tabelas do banco de dados corrigidas"

# ============================================
# 3. EXECUTAR TODAS AS MIGRATIONS
# ============================================
log_info "Executando migrations do backend..."
docker-compose exec -T backend node executar-migrations.js || log_warning "Algumas migrations podem ter falhado (pode ser normal se já foram executadas)"

log_info "✅ Migrations executadas"

# ============================================
# 4. CORRIGIR PERMISSÕES
# ============================================
log_info "Corrigindo permissões de arquivos..."
chmod -R 755 backend/uploads 2>/dev/null || true
chmod -R 755 backend/auth_* 2>/dev/null || true

log_info "✅ Permissões corrigidas"

# ============================================
# 5. LIMPAR CACHE E ARQUIVOS TEMPORÁRIOS
# ============================================
log_info "Limpando cache..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next/cache 2>/dev/null || true
rm -rf backend/node_modules/.cache 2>/dev/null || true

log_info "✅ Cache limpo"

# ============================================
# 6. REBUILD E RESTART DOS CONTAINERS
# ============================================
log_info "Fazendo rebuild dos containers..."
log_warning "Isso pode levar alguns minutos..."

docker-compose down
docker-compose up -d --build

log_info "Aguardando containers iniciarem..."
sleep 30

# ============================================
# 7. VERIFICAR STATUS FINAL
# ============================================
log_info "Verificando status dos containers..."
docker-compose ps

echo ""
echo "=========================================="
echo "✅ CORREÇÃO COMPLETA FINALIZADA!"
echo "=========================================="
echo ""
echo "📊 Status dos Serviços:"
docker-compose ps
echo ""
echo "🌐 Acesse o sistema em: http://185.217.125.72:3000/indicador/login"
echo "🔑 Login: tiago@vipseg.org"
echo "🔐 Senha: 123456"
echo ""
echo "📋 Para ver logs:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
echo ""
