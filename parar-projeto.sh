#!/bin/bash

echo "============================================"
echo "   PROTECAR CRM - PARANDO PROJETO"
echo "============================================"
echo ""

echo "[1/3] Parando processos Node.js (Frontend e Backend)..."
# Matar processos Node.js relacionados ao projeto
pkill -f "npm run dev" 2>/dev/null && echo "   Processos Node.js finalizados" || echo "   Nenhum processo Node.js rodando"

echo ""
echo "[2/3] Verificando MySQL..."
if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld; then
    echo "   MySQL está rodando"
    read -p "   Deseja parar o MySQL? (s/N): " resposta
    if [[ "$resposta" =~ ^[Ss]$ ]]; then
        echo "   Parando MySQL..."
        sudo systemctl stop mysql 2>/dev/null || sudo systemctl stop mysqld 2>/dev/null
        echo "   MySQL finalizado"
    else
        echo "   MySQL mantido em execução"
    fi
else
    echo "   MySQL não está rodando"
fi

echo ""
echo "============================================"
echo "   PROJETO PARADO!"
echo "============================================"
echo ""
read -p "Pressione Enter para fechar..."
