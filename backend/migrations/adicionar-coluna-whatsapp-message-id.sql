-- Adicionar coluna para armazenar ID único do WhatsApp
-- Isso evita duplicação de mensagens ao reconectar

ALTER TABLE mensagens 
ADD COLUMN whatsapp_message_id VARCHAR(255) NULL UNIQUE,
ADD INDEX idx_whatsapp_message_id (whatsapp_message_id);

-- Comentário: Esta coluna armazena o ID único que cada mensagem recebe do WhatsApp
-- É usado para evitar duplicação quando o Baileys re-sincroniza mensagens antigas
