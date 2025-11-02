-- =========================================
-- MÓDULO DE INDICAÇÕES - SCHEMA
-- =========================================

-- =========================================
-- TABELA: indicadores
-- =========================================
CREATE TABLE IF NOT EXISTS indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  saldo_disponivel DECIMAL(10,2) DEFAULT 0.00,
  saldo_bloqueado DECIMAL(10,2) DEFAULT 0.00,
  saldo_perdido DECIMAL(10,2) DEFAULT 0.00,
  total_indicacoes INTEGER DEFAULT 0,
  indicacoes_respondidas INTEGER DEFAULT 0,
  indicacoes_convertidas INTEGER DEFAULT 0,
  pix_chave VARCHAR(255),
  pix_tipo VARCHAR(20) CHECK (pix_tipo IN ('cpf', 'email', 'telefone', 'aleatorio')),
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso TIMESTAMP
);

-- =========================================
-- TABELA: indicacoes
-- =========================================
CREATE TABLE IF NOT EXISTS indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id UUID NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  nome_indicado VARCHAR(255) NOT NULL,
  telefone_indicado VARCHAR(20) NOT NULL,
  whatsapp_validado BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado_crm', 'respondeu', 'converteu', 'engano', 'perdido')),
  comissao_resposta DECIMAL(10,2) DEFAULT 2.00,
  comissao_venda DECIMAL(10,2) DEFAULT 20.00,
  data_indicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_resposta TIMESTAMP,
  data_conversao TIMESTAMP,
  data_validacao_whatsapp TIMESTAMP
);

-- =========================================
-- TABELA: transacoes_indicador
-- =========================================
CREATE TABLE IF NOT EXISTS transacoes_indicador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id UUID NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  indicacao_id UUID REFERENCES indicacoes(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('bloqueio', 'liberacao', 'perda', 'saque', 'estorno')),
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_novo DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABELA: saques_indicador
-- =========================================
CREATE TABLE IF NOT EXISTS saques_indicador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id UUID NOT NULL REFERENCES indicadores(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  pix_chave VARCHAR(255) NOT NULL,
  pix_tipo VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'aprovado', 'pago', 'rejeitado', 'cancelado')),
  comprovante_url TEXT,
  data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_pagamento TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacoes TEXT
);

-- =========================================
-- ADICIONAR COLUNAS NA TABELA LEADS
-- =========================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS indicador_id UUID REFERENCES indicadores(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS indicacao_id UUID REFERENCES indicacoes(id) ON DELETE SET NULL;

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
-- FUNÇÃO: Atualizar último acesso do indicador
-- =========================================
CREATE OR REPLACE FUNCTION update_ultimo_acesso_indicador()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE indicadores 
  SET ultimo_acesso = CURRENT_TIMESTAMP 
  WHERE id = NEW.indicador_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar último acesso quando indicador fizer algo
CREATE TRIGGER trigger_update_ultimo_acesso_indicacao
AFTER INSERT ON indicacoes
FOR EACH ROW
EXECUTE FUNCTION update_ultimo_acesso_indicador();

-- =========================================
-- FUNÇÃO: Processar comissão quando lead responder
-- =========================================
CREATE OR REPLACE FUNCTION processar_comissao_resposta()
RETURNS TRIGGER AS $$
DECLARE
  v_indicacao_id UUID;
  v_indicador_id UUID;
  v_comissao DECIMAL(10,2);
  v_saldo_anterior DECIMAL(10,2);
BEGIN
  -- Verificar se o lead tem indicação associada
  IF NEW.indicacao_id IS NOT NULL AND OLD.status = 'novo' AND NEW.status != 'novo' THEN
    
    -- Buscar dados da indicação
    SELECT id, indicador_id, comissao_resposta 
    INTO v_indicacao_id, v_indicador_id, v_comissao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id AND status = 'enviado_crm';
    
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior do indicador
      SELECT saldo_bloqueado INTO v_saldo_anterior FROM indicadores WHERE id = v_indicador_id;
      
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
        indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        v_indicador_id, v_indicacao_id, 'liberacao', v_comissao,
        v_saldo_anterior, v_saldo_anterior - v_comissao + v_comissao,
        'Comissão por resposta do lead: ' || NEW.nome
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar comissão de resposta
CREATE TRIGGER trigger_comissao_resposta
AFTER UPDATE OF status ON leads
FOR EACH ROW
EXECUTE FUNCTION processar_comissao_resposta();

-- =========================================
-- FUNÇÃO: Processar comissão quando lead converter
-- =========================================
CREATE OR REPLACE FUNCTION processar_comissao_conversao()
RETURNS TRIGGER AS $$
DECLARE
  v_indicacao_id UUID;
  v_indicador_id UUID;
  v_comissao DECIMAL(10,2);
  v_saldo_anterior DECIMAL(10,2);
BEGIN
  -- Verificar se o lead converteu e tem indicação associada
  IF NEW.indicacao_id IS NOT NULL AND NEW.status = 'convertido' AND OLD.status != 'convertido' THEN
    
    -- Buscar dados da indicação
    SELECT id, indicador_id, comissao_venda 
    INTO v_indicacao_id, v_indicador_id, v_comissao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id AND status IN ('respondeu', 'enviado_crm');
    
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior do indicador
      SELECT saldo_disponivel INTO v_saldo_anterior FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação
      UPDATE indicacoes 
      SET status = 'converteu', data_conversao = CURRENT_TIMESTAMP 
      WHERE id = v_indicacao_id;
      
      -- Adicionar comissão de venda ao saldo disponível
      UPDATE indicadores 
      SET 
        saldo_disponivel = saldo_disponivel + v_comissao,
        indicacoes_convertidas = indicacoes_convertidas + 1
      WHERE id = v_indicador_id;
      
      -- Registrar transação
      INSERT INTO transacoes_indicador (
        indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        v_indicador_id, v_indicacao_id, 'liberacao', v_comissao,
        v_saldo_anterior, v_saldo_anterior + v_comissao,
        'Comissão por venda do lead: ' || NEW.nome
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar comissão de conversão
CREATE TRIGGER trigger_comissao_conversao
AFTER UPDATE OF status ON leads
FOR EACH ROW
EXECUTE FUNCTION processar_comissao_conversao();

-- =========================================
-- FUNÇÃO: Processar perda quando lead for engano
-- =========================================
CREATE OR REPLACE FUNCTION processar_lead_engano()
RETURNS TRIGGER AS $$
DECLARE
  v_indicacao_id UUID;
  v_indicador_id UUID;
  v_comissao DECIMAL(10,2);
  v_saldo_anterior DECIMAL(10,2);
BEGIN
  -- Verificar se o lead foi marcado como engano e tem indicação associada
  IF NEW.indicacao_id IS NOT NULL AND NEW.status = 'engano' AND OLD.status != 'engano' THEN
    
    -- Buscar dados da indicação
    SELECT id, indicador_id, comissao_resposta 
    INTO v_indicacao_id, v_indicador_id, v_comissao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id AND status = 'enviado_crm';
    
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior do indicador
      SELECT saldo_bloqueado INTO v_saldo_anterior FROM indicadores WHERE id = v_indicador_id;
      
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
        indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        v_indicador_id, v_indicacao_id, 'perda', v_comissao,
        v_saldo_anterior, v_saldo_anterior - v_comissao,
        'Lead marcado como engano: ' || NEW.nome
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar lead engano
CREATE TRIGGER trigger_lead_engano
AFTER UPDATE OF status ON leads
FOR EACH ROW
EXECUTE FUNCTION processar_lead_engano();

-- =========================================
-- FUNÇÃO: Atualizar data de atualização de saque
-- =========================================
CREATE OR REPLACE FUNCTION update_data_atualizacao_saque()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para saques
CREATE TRIGGER trigger_update_saques
BEFORE UPDATE ON saques_indicador
FOR EACH ROW
EXECUTE FUNCTION update_data_atualizacao_saque();

-- =========================================
-- INSERIR INDICADOR DE TESTE
-- =========================================
-- Senha: 123456 (hash bcrypt)
INSERT INTO indicadores (nome, email, senha, telefone, cpf)
VALUES (
  'João Indicador',
  'joao@indicador.com',
  '$2a$10$rOzJqKZXHjKGzK5fY.pGYO0/dZqN3E5mCpqj5ZCXy9J5QKLKBz1Wm',
  '11987654321',
  '12345678900'
) ON CONFLICT (email) DO NOTHING;

-- =========================================
-- VIEWS ÚTEIS
-- =========================================

-- View: Resumo de indicadores
CREATE OR REPLACE VIEW vw_resumo_indicadores AS
SELECT 
  i.id,
  i.nome,
  i.email,
  i.saldo_disponivel,
  i.saldo_bloqueado,
  i.saldo_perdido,
  i.total_indicacoes,
  i.indicacoes_respondidas,
  i.indicacoes_convertidas,
  CASE 
    WHEN i.total_indicacoes > 0 
    THEN ROUND((i.indicacoes_respondidas::DECIMAL / i.total_indicacoes * 100), 2)
    ELSE 0 
  END AS taxa_resposta,
  CASE 
    WHEN i.indicacoes_respondidas > 0 
    THEN ROUND((i.indicacoes_convertidas::DECIMAL / i.indicacoes_respondidas * 100), 2)
    ELSE 0 
  END AS taxa_conversao,
  i.ativo,
  i.data_criacao
FROM indicadores i;

-- View: Indicações detalhadas
CREATE OR REPLACE VIEW vw_indicacoes_detalhadas AS
SELECT 
  ind.id,
  ind.indicador_id,
  indicador.nome AS indicador_nome,
  ind.nome_indicado,
  ind.telefone_indicado,
  ind.status,
  ind.comissao_resposta,
  ind.comissao_venda,
  ind.data_indicacao,
  ind.data_resposta,
  ind.data_conversao,
  l.id AS lead_id,
  l.nome AS lead_nome,
  l.status AS lead_status,
  c.nome AS consultor_nome
FROM indicacoes ind
LEFT JOIN indicadores indicador ON ind.indicador_id = indicador.id
LEFT JOIN leads l ON ind.lead_id = l.id
LEFT JOIN consultores c ON l.consultor_id = c.id;

-- =========================================
-- VERIFICAR INSTALAÇÃO
-- =========================================
SELECT 'Schema de Indicadores criado com sucesso!' AS status;
SELECT COUNT(*) AS total_indicadores FROM indicadores;
SELECT COUNT(*) AS total_indicacoes FROM indicacoes;
