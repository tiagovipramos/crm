-- ============================================
-- CORREÇÃO DE COLLATION MISMATCH
-- ============================================
-- Data: 2025-10-30
-- Descrição: Padronizar todas as tabelas para utf8mb4_unicode_ci
-- Problema: Erro "Illegal mix of collations" ao fazer JOIN entre tabelas

USE crm;

-- 1. Alterar collation do banco de dados
ALTER DATABASE crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Alterar collation de todas as tabelas principais
ALTER TABLE indicadores CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE indicacoes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE leads CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE consultores CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE mensagens CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE tarefas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE transacoes_indicador CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE saques_indicador CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Alterar collation de tabelas de lootbox (se existirem)
ALTER TABLE lootbox_premios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE lootbox_historico CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Alterar collation de tabelas auxiliares
ALTER TABLE whatsapp_sessions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE whatsapp_validacao_cache CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Verificar as collations após a correção
SELECT 
    TABLE_NAME,
    TABLE_COLLATION 
FROM 
    information_schema.TABLES 
WHERE 
    TABLE_SCHEMA = 'crm'
ORDER BY 
    TABLE_NAME;

-- ============================================
-- FIM DA CORREÇÃO
-- ============================================
