-- Adicionar coluna numero_whatsapp na tabela consultores
ALTER TABLE consultores 
ADD COLUMN numero_whatsapp VARCHAR(20) NULL AFTER sessao_whatsapp;

-- Verificar se a coluna foi adicionada
DESCRIBE consultores;
