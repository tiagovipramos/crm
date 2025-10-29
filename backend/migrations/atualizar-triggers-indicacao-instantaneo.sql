-- =========================================
-- ATUALIZAÇÃO DE TRIGGERS PARA COMISSÃO INSTANTÂNEA
-- =========================================
-- Esta migration atualiza os triggers para que:
-- 1. Quando o lead for movido para "proposta_enviada" (Cotação Enviada), 
--    o saldo sai de bloqueado para disponível
-- 2. Quando o lead for movido para "nao_solicitado" (Não Solicitado),
--    o saldo vai para perdido
-- =========================================

-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS trigger_comissao_resposta;
DROP TRIGGER IF EXISTS trigger_comissao_conversao;
DROP TRIGGER IF EXISTS trigger_lead_engano;

-- =========================================
-- TRIGGER 1: Comissão quando lead for para "Cotação Enviada"
-- Move saldo de BLOQUEADO para DISPONÍVEL
-- =========================================
DELIMITER $$

CREATE TRIGGER trigger_comissao_proposta_enviada
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_bloqueado_anterior DECIMAL(10,2);
  DECLARE v_saldo_disponivel_anterior DECIMAL(10,2);
  DECLARE v_status_indicacao VARCHAR(50);
  
  -- Verificar se o lead tem indicação e mudou para "proposta_enviada"
  IF NEW.indicacao_id IS NOT NULL 
     AND OLD.status != 'proposta_enviada' 
     AND NEW.status = 'proposta_enviada' THEN
    
    -- Buscar dados da indicação (apenas se ainda não foi respondida)
    SELECT id, indicador_id, comissao_resposta, status
    INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id 
      AND status IN ('pendente', 'enviado_crm')
    LIMIT 1;
    
    -- Se a indicação existe e ainda está pendente/enviada ao CRM
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldos anteriores
      SELECT saldo_bloqueado, saldo_disponivel 
      INTO v_saldo_bloqueado_anterior, v_saldo_disponivel_anterior
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação para "respondeu"
      UPDATE indicacoes 
      SET status = 'respondeu', data_resposta = CURRENT_TIMESTAMP 
      WHERE id = v_indicacao_id;
      
      -- Mover saldo de BLOQUEADO para DISPONÍVEL
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
        v_saldo_disponivel_anterior, v_saldo_disponivel_anterior + v_comissao,
        CONCAT('✅ Comissão liberada - Lead movido para Cotação Enviada: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- TRIGGER 2: Comissão quando lead CONVERTER
-- Adiciona comissão de VENDA ao saldo disponível
-- =========================================
DELIMITER $$

CREATE TRIGGER trigger_comissao_conversao
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_anterior DECIMAL(10,2);
  DECLARE v_status_indicacao VARCHAR(50);
  
  -- Verificar se o lead converteu
  IF NEW.indicacao_id IS NOT NULL 
     AND OLD.status != 'convertido' 
     AND NEW.status = 'convertido' THEN
    
    -- Buscar dados da indicação (apenas se já respondeu)
    SELECT id, indicador_id, comissao_venda, status
    INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id 
      AND status = 'respondeu'
    LIMIT 1;
    
    -- Se a indicação existe e já foi respondida
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior
      SELECT saldo_disponivel INTO v_saldo_anterior 
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação para "converteu"
      UPDATE indicacoes 
      SET status = 'converteu', data_conversao = CURRENT_TIMESTAMP 
      WHERE id = v_indicacao_id;
      
      -- Adicionar comissão de venda ao saldo disponível
      UPDATE indicadores 
      SET 
        saldo_disponivel = saldo_disponivel + v_comissao,
        indicacoes_convertidas = indicacoes_convertidas + 1,
        vendas_para_proxima_caixa = COALESCE(vendas_para_proxima_caixa, 0) + 1
      WHERE id = v_indicador_id;
      
      -- Registrar transação
      INSERT INTO transacoes_indicador (
        id, indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        UUID(), v_indicador_id, v_indicacao_id, 'liberacao', v_comissao,
        v_saldo_anterior, v_saldo_anterior + v_comissao,
        CONCAT('💰 Comissão de VENDA - Lead convertido: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- TRIGGER 3: Quando lead for para "Não Solicitado"
-- Move saldo de BLOQUEADO para PERDIDO
-- =========================================
DELIMITER $$

CREATE TRIGGER trigger_lead_nao_solicitado
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_bloqueado_anterior DECIMAL(10,2);
  DECLARE v_status_indicacao VARCHAR(50);
  
  -- Verificar se foi marcado como "não solicitado"
  IF NEW.indicacao_id IS NOT NULL 
     AND OLD.status != 'nao_solicitado' 
     AND NEW.status = 'nao_solicitado' THEN
    
    -- Buscar dados da indicação (apenas se ainda pendente/enviada)
    SELECT id, indicador_id, comissao_resposta, status
    INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id 
      AND status IN ('pendente', 'enviado_crm')
    LIMIT 1;
    
    -- Se a indicação existe e ainda está pendente/enviada
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior
      SELECT saldo_bloqueado 
      INTO v_saldo_bloqueado_anterior
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação para "perdido"
      UPDATE indicacoes 
      SET status = 'perdido' 
      WHERE id = v_indicacao_id;
      
      -- Mover saldo de BLOQUEADO para PERDIDO
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
        v_saldo_bloqueado_anterior, v_saldo_bloqueado_anterior - v_comissao,
        CONCAT('❌ Comissão perdida - Lead marcado como Não Solicitado: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- TRIGGER 4: Quando lead for para "Perdido"
-- Move saldo de BLOQUEADO para PERDIDO (se ainda tiver)
-- =========================================
DELIMITER $$

CREATE TRIGGER trigger_lead_perdido
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_bloqueado_anterior DECIMAL(10,2);
  DECLARE v_status_indicacao VARCHAR(50);
  
  -- Verificar se foi marcado como "perdido"
  IF NEW.indicacao_id IS NOT NULL 
     AND OLD.status != 'perdido' 
     AND NEW.status = 'perdido' THEN
    
    -- Buscar dados da indicação (apenas se ainda pendente/enviada)
    SELECT id, indicador_id, comissao_resposta, status
    INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id 
      AND status IN ('pendente', 'enviado_crm')
    LIMIT 1;
    
    -- Se a indicação existe e ainda está pendente/enviada
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior
      SELECT saldo_bloqueado 
      INTO v_saldo_bloqueado_anterior
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação para "perdido"
      UPDATE indicacoes 
      SET status = 'perdido' 
      WHERE id = v_indicacao_id;
      
      -- Mover saldo de BLOQUEADO para PERDIDO
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
        v_saldo_bloqueado_anterior, v_saldo_bloqueado_anterior - v_comissao,
        CONCAT('❌ Comissão perdida - Lead marcado como Perdido: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- TRIGGER 5: Quando lead for para "Engano"
-- Move saldo de BLOQUEADO para PERDIDO
-- =========================================
DELIMITER $$

CREATE TRIGGER trigger_lead_engano
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_bloqueado_anterior DECIMAL(10,2);
  DECLARE v_status_indicacao VARCHAR(50);
  
  -- Verificar se foi marcado como "engano"
  IF NEW.indicacao_id IS NOT NULL 
     AND OLD.status != 'engano' 
     AND NEW.status = 'engano' THEN
    
    -- Buscar dados da indicação (apenas se ainda pendente/enviada)
    SELECT id, indicador_id, comissao_resposta, status
    INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id 
      AND status IN ('pendente', 'enviado_crm')
    LIMIT 1;
    
    -- Se a indicação existe e ainda está pendente/enviada
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldo anterior
      SELECT saldo_bloqueado 
      INTO v_saldo_bloqueado_anterior
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação para "engano"
      UPDATE indicacoes 
      SET status = 'engano' 
      WHERE id = v_indicacao_id;
      
      -- Mover saldo de BLOQUEADO para PERDIDO
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
        v_saldo_bloqueado_anterior, v_saldo_bloqueado_anterior - v_comissao,
        CONCAT('❌ Comissão perdida - Lead marcado como Engano: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- VERIFICAÇÃO
-- =========================================
SELECT 'Triggers de comissão instantânea atualizados com sucesso!' AS status;
SHOW TRIGGERS WHERE `Table` = 'leads';
