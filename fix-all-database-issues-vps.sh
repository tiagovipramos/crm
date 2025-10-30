#!/bin/bash

# Script para corrigir TODOS os problemas do banco de dados
# Autor: Sistema CRM
# Data: 2025-01-30

echo "🔧 === CORREÇÃO COMPLETA DO BANCO DE DADOS ==="
echo ""
echo "Este script irá corrigir:"
echo "1. Adicionar coluna created_by em indicadores"
echo "2. Criar tabela saques_indicador"
echo "3. Corrigir estrutura da tabela tarefas"
echo "4. Adicionar todas as colunas faltantes"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

echo "📊 Executando correções..."
echo ""

# Executar todas as correções no MySQL
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm << 'EOF'

-- 1. Adicionar created_by em indicadores se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'indicadores' 
               AND column_name = 'created_by');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE indicadores ADD COLUMN created_by VARCHAR(36) NULL',
    'SELECT ''Coluna created_by já existe em indicadores'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Criar tabela saques_indicador
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

-- 3. Verificar e corrigir tabela tarefas
-- Adicionar coluna data_hora se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'tarefas' 
               AND column_name = 'data_hora');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE tarefas ADD COLUMN data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'SELECT ''Coluna data_hora já existe em tarefas'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Adicionar avatar em indicadores se não existir
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'indicadores' 
               AND column_name = 'avatar');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE indicadores ADD COLUMN avatar VARCHAR(255) NULL',
    'SELECT ''Coluna avatar já existe em indicadores'' AS Info');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mostrar resultado
SELECT '✅ Correções aplicadas!' AS Status;
SELECT '' AS Separador;

-- Mostrar tabelas criadas
SELECT 'Tabelas no banco:' AS Info;
SHOW TABLES;

SELECT '' AS Separador;
SELECT 'Estrutura da tabela indicadores:' AS Info;
DESCRIBE indicadores;

SELECT '' AS Separador;
SELECT 'Estrutura da tabela saques_indicador:' AS Info;
DESCRIBE saques_indicador;

EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 Reiniciando backend..."
docker restart crm-backend

echo "⏳ Aguardando 10 segundos..."
sleep 10

echo ""
echo "✅ Todas as correções aplicadas!"
echo ""
echo "🎯 Agora tente:"
echo "   1. Cadastrar um vendedor"
echo "   2. Cadastrar um indicador"
echo "   3. Criar uma tarefa"
echo ""
echo "💡 Se ainda houver problemas:"
echo "   docker logs crm-backend | tail -30"
echo ""
