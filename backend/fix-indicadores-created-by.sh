#!/bin/bash

echo "Corrigindo campo created_by dos indicadores..."
cd "$(dirname "$0")"

# Tentar diferentes formas de executar o MySQL
if command -v mysql &> /dev/null; then
    mysql -u root protecar_crm < migrations/adicionar-coluna-created-by-indicadores.sql
elif [ -f "/usr/bin/mysql" ]; then
    /usr/bin/mysql -u root protecar_crm < migrations/adicionar-coluna-created-by-indicadores.sql
else
    echo "ERRO: MySQL não encontrado no sistema"
    echo "Instale o MySQL ou ajuste o PATH"
    read -p "Pressione Enter para fechar..."
    exit 1
fi

echo "Correção concluída!"
read -p "Pressione Enter para fechar..."
