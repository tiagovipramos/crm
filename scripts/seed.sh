#!/bin/bash
# ==============================================
# SCRIPT: Popular Banco com Dados Iniciais
# ==============================================
# Popula o banco com dados de exemplo/teste
# Uso: ./scripts/seed.sh

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
echo "║    🌱 CRM PROTECAR - SEED DATA          ║"
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

echo -e "${YELLOW}⚠️  Este script irá popular o banco com dados de exemplo${NC}"
echo -e "${YELLOW}Deseja continuar? (s/n)${NC}"
read -r response

if [ "$response" != "s" ] && [ "$response" != "S" ]; then
    echo -e "${BLUE}❌ Operação cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🌱 Populando banco de dados...${NC}"

# Criar SQL com dados de seed
cat > /tmp/seed.sql << 'EOF'
-- Inserir consultor admin (senha: admin123)
INSERT INTO consultores (id, nome, email, senha, telefone, status_conexao)
VALUES (
  'b9bc4ffc-ade8-11f0-9914-8cb0e93127ca',
  'Administrador',
  'admin@protecar.com',
  '$2a$10$cN6ppacqn0lyZk1ZyYxhBOxD6Ph9h0dytY6lOJ/qjLGzysr7zAW2.',
  '11987654321',
  'offline'
) ON DUPLICATE KEY UPDATE nome=nome;

-- Inserir consultor de teste (senha: 123456)
INSERT INTO consultores (nome, email, senha, telefone, status_conexao)
VALUES (
  'Carlos Silva',
  'carlos@protecar.com',
  '$2a$10$rOzJqKZXHjKGzK5fY.pGYO0/dZqN3E5mCpqj5ZCXy9J5QKLKBz1Wm',
  '11987654321',
  'offline'
) ON DUPLICATE KEY UPDATE nome=nome;

-- Inserir leads de exemplo
INSERT INTO leads (nome, telefone, email, cidade, origem, status, observacoes)
VALUES 
  ('João Silva', '11999887766', 'joao@email.com', 'São Paulo', 'website', 'novo', 'Lead de teste 1'),
  ('Maria Santos', '11988776655', 'maria@email.com', 'Rio de Janeiro', 'indicacao', 'contato', 'Lead de teste 2'),
  ('Pedro Oliveira', '11977665544', 'pedro@email.com', 'Belo Horizonte', 'telefone', 'qualificado', 'Lead de teste 3')
ON DUPLICATE KEY UPDATE nome=nome;

SELECT 'Dados de seed inseridos com sucesso!' AS status;
EOF

# Executar SQL
docker-compose exec -T mysql mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /tmp/seed.sql

# Limpar arquivo temporário
rm /tmp/seed.sql

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✅ DADOS POPULADOS COM SUCESSO        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}👤 Credenciais de teste:${NC}"
echo -e "   Admin:  admin@protecar.com / admin123"
echo -e "   Teste:  carlos@protecar.com / 123456"
echo ""
