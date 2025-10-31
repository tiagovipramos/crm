-- ============================================
-- MIGRAÇÃO: ADICIONAR HORA DE ENVIO NO FOLLOW-UP
-- ============================================
-- Criado em: 31/10/2025
-- Descrição: Adiciona campo hora_envio para controlar o horário específico de envio das mensagens

-- Verificar e adicionar coluna hora_envio na tabela followup_mensagens
SET @dbname = DATABASE();
SET @tablename = 'followup_mensagens';
SET @columnname = 'hora_envio';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE followup_mensagens ADD COLUMN hora_envio TIME DEFAULT "09:00:00" COMMENT "Horário específico para envio da mensagem (formato HH:MM:SS)"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Atualizar mensagens existentes com horário padrão (9h da manhã)
UPDATE followup_mensagens 
SET hora_envio = '09:00:00' 
WHERE hora_envio IS NULL;

-- Adicionar índice para otimizar consultas (se não existir)
SET @indexname = 'idx_hora_envio';
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE followup_mensagens ADD INDEX idx_hora_envio (hora_envio)'
));
PREPARE alterIndexIfNotExists FROM @preparedStatement2;
EXECUTE alterIndexIfNotExists;
DEALLOCATE PREPARE alterIndexIfNotExists;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
  'Campo hora_envio adicionado com sucesso!' as status,
  COUNT(*) as total_mensagens_atualizadas
FROM followup_mensagens
WHERE hora_envio IS NOT NULL;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
