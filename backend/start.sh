#!/bin/sh
# 🔒 Script de inicialização SEGURO - Proteção contra destruição de dados

echo "🚀 Iniciando aplicação..."
echo ""

# ⚠️ SETUP AUTOMÁTICO DESATIVADO - PROTEÇÃO DO BANCO DE DADOS
# O setup-database.js pode DESTRUIR o banco existente!
# Configure o banco manualmente apenas na primeira vez.

echo "🔒 Setup automático DESATIVADO (proteção de dados)"
echo "⚠️  O banco de dados existente será preservado"
echo "⚠️  Para setup inicial, execute manualmente: npm run setup"
echo ""

# Iniciar aplicação direto (sem migrations automáticas)
echo "🎯 Iniciando servidor..."
exec npm start
