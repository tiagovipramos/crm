-- Adicionar coluna para rastrear se consultor está online no sistema
ALTER TABLE consultores 
ADD COLUMN sistema_online BOOLEAN DEFAULT FALSE AFTER status_conexao;

-- Atualizar consultores existentes para offline
UPDATE consultores SET sistema_online = FALSE;
