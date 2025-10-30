#!/bin/bash

# Script DEFINITIVO para corrigir TODOS os problemas do banco
# Autor: Sistema CRM
# Data: 2025-01-30

echo "🔧 === CORREÇÃO DEFINITIVA - TODOS OS PROBLEMAS ==="
echo ""
echo "Este script irá:"
echo "1. Criar tabela indicacoes"
echo "2. Adicionar colunas de lootbox em indicadores"
echo "3. Corrigir todas as collations"
echo "4. Criar tabela saques_indicador"
echo "5. Adicionar coluna created_by em consultores e indicadores"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

echo "📊 Executando correções completas..."
echo ""

# Executar TODAS as correções no MySQL
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm << 'EOF'

-- 1. Remover foreign keys temporariamente (ignorar erro se não existir)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
               WHERE CONSTRAINT_SCHEMA = 'protecar_crm' 
               AND TABLE_NAME = 'lootbox_historico' 
               AND CONSTRAINT_NAME = 'lootbox_historico_ibfk_1');

SET @sqlstmt := IF(@exist > 0, 
    'ALTER TABLE lootbox_historico DROP FOREIGN KEY lootbox_historico_ibfk_1',
    'SELECT ''FK não existe'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Corrigir collations
ALTER TABLE indicadores MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;
ALTER TABLE indicadores MODIFY COLUMN created_by VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;
ALTER TABLE lootbox_historico MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

-- 3. Adicionar coluna created_by em consultores se não existir
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

-- 4. Adicionar colunas de lootbox em indicadores se não existirem
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS leads_para_proxima_caixa INT DEFAULT 3;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS total_caixas_abertas INT DEFAULT 0;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS total_ganho_caixas DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS vendas_para_proxima_caixa INT DEFAULT 3;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS total_caixas_vendas_abertas INT DEFAULT 0;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS total_ganho_caixas_vendas DECIMAL(10,2) DEFAULT 0.00;

-- 5. Criar tabela indicacoes se não existir
CREATE TABLE IF NOT EXISTS indicacoes (
  id VARCHAR(36) PRIMARY KEY,
  indicador_id VARCHAR(36) NOT NULL,
  lead_id VARCHAR(36) NULL,
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  status ENUM('pendente', 'enviado_crm', 'respondeu', 'converteu', 'engano') DEFAULT 'pendente',
  data_indicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_envio_crm TIMESTAMP NULL,
  data_resposta TIMESTAMP NULL,
  data_conversao TIMESTAMP NULL,
  valor_comissao DECIMAL(10,2) DEFAULT 0.00,
  observacoes TEXT,
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

-- 6. Criar tabela saques_indicador se não existir
CREATE TABLE IF NOT EXISTS saques_indicador (
  id VARCHAR(36) PRIMARY KEY,
  indicador_id VARCHAR(36) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'solicitado',
  data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_processamento TIMESTAMP NULL,
  observacoes TEXT,
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
);

-- 7. Recriar foreign key do lootbox com collations corretas
ALTER TABLE lootbox_historico 
ADD CONSTRAINT lootbox_historico_ibfk_1 
FOREIGN KEY (indicador_id) REFERENCES indicadores(id) 
ON DELETE CASCADE;

-- Mostrar resultado
SELECT '✅ Todas as correções aplicadas!' AS Status;

EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 Reiniciando backend e frontend..."
docker restart crm-backend crm-frontend

echo "⏳ Aguardando 15 segundos..."
sleep 15

echo ""
echo "✅ Setup definitivo completo!"
echo ""
echo "🎯 Agora teste:"
echo "   1. Login como indicador: http://185.217.125.72:3000/indicador/login"
echo "   2. Dashboard deve carregar sem erros"
echo "   3. Login como admin: http://185.217.125.72:3000/admin/login"
echo "   4. Lista de indicadores deve aparecer"
echo ""
echo "💡 Se ainda houver problemas:"
echo "   docker logs crm-backend | tail -30"
echo ""
