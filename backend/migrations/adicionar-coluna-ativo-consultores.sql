-- Adicionar coluna ativo na tabela consultores
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Garantir que todos os registros existentes sejam marcados como ativos
UPDATE consultores SET ativo = TRUE WHERE ativo IS NULL;
