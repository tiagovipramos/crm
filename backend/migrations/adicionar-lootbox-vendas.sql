-- Adicionar coluna para rastrear vendas para a caixa de vendas
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS vendas_para_proxima_caixa INT DEFAULT 0;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS total_caixas_vendas_abertas INT DEFAULT 0;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS total_ganho_caixas_vendas DECIMAL(10, 2) DEFAULT 0.00;
