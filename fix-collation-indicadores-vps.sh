#!/bin/bash

# Script para corrigir problema de collation entre indicadores e consultores
# Autor: Sistema CRM
# Data: 2025-01-30

echo "🔧 === CORREÇÃO DE COLLATION - INDICADORES ==="
echo ""
echo "Este script irá:"
echo "1. Corrigir collation da coluna created_by em indicadores"
echo "2. Corrigir collation da coluna id em indicadores"
echo "3. Permitir JOIN entre indicadores e consultores"
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

echo "📊 Executando correções de collation..."
echo ""

# Executar correções no MySQL
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm << 'EOF'

-- Corrigir collation da coluna created_by em indicadores
ALTER TABLE indicadores 
MODIFY COLUMN created_by VARCHAR(36) 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

-- Corrigir collation da coluna id em indicadores
ALTER TABLE indicadores 
MODIFY COLUMN id VARCHAR(36) 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- Mostrar resultado
SELECT '✅ Collations corrigidas!' AS Status;
SELECT '' AS Separador;

-- Verificar collations
SELECT 'Collations das colunas:' AS Info;
SELECT 
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'protecar_crm'
    AND TABLE_NAME = 'indicadores'
    AND COLUMN_NAME IN ('id', 'created_by');

EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔄 Reiniciando backend..."
docker restart crm-backend

echo "⏳ Aguardando 10 segundos..."
sleep 10

echo ""
echo "✅ Correções aplicadas!"
echo ""
echo "🎯 Agora recarregue a página do admin:"
echo "   Os indicadores devem aparecer na lista!"
echo ""
echo "💡 Se ainda houver problemas:"
echo "   docker logs crm-backend | tail -20"
echo ""
