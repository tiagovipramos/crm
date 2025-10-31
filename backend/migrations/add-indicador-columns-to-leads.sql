-- Adicionar colunas indicador_id e indicacao_id na tabela leads
-- Data: 2025-10-30
-- Fix: Permitir associação de leads com indicadores e indicações

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS indicador_id VARCHAR(36) NULL AFTER consultor_id,
ADD COLUMN IF NOT EXISTS indicacao_id VARCHAR(36) NULL AFTER indicador_id;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_indicador ON leads(indicador_id);
CREATE INDEX IF NOT EXISTS idx_indicacao ON leads(indicacao_id);
