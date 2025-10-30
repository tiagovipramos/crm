#!/bin/bash

# Script para criar tabela de indicadores no CRM
# Autor: Sistema CRM
# Data: 2025-01-29

echo "🔧 === CRIAÇÃO DE TABELA INDICADORES ==="
echo ""
echo "Este script irá:"
echo "1. Criar tabela 'indicadores'"
echo "2. Criar tabela 'saques_indicador'"
echo "3. Verificar estruturas criadas"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

echo "📊 Criando tabelas no banco de dados..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < create-indicadores-table.sql

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tabelas criadas com sucesso!"
echo ""
echo "🔄 Reiniciando backend..."
docker restart crm-backend
echo ""
echo "⏳ Aguardando 5 segundos..."
sleep 5
echo ""
echo "✅ Backend reiniciado!"
echo ""
echo "🎯 Agora tente cadastrar um indicador:"
echo "   URL: http://SEU_IP:3000/admin"
echo "   Seção: Indicadores > Adicionar"
echo ""
echo "💡 Se ainda houver problemas:"
echo "   - Verifique os logs: docker logs crm-backend | tail -30"
echo ""
