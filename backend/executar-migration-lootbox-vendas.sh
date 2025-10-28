#!/bin/bash

echo "Executando migration para adicionar lootbox vendas..."
cd "$(dirname "$0")"

# Tentar diferentes formas de executar o MySQL
if command -v mysql &> /dev/null; then
    mysql -u root protecar_crm < migrations/adicionar-lootbox-vendas.sql
elif [ -f "/usr/bin/mysql" ]; then
    /usr/bin/mysql -u root protecar_crm < migrations/adicionar-lootbox-vendas.sql
else
    echo "ERRO: MySQL não encontrado no sistema"
    echo "Instale o MySQL ou ajuste o PATH"
    read -p "Pressione Enter para fechar..."
    exit 1
fi

echo "Migration concluída!"
read -p "Pressione Enter para fechar..."
