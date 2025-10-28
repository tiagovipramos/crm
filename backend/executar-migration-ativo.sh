#!/bin/bash

echo "Executando migration para adicionar coluna ativo..."
cd "$(dirname "$0")"

# Tentar diferentes formas de executar o MySQL
if command -v mysql &> /dev/null; then
    mysql -u root protecar_crm < migrations/adicionar-coluna-ativo-consultores.sql
elif [ -f "/usr/bin/mysql" ]; then
    /usr/bin/mysql -u root protecar_crm < migrations/adicionar-coluna-ativo-consultores.sql
else
    echo "ERRO: MySQL não encontrado no sistema"
    echo "Instale o MySQL ou ajuste o PATH"
    read -p "Pressione Enter para fechar..."
    exit 1
fi

echo "Migration concluída!"
read -p "Pressione Enter para fechar..."
