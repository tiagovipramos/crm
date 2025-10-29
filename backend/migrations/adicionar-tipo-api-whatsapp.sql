-- Migration para adicionar tipo de API do WhatsApp
-- Adiciona coluna para armazenar qual API usar: 'oficial' ou 'nao_oficial'

ALTER TABLE consultores 
ADD COLUMN tipo_api_whatsapp VARCHAR(20) DEFAULT 'nao_oficial' 
COMMENT 'Tipo de API WhatsApp: oficial ou nao_oficial';

-- Atualizar consultores existentes para usar API não oficial (padrão)
UPDATE consultores SET tipo_api_whatsapp = 'nao_oficial' WHERE tipo_api_whatsapp IS NULL;
