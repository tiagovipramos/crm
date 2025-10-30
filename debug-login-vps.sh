#!/bin/bash

# Script para debugar problema de login no CRM via Docker
# Autor: Sistema CRM
# Data: 2025-01-29

echo "🔍 === DEBUG DE LOGIN NO CRM (VPS) ==="
echo ""
echo "Este script irá:"
echo "1. Verificar status dos containers"
echo "2. Executar diagnóstico completo do banco de dados"
echo "3. Testar autenticação"
echo "4. Corrigir problemas encontrados"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Verificar se os containers estão rodando
echo "📦 Verificando containers..."
docker ps --filter "name=crm-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Verificar se o container do backend está rodando
if ! docker ps | grep -q "crm-backend"; then
    echo "❌ Container crm-backend não está rodando!"
    echo "🔧 Iniciando containers..."
    docker-compose up -d
    echo "⏳ Aguardando 10 segundos para os serviços iniciarem..."
    sleep 10
fi

echo ""
echo "🔍 Copiando script de debug para o container..."
docker cp backend/debug-login-simple-vps.js crm-backend:/app/debug-login-simple-vps.js

echo ""
echo "🔍 Executando diagnóstico de login no backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Executar o script de debug dentro do container
docker exec crm-backend node debug-login-simple-vps.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Diagnóstico concluído!"
echo ""
echo "📋 Para visualizar os logs completos:"
echo "   Backend:  docker logs crm-backend"
echo "   Frontend: docker logs crm-frontend"
echo "   MySQL:    docker logs crm-mysql"
echo ""
echo "🌐 Para acessar o sistema:"
echo "   Admin: http://SEU_IP:3000/admin/login"
echo "   CRM:   http://SEU_IP:3000/crm/login"
echo ""
echo "📧 Credenciais padrão do Admin:"
echo "   Email: diretor@protecar.com"
echo "   Senha: 123456"
echo ""
