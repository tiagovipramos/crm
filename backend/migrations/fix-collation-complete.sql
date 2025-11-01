-- ===============================================
-- FIX COLLATION MISMATCH - SCRIPT COMPLETO
-- ===============================================

USE protecar_crm;

-- 1. Remover todas as foreign keys relacionadas a indicadores
ALTER TABLE saques_indicador DROP FOREIGN KEY IF EXISTS saques_indicador_ibfk_1;
ALTER TABLE transacoes_indicador DROP FOREIGN KEY IF EXISTS transacoes_indicador_ibfk_1;

-- 2. Alterar collation da coluna indicador_id nas tabelas dependentes
ALTER TABLE saques_indicador 
MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE transacoes_indicador 
MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Alterar collation de todas as colunas de texto em indicadores
ALTER TABLE indicadores 
MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN nome VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN senha VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN telefone VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
MODIFY COLUMN cpf VARCHAR(14) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Recriar as foreign keys
ALTER TABLE saques_indicador 
ADD CONSTRAINT saques_indicador_ibfk_1 
FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE;

ALTER TABLE transacoes_indicador 
ADD CONSTRAINT transacoes_indicador_ibfk_1 
FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE;

-- 5. Verificar
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLLATION_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'protecar_crm'
  AND TABLE_NAME IN ('indicadores', 'saques_indicador', 'transacoes_indicador')
  AND COLUMN_NAME IN ('id', 'indicador_id', 'created_by');
