#!/bin/bash

echo "🔧 Executando migrations no banco de dados..."
echo ""

# Executar o schema principal dentro do container MySQL
echo "📝 Criando tabelas..."
docker exec crm-mysql mysql -u root -proot123 protecar_crm < backend/migrations/schema-mysql.sql

echo ""
echo "✅ Migrations executadas com sucesso!"
echo ""
echo "Agora reinicie o backend:"
echo "  docker-compose restart backend"
echo ""
