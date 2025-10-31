-- ============================================
-- MIGRAÇÃO: SISTEMA DE FOLLOW-UP INTELIGENTE
-- ============================================
-- Criado em: 31/10/2025
-- Descrição: Cria estrutura completa para automação de follow-up

-- ============================================
-- 1. TABELA: followup_sequencias
-- ============================================
CREATE TABLE IF NOT EXISTS followup_sequencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  fase_inicio ENUM('novo', 'primeiro_contato', 'proposta_enviada', 'convertido', 'perdido') NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  automatico BOOLEAN DEFAULT TRUE,
  prioridade INT DEFAULT 0,
  criado_por INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fase_inicio (fase_inicio),
  INDEX idx_ativo (ativo),
  INDEX idx_automatico (automatico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. TABELA: followup_mensagens
-- ============================================
CREATE TABLE IF NOT EXISTS followup_mensagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequencia_id INT NOT NULL,
  ordem INT NOT NULL,
  dias_espera INT NOT NULL DEFAULT 0,
  conteudo TEXT NOT NULL,
  tipo_mensagem ENUM('texto', 'audio', 'imagem', 'documento') DEFAULT 'texto',
  media_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sequencia_id) REFERENCES followup_sequencias(id) ON DELETE CASCADE,
  INDEX idx_sequencia_ordem (sequencia_id, ordem),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. TABELA: followup_leads
-- ============================================
CREATE TABLE IF NOT EXISTS followup_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  sequencia_id INT NOT NULL,
  mensagem_atual INT DEFAULT 1,
  status ENUM('ativo', 'pausado', 'concluido', 'cancelado') DEFAULT 'ativo',
  data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_proxima_mensagem TIMESTAMP,
  pausado_em TIMESTAMP NULL,
  concluido_em TIMESTAMP NULL,
  motivo_pausa TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sequencia_id) REFERENCES followup_sequencias(id) ON DELETE CASCADE,
  INDEX idx_lead_id (lead_id),
  INDEX idx_status (status),
  INDEX idx_data_proxima (data_proxima_mensagem),
  INDEX idx_lead_sequencia (lead_id, sequencia_id),
  UNIQUE KEY unique_lead_sequencia_ativo (lead_id, sequencia_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. TABELA: followup_historico
-- ============================================
CREATE TABLE IF NOT EXISTS followup_historico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  followup_lead_id INT NOT NULL,
  mensagem_id INT NOT NULL,
  lead_id INT NOT NULL,
  enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status_envio ENUM('sucesso', 'falha', 'pendente') DEFAULT 'pendente',
  erro TEXT,
  FOREIGN KEY (followup_lead_id) REFERENCES followup_leads(id) ON DELETE CASCADE,
  FOREIGN KEY (mensagem_id) REFERENCES followup_mensagens(id) ON DELETE CASCADE,
  INDEX idx_lead_id (lead_id),
  INDEX idx_status_envio (status_envio),
  INDEX idx_enviado_em (enviado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. VIEW: v_followup_estatisticas
-- ============================================
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

-- ============================================
-- 6. VIEW: v_followup_proximos_envios
-- ============================================
CREATE OR REPLACE VIEW v_followup_proximos_envios AS
SELECT 
  fl.id as followup_lead_id,
  fl.lead_id,
  l.nome as lead_nome,
  l.telefone as lead_telefone,
  s.nome as sequencia_nome,
  s.fase_inicio,
  fm.conteudo as mensagem_conteudo,
  fm.tipo_mensagem,
  fl.data_proxima_mensagem,
  fl.mensagem_atual
FROM followup_leads fl
JOIN followup_sequencias s ON fl.sequencia_id = s.id
JOIN followup_mensagens fm ON s.id = fm.sequencia_id AND fm.ordem = fl.mensagem_atual
JOIN leads l ON fl.lead_id = l.id
WHERE fl.status = 'ativo'
  AND fl.data_proxima_mensagem IS NOT NULL
ORDER BY fl.data_proxima_mensagem ASC;

-- ============================================
-- 7. DADOS INICIAIS (SEED)
-- ============================================

-- Sequência de exemplo 1: Follow-up para novos leads
INSERT INTO followup_sequencias (nome, descricao, fase_inicio, ativo, automatico, prioridade, criado_por)
VALUES (
  'Boas-vindas - Novos Leads',
  'Sequência automática de boas-vindas para novos leads que chegam ao sistema',
  'novo',
  TRUE,
  TRUE,
  10,
  1
) ON DUPLICATE KEY UPDATE id=id;

SET @seq1_id = LAST_INSERT_ID();

-- Mensagens da sequência 1
INSERT INTO followup_mensagens (sequencia_id, ordem, dias_espera, conteudo, tipo_mensagem, ativo)
VALUES 
  (@seq1_id, 1, 0, 'Olá! 👋 Obrigado pelo seu interesse na Protecar. Estou aqui para te ajudar a proteger seu veículo. Podemos conversar sobre as opções disponíveis?', 'texto', TRUE),
  (@seq1_id, 2, 1, 'Olá novamente! 😊 Vi que você demonstrou interesse em nossos planos de proteção veicular. Gostaria de saber mais sobre como podemos proteger seu veículo com as melhores condições do mercado?', 'texto', TRUE),
  (@seq1_id, 3, 3, 'Oi! Estou enviando essa mensagem para saber se você ainda tem interesse em conhecer nossos planos de proteção veicular. Temos condições especiais este mês! 🚗✨', 'texto', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Sequência de exemplo 2: Follow-up pós-proposta
INSERT INTO followup_sequencias (nome, descricao, fase_inicio, ativo, automatico, prioridade, criado_por)
VALUES (
  'Acompanhamento de Proposta',
  'Sequência para acompanhar leads após envio da proposta',
  'proposta_enviada',
  TRUE,
  TRUE,
  9,
  1
) ON DUPLICATE KEY UPDATE id=id;

SET @seq2_id = LAST_INSERT_ID();

-- Mensagens da sequência 2
INSERT INTO followup_mensagens (sequencia_id, ordem, dias_espera, conteudo, tipo_mensagem, ativo)
VALUES 
  (@seq2_id, 1, 1, 'Oi! 😊 Você recebeu a proposta que enviei? Ficou com alguma dúvida? Estou à disposição para esclarecer qualquer questão!', 'texto', TRUE),
  (@seq2_id, 2, 2, 'Olá! Apenas passando para saber se você já conseguiu analisar a proposta. Ela está com condições especiais que valem apenas esta semana! 🎯', 'texto', TRUE),
  (@seq2_id, 3, 4, 'Oi! Esta é uma última lembrança sobre a proposta especial que enviei. As condições expiram em breve. Posso ajudar com algo para tomarmos uma decisão? 📋', 'texto', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Sequência de exemplo 3: Reativação de leads perdidos
INSERT INTO followup_sequencias (nome, descricao, fase_inicio, ativo, automatico, prioridade, criado_por)
VALUES (
  'Reativação - Leads Perdidos',
  'Tentar reativar leads que foram marcados como perdidos',
  'perdido',
  TRUE,
  FALSE,
  5,
  1
) ON DUPLICATE KEY UPDATE id=id;

SET @seq3_id = LAST_INSERT_ID();

-- Mensagens da sequência 3
INSERT INTO followup_mensagens (sequencia_id, ordem, dias_espera, conteudo, tipo_mensagem, ativo)
VALUES 
  (@seq3_id, 1, 7, 'Olá! 👋 Percebi que não avançamos com a proteção do seu veículo. Temos novidades e condições que podem te interessar. Podemos conversar?', 'texto', TRUE),
  (@seq3_id, 2, 15, 'Oi! Estamos com uma campanha especial este mês e lembrei de você. Que tal darmos uma nova chance para proteger seu veículo? 🚗💙', 'texto', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
  'Follow-Up instalado com sucesso!' as status,
  (SELECT COUNT(*) FROM followup_sequencias) as total_sequencias,
  (SELECT COUNT(*) FROM followup_mensagens) as total_mensagens;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
