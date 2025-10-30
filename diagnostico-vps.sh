#!/bin/bash

# Script de diagnóstico completo do sistema CRM
# Autor: Sistema CRM
# Data: 2025-01-30

echo "🔍 === DIAGNÓSTICO COMPLETO DO SISTEMA CRM ==="
echo ""
echo "⏳ Coletando informações..."
echo ""

# 1. Status dos containers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 STATUS DOS CONTAINERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps -a --filter "name=crm-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Teste de conectividade com MySQL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  TESTE DE CONECTIVIDADE - MYSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if docker exec crm-mysql mysqladmin ping -h localhost -u protecar -pprotecar123 &>/dev/null; then
    echo "✅ MySQL está respondendo"
    
    # Verificar tabelas
    echo ""
    echo "📊 Tabelas existentes:"
    docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SHOW TABLES;" 2>/dev/null | tail -n +2
    
    echo ""
    echo "👥 Total de usuários admin:"
    docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT COUNT(*) as total FROM consultores WHERE role='admin';" 2>/dev/null | tail -n 1
    
    echo ""
    echo "🎯 Total de indicadores:"
    docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT COUNT(*) as total FROM indicadores;" 2>/dev/null | tail -n 1
    
    echo ""
    echo "📋 Total de leads:"
    docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT COUNT(*) as total FROM leads;" 2>/dev/null | tail -n 1
else
    echo "❌ MySQL não está respondendo"
fi
echo ""

# 3. Verificar se o backend está respondendo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 TESTE DE CONECTIVIDADE - BACKEND API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:3001/api/health &>/dev/null; then
    echo "✅ Backend API está respondendo"
    curl -s http://localhost:3001/api/health | head -5
else
    echo "❌ Backend API não está respondendo"
    echo ""
    echo "📋 Últimas 10 linhas do log do backend:"
    docker logs crm-backend --tail 10
fi
echo ""

# 4. Verificar se o frontend está respondendo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 TESTE DE CONECTIVIDADE - FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s http://localhost:3000 | head -1 &>/dev/null; then
    echo "✅ Frontend está respondendo"
else
    echo "❌ Frontend não está respondendo"
    echo ""
    echo "📋 Últimas 10 linhas do log do frontend:"
    docker logs crm-frontend --tail 10
fi
echo ""

# 5. Verificar uso de recursos
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💻 USO DE RECURSOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" crm-mysql crm-backend crm-frontend 2>/dev/null
echo ""

# 6. Verificar problemas comuns nos logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  PROBLEMAS DETECTADOS NOS LOGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Backend
echo "🔴 BACKEND:"
if docker logs crm-backend 2>&1 | grep -i "error" | tail -3 | grep -q "error"; then
    docker logs crm-backend 2>&1 | grep -i "error" | tail -3
else
    echo "   ✅ Nenhum erro detectado"
fi
echo ""

# Frontend
echo "🔴 FRONTEND:"
if docker logs crm-frontend 2>&1 | grep -i "error" | tail -3 | grep -q "error"; then
    docker logs crm-frontend 2>&1 | grep -i "error" | tail -3
else
    echo "   ✅ Nenhum erro detectado"
fi
echo ""

# MySQL
echo "🔴 MYSQL:"
if docker logs crm-mysql 2>&1 | grep -i "error" | tail -3 | grep -q "error"; then
    docker logs crm-mysql 2>&1 | grep -i "error" | tail -3
else
    echo "   ✅ Nenhum erro detectado"
fi
echo ""

# 7. Resumo e recomendações
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 RESUMO E RECOMENDAÇÕES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "URLs de acesso:"
echo "   🔐 Admin:     http://185.217.125.72:3000/admin/login"
echo "   🎯 Indicador: http://185.217.125.72:3000/indicador/login"
echo "   👤 CRM:       http://185.217.125.72:3000/crm"
echo ""
echo "Scripts úteis:"
echo "   ./ver-logs-vps.sh              # Ver logs detalhados"
echo "   ./fix-tudo-definitivo-vps.sh   # Corrigir problemas do banco"
echo "   docker restart crm-backend     # Reiniciar backend"
echo "   docker restart crm-frontend    # Reiniciar frontend"
echo ""
echo "Para logs em tempo real:"
echo "   docker logs crm-backend -f"
echo "   docker logs crm-frontend -f"
echo ""
