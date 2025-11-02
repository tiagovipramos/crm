-- ============================================
-- RECRIAR REGISTRO DE ÁUDIO FALTANTE
-- ============================================
-- 
-- Arquivo: audio_1761223775355_558187780566.webm
-- Lead: 7ff4c5b7-b008-11f0-8731-8cb0e93127ca
-- Data do arquivo: 2025-10-23 09:49:35
--
-- Este script recria o registro da mensagem de áudio
-- que foi perdida/deletada do banco mas o arquivo físico ainda existe
-- ============================================

INSERT INTO mensagens (
  id,
  lead_id, 
  consultor_id, 
  conteudo, 
  tipo, 
  remetente, 
  status, 
  media_url, 
  media_name,
  timestamp
) VALUES (
  UUID(),
  '7ff4c5b7-b008-11f0-8731-8cb0e93127ca',  -- Lead ID
  'b9bc4ffc-ade8-11f0-9914-8cb0e93127ca',  -- Consultor ID
  '🎤 Áudio',
  'audio',
  'consultor',  -- Ou 'lead' se foi recebido do cliente
  'lida',
  '/uploads/audios/audio_1761223775355_558187780566.webm',
  'audio_1761223775355_558187780566.webm',
  '2025-10-23 09:49:35'  -- Data do arquivo
);

-- Atualizar última mensagem do lead (opcional)
UPDATE leads 
SET ultima_mensagem = '🎤 Áudio',
    data_atualizacao = NOW()
WHERE id = '7ff4c5b7-b008-11f0-8731-8cb0e93127ca';

SELECT '✅ Registro de áudio recriado com sucesso!' as resultado;
