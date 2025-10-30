-- ============================================
-- CRIAR TABELAS FALTANTES DO SISTEMA DE INDICAÇÃO
-- ============================================

USE protecar_crm;

-- Tabela de transações do indicador
CREATE TABLE IF NOT EXISTS transacoes_indicador (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  indicador_id VARCHAR(36) NOT NULL,
  indicacao_id VARCHAR(36),
  tipo ENUM('bloqueio', 'liberacao', 'perda', 'saque', 'estorno', 'lootbox', 'lootbox_vendas') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_novo DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
  FOREIGN KEY (indicacao_id) REFERENCES indicacoes(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de saques do indicador
CREATE TABLE IF NOT EXISTS saques_indicador (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  indicador_id VARCHAR(36) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  pix_chave VARCHAR(255) NOT NULL,
  pix_tipo VARCHAR(20) NOT NULL,
  status ENUM('solicitado', 'aprovado', 'pago', 'rejeitado', 'cancelado') DEFAULT 'solicitado',
  comprovante_url TEXT,
  data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_pagamento TIMESTAMP NULL,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  observacoes TEXT,
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de prêmios da loot box
CREATE TABLE IF NOT EXISTS lootbox_premios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  peso INT NOT NULL DEFAULT 1,
  emoji VARCHAR(10),
  cor_hex VARCHAR(7),
  ativo BOOLEAN DEFAULT TRUE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de WhatsApp sessions
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  consultor_id VARCHAR(36) NOT NULL,
  session_data TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tabela de cache de validação do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_validacao_cache (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  telefone VARCHAR(20) NOT NULL UNIQUE,
  existe BOOLEAN NOT NULL,
  data_validacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expira_em TIMESTAMP,
  INDEX idx_telefone (telefone),
  INDEX idx_expira (expira_em)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Inserir prêmios padrão na lootbox se a tabela estiver vazia
INSERT INTO lootbox_premios (tipo, valor, peso, emoji, cor_hex, ativo)
SELECT 'Comum', 2.00, 50, '🎁', '#3B82F6', TRUE
WHERE NOT EXISTS (SELECT 1 FROM lootbox_premios WHERE tipo = 'Comum')
UNION ALL
SELECT 'Raro', 5.00, 30, '💎', '#8B5CF6', TRUE
WHERE NOT EXISTS (SELECT 1 FROM lootbox_premios WHERE tipo = 'Raro')
UNION ALL
SELECT 'Épico', 10.00, 15, '🏆', '#F59E0B', TRUE
WHERE NOT EXISTS (SELECT 1 FROM lootbox_premios WHERE tipo = 'Épico')
UNION ALL
SELECT 'Lendário', 20.00, 4, '👑', '#EF4444', TRUE
WHERE NOT EXISTS (SELECT 1 FROM lootbox_premios WHERE tipo = 'Lendário')
UNION ALL
SELECT 'Mítico', 50.00, 1, '⭐', '#10B981', TRUE
WHERE NOT EXISTS (SELECT 1 FROM lootbox_premios WHERE tipo = 'Mítico');

SELECT 'Tabelas criadas com sucesso!' AS status;
