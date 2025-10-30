#!/bin/bash

echo "🗑️  Limpando banco de dados e recriando do zero..."
echo ""

# Parar todos os containers
echo "⏹️  Parando containers..."
docker-compose down

# Remover o volume do MySQL (isso apaga todos os dados)
echo "🗑️  Removendo volume do banco de dados..."
docker volume rm crm_mysql_data

# Remover todas as imagens para forçar rebuild
echo "🗑️  Removendo imagens antigas..."
docker rmi crm_backend crm_frontend crm-mysql 2>/dev/null || true

echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "Agora execute:"
echo "  docker-compose up -d --build"
echo ""
