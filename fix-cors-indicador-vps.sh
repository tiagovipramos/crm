#!/bin/bash

echo "=========================================="
echo "🔧 CORREÇÃO AUTOMÁTICA - CORS INDICADOR"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Verificar se .env existe
if [ ! -f .env ]; then
    print_error "Arquivo .env não encontrado!"
    exit 1
fi

print_status "Arquivo .env encontrado"

# 2. Adicionar NEXT_PUBLIC_WS_URL ao .env se não existir
if ! grep -q "NEXT_PUBLIC_WS_URL" .env; then
    print_warning "NEXT_PUBLIC_WS_URL não encontrado no .env"
    echo "" >> .env
    echo "# Socket.IO WebSocket URL" >> .env
    echo "NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001" >> .env
    print_status "NEXT_PUBLIC_WS_URL adicionado ao .env"
else
    # Atualizar valor se já existir
    sed -i 's|NEXT_PUBLIC_WS_URL=.*|NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001|' .env
    print_status "NEXT_PUBLIC_WS_URL atualizado no .env"
fi

# 3. Verificar se backend/.env existe e criar se necessário
if [ ! -f backend/.env ]; then
    print_warning "backend/.env não encontrado, copiando do .env principal"
    cp .env backend/.env
    print_status "backend/.env criado"
fi

# 4. Parar containers
print_status "Parando containers Docker..."
docker-compose down

# 5. Rebuild do frontend (necessário por causa das variáveis NEXT_PUBLIC_*)
print_status "Rebuild do container frontend (variáveis NEXT_PUBLIC_* foram alteradas)..."
docker-compose build --no-cache frontend

# 6. Rebuild do backend para garantir
print_status "Rebuild do container backend..."
docker-compose build --no-cache backend

# 7. Iniciar containers
print_status "Iniciando containers Docker..."
docker-compose up -d

# 8. Aguardar containers iniciarem
echo ""
print_status "Aguardando containers iniciarem..."
sleep 10

# 9. Verificar status
echo ""
echo "=========================================="
echo "📊 STATUS DOS CONTAINERS"
echo "=========================================="
docker-compose ps

# 10. Verificar logs do frontend
echo ""
echo "=========================================="
echo "📋 LOGS DO FRONTEND (últimas 20 linhas)"
echo "=========================================="
docker-compose logs --tail=20 frontend

# 11. Verificar logs do backend
echo ""
echo "=========================================="
echo "📋 LOGS DO BACKEND (últimas 20 linhas)"
echo "=========================================="
docker-compose logs --tail=20 backend

echo ""
echo "=========================================="
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "🌐 Frontend: http://185.217.125.72:3000"
echo "🔌 Backend API: http://185.217.125.72:3001/api"
echo "🔌 Socket.IO: http://185.217.125.72:3001"
echo ""
echo "📝 Para ver logs em tempo real:"
echo "   docker-compose logs -f frontend"
echo "   docker-compose logs -f backend"
echo ""
echo "🔄 Para verificar se está funcionando:"
echo "   1. Acesse http://185.217.125.72:3000/indicador"
echo "   2. Faça login"
echo "   3. Abra o Console do navegador (F12)"
echo "   4. Deve aparecer '✅ Socket.IO Indicador CONECTADO!'"
echo ""
