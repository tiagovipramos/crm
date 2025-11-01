-- ============================================
-- CORREÇÃO DE COLLATION - SISTEMA DE INDICADORES
-- ============================================
-- Problema: Erro "Illegal mix of collations" nos JOINs
-- Solução: Padronizar todas as colunas para utf8mb4_unicode_ci
-- Data: 2025-11-01
-- ============================================

-- Verificar collations atuais
SELECT 'Verificando collations antes da correção' as status;

-- ============================================
-- TABELA: indicadores
-- ============================================
ALTER TABLE indicadores 
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- ============================================
-- TABELA: indicacoes
-- ============================================
ALTER TABLE indicacoes 
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN lead_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- ============================================
-- TABELA: leads
-- ============================================
ALTER TABLE leads
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN consultor_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL;

-- ============================================
-- TABELA: consultores
-- ============================================
ALTER TABLE consultores
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- ============================================
-- TABELA: saldos_indicadores
-- ============================================
ALTER TABLE saldos_indicadores
  MODIFY COLUMN id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN indicador_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

SELECT 'Correção de collation concluída com sucesso!' as status;
