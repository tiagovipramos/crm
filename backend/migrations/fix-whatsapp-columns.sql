-- Adicionar coluna sessao_whatsapp na tabela consultores
ALTER TABLE consultores 
ADD COLUMN sessao_whatsapp TEXT NULL AFTER session_data;

-- Adicionar coluna tipo_api_whatsapp
ALTER TABLE consultores 
ADD COLUMN tipo_api_whatsapp VARCHAR(20) DEFAULT 'nao_oficial' AFTER sessao_whatsapp;

-- Adicionar índices para melhor performance
CREATE INDEX idx_consultores_status ON consultores(status_conexao);
CREATE INDEX idx_consultores_sistema ON consultores(sistema_online);
