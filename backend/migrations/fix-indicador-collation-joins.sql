-- Migration: Corrigir collations para permitir JOINs entre tabelas
-- Objetivo: Resolver erro "Illegal mix of collations" no dashboard do indicador
-- Tipo: MODIFY (seguro - não remove dados)
-- Data: 2025-11-01

-- Corrigir collation das colunas UUID em indicadores (sem redefinir PRIMARY KEY)
ALTER TABLE indicadores
  MODIFY COLUMN id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL;

-- Corrigir collation das colunas UUID em indicacoes
ALTER TABLE indicacoes 
  MODIFY COLUMN indicador_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  MODIFY COLUMN lead_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NULL;

-- Verificar se existem outras colunas que precisam de ajuste
-- Se a tabela leads também tiver problemas, corrigir (sem redefinir PRIMARY KEY):
ALTER TABLE leads
  MODIFY COLUMN id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL;

-- Corrigir coluna indicador_id em leads se existir
ALTER TABLE leads
  MODIFY COLUMN indicador_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NULL;

-- Verificar collations após a correção
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'protecar_crm'
    AND TABLE_NAME IN ('indicadores', 'indicacoes', 'leads')
    AND COLUMN_NAME IN ('id', 'indicador_id', 'lead_id')
ORDER BY TABLE_NAME, COLUMN_NAME;
