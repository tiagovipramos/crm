#!/bin/bash

# Script para corrigir problema de login no CRM
# Autor: Sistema CRM
# Data: 2025-01-29

echo "🔧 === CORREÇÃO DE LOGIN NO CRM ===" 
echo ""
echo "Este script irá:"
echo "1. Adicionar coluna 'role' se não existir"
echo "2. Adicionar coluna 'ativo' se não existir"
echo "3. Transformar o primeiro consultor em diretor"
echo "4. Ativar todos os consultores"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

echo "📊 Executando correções no banco de dados..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < fix-login-database.sql

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Correção concluída!"
echo ""
echo "🔐 Agora teste o login:"
echo "   URL: http://SEU_IP:3000/admin/login"
echo ""
echo "📧 Use as credenciais do usuário que foi promovido a diretor"
echo "   (verifique na saída acima qual usuário foi definido como diretor)"
echo ""
echo "💡 Se ainda houver problemas:"
echo "   - Verifique os logs: docker logs crm-backend"
echo "   - Verifique se o backend está rodando: docker ps"
echo ""
