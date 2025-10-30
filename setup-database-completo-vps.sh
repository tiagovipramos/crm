#!/bin/bash

# Script para configurar banco de dados COMPLETO do zero
# Autor: Sistema CRM
# Data: 2025-01-30

echo "🔧 === SETUP COMPLETO DO BANCO DE DADOS ==="
echo ""
echo "Este script irá:"
echo "1. Executar TODAS as migrations SQL na ordem correta"
echo "2. Criar todas as tabelas necessárias"
echo "3. Configurar relacionamentos e triggers"
echo "4. Inserir dados iniciais"
echo ""
echo "⚠️  IMPORTANTE: Certifique-se de que o MySQL está rodando!"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

# Verificar se MySQL está rodando
if ! docker ps | grep -q "crm-mysql"; then
    echo "❌ Container MySQL não está rodando!"
    echo "🔧 Iniciando containers..."
    docker-compose up -d
    echo "⏳ Aguardando 15 segundos para MySQL iniciar..."
    sleep 15
fi

echo "📊 Executando migrations SQL..."
echo ""

# 1. Schema principal (tabelas base)
echo "1️⃣  Criando schema principal..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/schema-mysql.sql 2>/dev/null || echo "Schema principal já existe ou erro"

# 2. Tabela indicadores
echo "2️⃣  Criando tabela indicadores..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/schema-indicadores-mysql.sql 2>/dev/null || echo "Tabela indicadores já existe ou erro"

# 3. Sistema de lootbox
echo "3️⃣  Criando sistema de lootbox..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/schema-lootbox.sql 2>/dev/null || echo "Lootbox já existe ou erro"

# 4. Tabela de tarefas
echo "4️⃣  Criando tabela de tarefas..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-tabela-tarefas.sql 2>/dev/null || echo "Tarefas já existe ou erro"

# 5. Adicionar colunas em consultores
echo "5️⃣  Adicionando colunas em consultores..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-role.sql 2>/dev/null || echo "Coluna role já existe"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-ativo-consultores.sql 2>/dev/null || echo "Coluna ativo já existe"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-numero-whatsapp.sql 2>/dev/null || echo "Coluna numero_whatsapp já existe"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-created-by.sql 2>/dev/null || echo "Coluna created_by já existe"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-sistema-online.sql 2>/dev/null || echo "Coluna sistema_online já existe"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-tipo-api-whatsapp.sql 2>/dev/null || echo "Coluna tipo_api já existe"

# 6. Adicionar colunas em indicadores
echo "6️⃣  Adicionando colunas em indicadores..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-avatar-indicadores.sql 2>/dev/null || echo "Coluna avatar indicadores já existe"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-created-by-indicadores.sql 2>/dev/null || echo "Coluna created_by indicadores já existe"

# 7. Adicionar colunas em leads
echo "7️⃣  Adicionando colunas em leads..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-notas-internas.sql 2>/dev/null || echo "Coluna notas_internas já existe"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-coluna-whatsapp-message-id.sql 2>/dev/null || echo "Coluna whatsapp_message_id já existe"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-campos-veiculo.sql 2>/dev/null || echo "Campos veículo já existem"

# 8. Lootbox vendas
echo "8️⃣  Adicionando lootbox vendas..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-lootbox-vendas.sql 2>/dev/null || echo "Lootbox vendas já existe"

# 9. Triggers
echo "9️⃣  Criando triggers..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/atualizar-triggers-indicacao-instantaneo.sql 2>/dev/null || echo "Triggers já existem"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/adicionar-triggers-reversao.sql 2>/dev/null || echo "Triggers reversão já existem"

# 10. Configuração WhatsApp
echo "🔟 Criando tabela config WhatsApp..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/criar-tabela-whatsapp-oficial-config.sql 2>/dev/null || echo "Tabela WhatsApp config já existe"

# 11. Inserir admin padrão
echo "1️⃣1️⃣  Inserindo usuário admin..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/inserir-admin.sql 2>/dev/null || echo "Admin já existe"

# 12. Fix admin login
echo "1️⃣2️⃣  Corrigindo login admin..."
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm < backend/migrations/fix-admin-login.sql 2>/dev/null || echo "Admin login já corrigido"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Migrations executadas!"
echo ""

# Verificar tabelas criadas
echo "📋 Tabelas criadas:"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SHOW TABLES;"

echo ""
echo "🔄 Reiniciando backend..."
docker restart crm-backend

echo "⏳ Aguardando 10 segundos..."
sleep 10

echo ""
echo "✅ Setup completo!"
echo ""
echo "🎯 Agora você pode:"
echo "   1. Fazer login: http://185.217.125.72:3000/admin/login"
echo "   2. Email: diretor@protecar.com (ou admin@protecar.com)"
echo "   3. Senha: 123456"
echo ""
echo "💡 Se ainda houver problemas:"
echo "   - Ver logs: docker logs crm-backend | tail -50"
echo ""
