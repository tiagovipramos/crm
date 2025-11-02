-- Adicionar campos faltantes na tabela leads

USE protecar_crm;

-- Adicionar coluna cor_veiculo
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS cor_veiculo VARCHAR(50) AFTER placa_veiculo;

-- Adicionar coluna informacoes_comerciais  
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS informacoes_comerciais TEXT AFTER observacoes;

SELECT 'Colunas adicionadas com sucesso!' AS status;
