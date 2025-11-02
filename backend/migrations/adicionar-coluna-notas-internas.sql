-- Adicionar coluna notas_internas na tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notas_internas TEXT;

-- Mensagem de confirmação
SELECT 'Coluna notas_internas adicionada com sucesso!' AS resultado;
