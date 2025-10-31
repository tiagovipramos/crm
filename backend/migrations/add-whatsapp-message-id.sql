-- Adicionar coluna whatsapp_message_id à tabela mensagens
ALTER TABLE mensagens 
ADD COLUMN whatsapp_message_id VARCHAR(100) NULL AFTER status,
ADD INDEX idx_whatsapp_message_id (whatsapp_message_id);
