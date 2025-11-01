-- ============================================
-- CORREÇÃO DE COLLATION - SISTEMA DE INDICADORES (SAFE)
-- ============================================
-- Problema: Erro "Illegal mix of collations" nos JOINs
-- Solução: Remover FKs -> Corrigir collations -> Recriar FKs
-- Data: 2025-11-01
-- ============================================

-- Verificar collations atuais
SELECT 'Iniciando correção de collation...' as status;

-- ============================================
-- PASSO 1: REMOVER FOREIGN KEYS
-- ============================================

-- Remover FKs da tabela transacoes_indicador
SET @query = (SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE transacoes_indicador DROP FOREIGN KEY transacoes_indicador_ibfk_1',
    'SELECT "FK transacoes_indicador_ibfk_1 não existe" as info'
) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'protecar_crm' 
AND TABLE_NAME = 'transacoes_indicador' 
AND CONSTRAINT_NAME = 'transacoes_indicador_ibfk_1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remover FKs da tabela indicacoes
SET @query = (SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE indicacoes DROP FOREIGN KEY indicacoes_ibfk_1',
    'SELECT "FK indicacoes_ibfk_1 não existe" as info'
) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'protecar_crm' 
AND TABLE_NAME = 'indicacoes' 
AND CONSTRAINT_NAME = 'indicacoes_ibfk_1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @query = (SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE indicacoes DROP FOREIGN KEY indicacoes_ibfk_2',
    'SELECT "FK indicacoes_ibfk_2 não existe" as info'
) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'protecar_crm' 
AND TABLE_NAME = 'indicacoes' 
AND CONSTRAINT_NAME = 'indicacoes_ibfk_2');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remover FKs da tabela saldos_indicadores
SET @query = (SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE saldos_indicadores DROP FOREIGN KEY saldos_indicadores_ibfk_1',
    'SELECT "FK saldos_indicadores_ibfk_1 não existe" as info'
) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'protecar_crm' 
AND TABLE_NAME = 'saldos_indicadores' 
AND CONSTRAINT_NAME = 'saldos_indicadores_ibfk_1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remover FKs da tabela leads (relacionadas a indicadores)
SET @query = (SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE leads DROP FOREIGN KEY leads_ibfk_1',
    'SELECT "FK leads_ibfk_1 não existe" as info'
) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'protecar_crm' 
AND TABLE_NAME = 'leads' 
AND CONSTRAINT_NAME = 'leads_ibfk_1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @query = (SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE leads DROP FOREIGN KEY leads_ibfk_2',
    'SELECT "FK leads_ibfk_2 não existe" as info'
) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_SCHEMA = 'protecar_crm' 
AND TABLE_NAME = 'leads' 
AND CONSTRAINT_NAME = 'leads_ibfk_2');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'FKs removidas com sucesso' as status;

-- ============================================
-- PASSO 2: ALTERAR COLLATIONS
-- ============================================

-- TABELA: indicadores
ALTER TABLE indicadores 
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- TABELA: indicacoes
ALTER TABLE indicacoes 
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN lead_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- TABELA: leads
ALTER TABLE leads
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN consultor_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

-- TABELA: consultores
ALTER TABLE consultores
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- TABELA: transacoes_indicador
ALTER TABLE transacoes_indicador
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

SELECT 'Collations atualizadas com sucesso' as status;

-- ============================================
-- PASSO 3: RECRIAR FOREIGN KEYS
-- ============================================

-- FK: transacoes_indicador -> indicadores
ALTER TABLE transacoes_indicador 
  ADD CONSTRAINT transacoes_indicador_ibfk_1 
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE;

-- FK: indicacoes -> indicadores
ALTER TABLE indicacoes 
  ADD CONSTRAINT indicacoes_ibfk_1 
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE;

-- FK: indicacoes -> leads
ALTER TABLE indicacoes 
  ADD CONSTRAINT indicacoes_ibfk_2 
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- FK: leads -> consultores
ALTER TABLE leads 
  ADD CONSTRAINT leads_ibfk_1 
  FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE SET NULL;

-- FK: leads -> indicadores
ALTER TABLE leads 
  ADD CONSTRAINT leads_ibfk_2 
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE SET NULL;

SELECT 'FKs recriadas com sucesso' as status;
SELECT 'Correção de collation concluída!' as status;
