-- Adicionar coluna numero_whatsapp na tabela consultores
ALTER TABLE consultores 
ADD COLUMN numero_whatsapp VARCHAR(20) DEFAULT NULL 
AFTER sessao_whatsapp;
