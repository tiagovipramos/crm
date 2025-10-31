-- ✅ Bug #7: Adicionar coluna notas_internas à tabela leads
-- A coluna é usada no código mas não existe no schema

USE protecar_crm;

-- Adicionar coluna notas_internas (armazena JSON com notas)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS notas_internas JSON DEFAULT NULL
AFTER observacoes;

-- Criar índice para melhorar performance em buscas
CREATE INDEX IF NOT EXISTS idx_leads_notas ON leads(id);

SELECT 'Coluna notas_internas adicionada com sucesso!' as status;
