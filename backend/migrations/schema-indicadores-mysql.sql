-- =========================================
-- MÓDULO DE INDICAÇÕES - SCHEMA MYSQL
-- =========================================

-- =========================================
-- TABELA: indicadores
-- =========================================
CREATE TABLE IF NOT EXISTS indicadores (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  saldo_disponivel DECIMAL(10,2) DEFAULT 0.00,
  saldo_bloqueado DECIMAL(10,2) DEFAULT 0.00,
  saldo_perdido DECIMAL(10,2) DEFAULT 0.00,
  total_indicacoes INT DEFAULT 0,
  indicacoes_respondidas INT DEFAULT 0,
  indicacoes_convertidas INT DEFAULT 0,
  pix_chave VARCHAR(255),
  pix_tipo ENUM('cpf', 'email', 'telefone', 'aleatorio'),
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso TIMESTAMP NULL
);

-- =========================================
-- TABELA: indicacoes
-- =========================================
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
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

-- =========================================
-- TABELA: transacoes_indicador
-- =========================================
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
  FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE CASCADE,
  FOREIGN KEY (indicacao_id) REFERENCES indicacoes(id) ON DELETE SET NULL
);

-- =========================================
-- TABELA: saques_indicador
-- =========================================
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
);

-- =========================================
-- ADICIONAR COLUNAS NA TABELA LEADS
-- =========================================
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS indicador_id VARCHAR(36),
ADD COLUMN IF NOT EXISTS indicacao_id VARCHAR(36);

-- Adicionar chaves estrangeiras se não existirem
ALTER TABLE leads
ADD CONSTRAINT fk_leads_indicador 
FOREIGN KEY (indicador_id) REFERENCES indicadores(id) ON DELETE SET NULL;

ALTER TABLE leads
ADD CONSTRAINT fk_leads_indicacao 
FOREIGN KEY (indicacao_id) REFERENCES indicacoes(id) ON DELETE SET NULL;

-- =========================================
-- ÍNDICES para melhor performance
-- =========================================
CREATE INDEX IF NOT EXISTS idx_indicacoes_indicador ON indicacoes(indicador_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_lead ON indicacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_status ON indicacoes(status);
CREATE INDEX IF NOT EXISTS idx_indicacoes_telefone ON indicacoes(telefone_indicado);
CREATE INDEX IF NOT EXISTS idx_transacoes_indicador ON transacoes_indicador(indicador_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_indicador(data_transacao);
CREATE INDEX IF NOT EXISTS idx_saques_indicador ON saques_indicador(indicador_id);
CREATE INDEX IF NOT EXISTS idx_saques_status ON saques_indicador(status);
CREATE INDEX IF NOT EXISTS idx_leads_indicador ON leads(indicador_id);

-- =========================================
-- TRIGGERS: Comissão quando lead responder
-- =========================================
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS trigger_comissao_resposta
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_anterior DECIMAL(10,2);
  
  -- Verificar se o lead tem indicação e mudou de status
  IF NEW.indicacao_id IS NOT NULL AND OLD.status = 'novo' AND NEW.status != 'novo' THEN
    
    -- Buscar dados da indicação
    SELECT id, indicador_id, comissao_resposta 
    INTO v_indicacao_id, v_indicador_id, v_comissao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id AND status = 'enviado_crm'
    LIMIT 1;
    
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior
      SELECT saldo_bloqueado INTO v_saldo_anterior 
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação
      UPDATE indicacoes 
      SET status = 'respondeu', data_resposta = CURRENT_TIMESTAMP 
      WHERE id = v_indicacao_id;
      
      -- Mover saldo de bloqueado para disponível
      UPDATE indicadores 
      SET 
        saldo_bloqueado = saldo_bloqueado - v_comissao,
        saldo_disponivel = saldo_disponivel + v_comissao,
        indicacoes_respondidas = indicacoes_respondidas + 1
      WHERE id = v_indicador_id;
      
      -- Registrar transação
      INSERT INTO transacoes_indicador (
        id, indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        UUID(), v_indicador_id, v_indicacao_id, 'liberacao', v_comissao,
        v_saldo_anterior, v_saldo_anterior - v_comissao + v_comissao,
        CONCAT('Comissão por resposta do lead: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- TRIGGER: Comissão quando lead converter
-- =========================================
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS trigger_comissao_conversao
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_anterior DECIMAL(10,2);
  
  -- Verificar se o lead converteu
  IF NEW.indicacao_id IS NOT NULL AND NEW.status = 'convertido' AND OLD.status != 'convertido' THEN
    
    -- Buscar dados da indicação
    SELECT id, indicador_id, comissao_venda 
    INTO v_indicacao_id, v_indicador_id, v_comissao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id AND status IN ('respondeu', 'enviado_crm')
    LIMIT 1;
    
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior
      SELECT saldo_disponivel INTO v_saldo_anterior 
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação
      UPDATE indicacoes 
      SET status = 'converteu', data_conversao = CURRENT_TIMESTAMP 
      WHERE id = v_indicacao_id;
      
      -- Adicionar comissão de venda
      UPDATE indicadores 
      SET 
        saldo_disponivel = saldo_disponivel + v_comissao,
        indicacoes_convertidas = indicacoes_convertidas + 1
      WHERE id = v_indicador_id;
      
      -- Registrar transação
      INSERT INTO transacoes_indicador (
        id, indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        UUID(), v_indicador_id, v_indicacao_id, 'liberacao', v_comissao,
        v_saldo_anterior, v_saldo_anterior + v_comissao,
        CONCAT('Comissão por venda do lead: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- TRIGGER: Quando lead for engano
-- =========================================
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS trigger_lead_engano
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_anterior DECIMAL(10,2);
  
  -- Verificar se foi marcado como engano
  IF NEW.indicacao_id IS NOT NULL AND NEW.status = 'engano' AND OLD.status != 'engano' THEN
    
    -- Buscar dados da indicação
    SELECT id, indicador_id, comissao_resposta 
    INTO v_indicacao_id, v_indicador_id, v_comissao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id AND status = 'enviado_crm'
    LIMIT 1;
    
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior
      SELECT saldo_bloqueado INTO v_saldo_anterior 
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação
      UPDATE indicacoes 
      SET status = 'engano' 
      WHERE id = v_indicacao_id;
      
      -- Mover saldo de bloqueado para perdido
      UPDATE indicadores 
      SET 
        saldo_bloqueado = saldo_bloqueado - v_comissao,
        saldo_perdido = saldo_perdido + v_comissao
      WHERE id = v_indicador_id;
      
      -- Registrar transação
      INSERT INTO transacoes_indicador (
        id, indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        UUID(), v_indicador_id, v_indicacao_id, 'perda', v_comissao,
        v_saldo_anterior, v_saldo_anterior - v_comissao,
        CONCAT('Lead marcado como engano: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- INSERIR INDICADOR DE TESTE
-- =========================================
-- Senha: 123456 (hash bcrypt)
INSERT INTO indicadores (id, nome, email, senha, telefone, cpf)
VALUES (
  UUID(),
  'João Indicador',
  'joao@indicador.com',
  '$2a$10$rOzJqKZXHjKGzK5fY.pGYO0/dZqN3E5mCpqj5ZCXy9J5QKLKBz1Wm',
  '11987654321',
  '12345678900'
) ON DUPLICATE KEY UPDATE nome=nome;

-- =========================================
-- VERIFICAR INSTALAÇÃO
-- =========================================
SELECT 'Schema de Indicadores criado com sucesso!' AS status;
SELECT COUNT(*) AS total_indicadores FROM indicadores;
SELECT COUNT(*) AS total_indicacoes FROM indicacoes;
