-- ============================================
-- SISTEMA DE FOLLOW-UP INTELIGENTE
-- ============================================

-- Tabela de Sequências de Follow-Up
CREATE TABLE IF NOT EXISTS followup_sequencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  fase_inicio ENUM('novo', 'primeiro_contato', 'proposta_enviada', 'convertido', 'perdido') NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  automatico BOOLEAN DEFAULT TRUE, -- Se inicia automaticamente ao entrar na fase
  prioridade INT DEFAULT 0, -- Para resolver conflitos entre múltiplas sequências
  criado_por VARCHAR(36) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fase_inicio (fase_inicio),
  INDEX idx_ativo (ativo),
  INDEX idx_criado_por (criado_por)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Mensagens da Sequência
CREATE TABLE IF NOT EXISTS followup_mensagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequencia_id INT NOT NULL,
  ordem INT NOT NULL, -- Ordem da mensagem na sequência (1, 2, 3...)
  dias_espera INT NOT NULL, -- Dias para esperar antes de enviar esta mensagem
  conteudo TEXT NOT NULL,
  tipo_mensagem ENUM('texto', 'audio', 'imagem', 'documento') DEFAULT 'texto',
  media_url VARCHAR(500), -- URL do áudio/imagem/documento se aplicável
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sequencia_id) REFERENCES followup_sequencias(id) ON DELETE CASCADE,
  INDEX idx_sequencia_ordem (sequencia_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Follow-Ups Ativos (leads que estão em uma sequência)
CREATE TABLE IF NOT EXISTS followup_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id VARCHAR(36) NOT NULL,
  sequencia_id INT NOT NULL,
  mensagem_atual INT DEFAULT 1, -- Qual mensagem será enviada a seguir
  status ENUM('ativo', 'pausado', 'concluido', 'cancelado') DEFAULT 'ativo',
  data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Quando entrou na sequência
  data_proxima_mensagem DATETIME, -- Quando a próxima mensagem será enviada
  pausado_em TIMESTAMP NULL,
  concluido_em TIMESTAMP NULL,
  motivo_pausa VARCHAR(255), -- Motivo da pausa (ex: "Lead mudou de fase")
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (sequencia_id) REFERENCES followup_sequencias(id) ON DELETE CASCADE,
  INDEX idx_lead_status (lead_id, status),
  INDEX idx_proxima_mensagem (data_proxima_mensagem, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Histórico de Envios
CREATE TABLE IF NOT EXISTS followup_historico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  followup_lead_id INT NOT NULL,
  mensagem_id INT NOT NULL,
  lead_id VARCHAR(36) NOT NULL,
  enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status_envio ENUM('sucesso', 'falha', 'pendente') DEFAULT 'pendente',
  erro TEXT, -- Mensagem de erro se falhou
  FOREIGN KEY (followup_lead_id) REFERENCES followup_leads(id) ON DELETE CASCADE,
  FOREIGN KEY (mensagem_id) REFERENCES followup_mensagens(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  INDEX idx_lead_enviado (lead_id, enviado_em),
  INDEX idx_status (status_envio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Configurações Globais do Follow-Up
CREATE TABLE IF NOT EXISTS followup_configuracoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descricao VARCHAR(255),
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configurações padrão
INSERT INTO followup_configuracoes (chave, valor, descricao) VALUES
('horario_inicio_envios', '08:00', 'Horário de início para envio de mensagens automáticas'),
('horario_fim_envios', '20:00', 'Horário de término para envio de mensagens automáticas'),
('pausar_em_feriados', 'true', 'Pausar envios automáticos em feriados'),
('pausar_finais_semana', 'false', 'Pausar envios automáticos aos fins de semana')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- ============================================
-- VIEWS PARA RELATÓRIOS
-- ============================================

-- View: Estatísticas de Sequências
CREATE OR REPLACE VIEW v_followup_estatisticas AS
SELECT 
  s.id as sequencia_id,
  s.nome as sequencia_nome,
  s.fase_inicio,
  COUNT(DISTINCT fl.id) as total_leads,
  COUNT(DISTINCT CASE WHEN fl.status = 'ativo' THEN fl.id END) as leads_ativos,
  COUNT(DISTINCT CASE WHEN fl.status = 'concluido' THEN fl.id END) as leads_concluidos,
  COUNT(DISTINCT CASE WHEN fl.status = 'pausado' THEN fl.id END) as leads_pausados,
  COUNT(DISTINCT CASE WHEN fl.status = 'cancelado' THEN fl.id END) as leads_cancelados,
  COUNT(h.id) as total_mensagens_enviadas,
  COUNT(CASE WHEN h.status_envio = 'sucesso' THEN 1 END) as mensagens_sucesso,
  COUNT(CASE WHEN h.status_envio = 'falha' THEN 1 END) as mensagens_falha
FROM followup_sequencias s
LEFT JOIN followup_leads fl ON s.id = fl.sequencia_id
LEFT JOIN followup_historico h ON fl.id = h.followup_lead_id
GROUP BY s.id, s.nome, s.fase_inicio;

-- View: Próximos Envios Programados
CREATE OR REPLACE VIEW v_followup_proximos_envios AS
SELECT 
  fl.id as followup_lead_id,
  l.id as lead_id,
  l.nome as lead_nome,
  l.telefone as lead_telefone,
  s.nome as sequencia_nome,
  fm.conteudo as mensagem_conteudo,
  fm.tipo_mensagem,
  fl.data_proxima_mensagem,
  fl.mensagem_atual,
  s.fase_inicio
FROM followup_leads fl
JOIN leads l ON fl.lead_id = l.id
JOIN followup_sequencias s ON fl.sequencia_id = s.id
JOIN followup_mensagens fm ON s.id = fm.sequencia_id AND fm.ordem = fl.mensagem_atual
WHERE fl.status = 'ativo'
  AND fl.data_proxima_mensagem IS NOT NULL
ORDER BY fl.data_proxima_mensagem ASC;

-- ============================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ============================================

-- Sequência de exemplo: Reativação de Cotação
INSERT INTO followup_sequencias (nome, descricao, fase_inicio, ativo, automatico, prioridade, criado_por) 
SELECT 
  'Reativação de Cotação',
  'Sequência para reengajar leads que pararam de responder após o primeiro contato',
  'primeiro_contato',
  TRUE,
  TRUE,
  1,
  id
FROM consultores LIMIT 1;

-- Mensagens da sequência de exemplo
INSERT INTO followup_mensagens (sequencia_id, ordem, dias_espera, conteudo, tipo_mensagem, ativo)
SELECT 
  id,
  1,
  2,
  'Oi! Tudo bem? 👋 Vi que conversamos sobre a proteção do seu veículo. Ficou com alguma dúvida? Estou aqui para ajudar! 😊',
  'texto',
  TRUE
FROM followup_sequencias WHERE nome = 'Reativação de Cotação';

INSERT INTO followup_mensagens (sequencia_id, ordem, dias_espera, conteudo, tipo_mensagem, ativo)
SELECT 
  id,
  2,
  5,
  'Olá! 🚗 Preparei uma proposta especial para você com condições exclusivas. Podemos conversar sobre isso?',
  'texto',
  TRUE
FROM followup_sequencias WHERE nome = 'Reativação de Cotação';

INSERT INTO followup_mensagens (sequencia_id, ordem, dias_espera, conteudo, tipo_mensagem, ativo)
SELECT 
  id,
  3,
  7,
  '⚠️ Última chance! A oferta especial que preparei para você expira em breve. Não perca essa oportunidade de proteger seu veículo! 🔐',
  'texto',
  TRUE
FROM followup_sequencias WHERE nome = 'Reativação de Cotação';
