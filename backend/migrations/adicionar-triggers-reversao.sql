-- =========================================
-- TRIGGERS DE REVERSÃO - Permitir Correção de Status
-- =========================================
-- Estes triggers permitem reverter quando um lead foi marcado 
-- incorretamente como "Não Solicitado" ou "Engano"
-- =========================================

-- =========================================
-- TRIGGER: Reverter "Engano/Perdido" → "Cotação Enviada"
-- Move saldo de PERDIDO para DISPONÍVEL
-- =========================================
DELIMITER $$

CREATE TRIGGER trigger_reversao_para_proposta
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao DECIMAL(10,2);
  DECLARE v_saldo_perdido_anterior DECIMAL(10,2);
  DECLARE v_saldo_disponivel_anterior DECIMAL(10,2);
  DECLARE v_status_indicacao VARCHAR(50);
  
  -- Verificar se mudou DE perdido/engano PARA proposta_enviada
  IF NEW.indicacao_id IS NOT NULL 
     AND (OLD.status = 'nao_solicitado' OR OLD.status = 'engano' OR OLD.status = 'perdido')
     AND NEW.status = 'proposta_enviada' THEN
    
    -- Buscar dados da indicação (agora buscando status perdido/engano)
    SELECT id, indicador_id, comissao_resposta, status
    INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id 
      AND status IN ('perdido', 'engano')
    LIMIT 1;
    
    -- Se a indicação existe e está perdida/engano
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldos anteriores
      SELECT saldo_perdido, saldo_disponivel 
      INTO v_saldo_perdido_anterior, v_saldo_disponivel_anterior
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação para "respondeu"
      UPDATE indicacoes 
      SET status = 'respondeu', data_resposta = CURRENT_TIMESTAMP 
      WHERE id = v_indicacao_id;
      
      -- Mover saldo de PERDIDO para DISPONÍVEL
      UPDATE indicadores 
      SET 
        saldo_perdido = saldo_perdido - v_comissao,
        saldo_disponivel = saldo_disponivel + v_comissao,
        indicacoes_respondidas = indicacoes_respondidas + 1
      WHERE id = v_indicador_id;
      
      -- Registrar transação
      INSERT INTO transacoes_indicador (
        id, indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        UUID(), v_indicador_id, v_indicacao_id, 'reversao', v_comissao,
        v_saldo_disponivel_anterior, v_saldo_disponivel_anterior + v_comissao,
        CONCAT('🔄 CORREÇÃO - Saldo recuperado de perdido para disponível: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- TRIGGER: Reverter "Engano/Perdido" → "Convertido"
-- Move saldo de PERDIDO para DISPONÍVEL + adiciona comissão de venda
-- =========================================
DELIMITER $$

CREATE TRIGGER trigger_reversao_para_convertido
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
  DECLARE v_indicacao_id VARCHAR(36);
  DECLARE v_indicador_id VARCHAR(36);
  DECLARE v_comissao_resposta DECIMAL(10,2);
  DECLARE v_comissao_venda DECIMAL(10,2);
  DECLARE v_saldo_perdido_anterior DECIMAL(10,2);
  DECLARE v_saldo_disponivel_anterior DECIMAL(10,2);
  DECLARE v_status_indicacao VARCHAR(50);
  
  -- Verificar se mudou DE perdido/engano PARA convertido
  IF NEW.indicacao_id IS NOT NULL 
     AND (OLD.status = 'nao_solicitado' OR OLD.status = 'engano' OR OLD.status = 'perdido')
     AND NEW.status = 'convertido' THEN
    
    -- Buscar dados da indicação (buscando status perdido/engano)
    SELECT id, indicador_id, comissao_resposta, comissao_venda, status
    INTO v_indicacao_id, v_indicador_id, v_comissao_resposta, v_comissao_venda, v_status_indicacao
    FROM indicacoes 
    WHERE id = NEW.indicacao_id 
      AND status IN ('perdido', 'engano')
    LIMIT 1;
    
    -- Se a indicação existe e está perdida/engano
    IF v_indicacao_id IS NOT NULL THEN
      -- Buscar saldos anteriores
      SELECT saldo_perdido, saldo_disponivel 
      INTO v_saldo_perdido_anterior, v_saldo_disponivel_anterior
      FROM indicadores WHERE id = v_indicador_id;
      
      -- Atualizar status da indicação para "converteu"
      UPDATE indicacoes 
      SET status = 'converteu', 
          data_resposta = CURRENT_TIMESTAMP,
          data_conversao = CURRENT_TIMESTAMP 
      WHERE id = v_indicacao_id;
      
      -- Mover saldo de PERDIDO para DISPONÍVEL + adicionar comissão de venda
      UPDATE indicadores 
      SET 
        saldo_perdido = saldo_perdido - v_comissao_resposta,
        saldo_disponivel = saldo_disponivel + v_comissao_resposta + v_comissao_venda,
        indicacoes_respondidas = indicacoes_respondidas + 1,
        indicacoes_convertidas = indicacoes_convertidas + 1,
        vendas_para_proxima_caixa = COALESCE(vendas_para_proxima_caixa, 0) + 1
      WHERE id = v_indicador_id;
      
      -- Registrar transação de recuperação
      INSERT INTO transacoes_indicador (
        id, indicador_id, indicacao_id, tipo, valor, 
        saldo_anterior, saldo_novo, descricao
      ) VALUES (
        UUID(), v_indicador_id, v_indicacao_id, 'reversao', v_comissao_resposta + v_comissao_venda,
        v_saldo_disponivel_anterior, v_saldo_disponivel_anterior + v_comissao_resposta + v_comissao_venda,
        CONCAT('🔄 CORREÇÃO + VENDA - Saldo recuperado e comissão de venda adicionada: ', NEW.nome)
      );
    END IF;
  END IF;
END$$

DELIMITER ;

-- =========================================
-- VERIFICAÇÃO
-- =========================================
SELECT '✅ Triggers de reversão criados com sucesso!' AS status;
SELECT 'Agora é possível corrigir leads marcados incorretamente!' AS info;
SHOW TRIGGERS WHERE `Table` = 'leads';
