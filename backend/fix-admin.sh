#!/bin/bash

echo "Corrigindo usuário admin..."
cd "$(dirname "$0")"

# Tentar diferentes formas de executar o Node.js
if command -v node &> /dev/null; then
    node check-admin.js
else
    echo "ERRO: Node.js não encontrado no sistema"
    echo "Instale o Node.js para continuar"
    read -p "Pressione Enter para fechar..."
    exit 1
fi

echo ""
read -p "Pressione Enter para fechar..."
