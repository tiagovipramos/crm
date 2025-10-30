USE protecar_crm;

CREATE TABLE IF NOT EXISTS indicacoes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  indicador_id VARCHAR(36) NOT NULL,
  lead_id VARCHAR(36),
  nome_indicado VARCHAR(255) NOT NULL,
  telefone_indicado VARCHAR(20) NOT NULL,
  whatsapp_validado BOOLEAN DEFAULT FALSE,
  status ENUM('pendente', 'enviado_crm', 'respondeu', 'converteu', 'engano', 'perdido') DEFAULT 'pendente',
  comissao_resposta DECIMAL(10,2) DEFAULT 2.00,
  comissao_venda DECIMAL(10,2) DEFAULT 20.00,
  data_indicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_resposta TIMESTAMP NULL,
  data_conversao TIMESTAMP NULL,
  data_validacao_whatsapp TIMESTAMP NULL,
  INDEX idx_indicador(indicador_id),
  INDEX idx_status(status)
);

CREATE TABLE IF NOT EXISTS transacoes_indicador (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  indicador_id VARCHAR(36) NOT NULL,
  indicacao_id VARCHAR(36),
  tipo ENUM('bloqueio', 'liberacao', 'perda', 'saque', 'estorno') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_novo DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_indicador_transacao(indicador_id)
);

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
  INDEX idx_indicador_saque(indicador_id)
);
