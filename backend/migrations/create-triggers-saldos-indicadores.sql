-- ============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE SALDOS DOS INDICADORES
-- ============================================
-- Data: 2025-10-31
-- Descrição: Triggers que atualizam automaticamente os saldos dos indicadores
--            quando o status de um lead vinculado a uma indicação muda

USE protecar_crm;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS atualizar_saldos_indicador_after_update;

DELIMITER $$

CREATE TRIGGER atualizar_saldos_indicador_after_update
AFTER UPDATE ON leads
FOR EACH ROW
BEGIN
    DECLARE comissao_resposta DECIMAL(10,2) DEFAULT 2.00;
    DECLARE comissao_venda DECIMAL(10,2) DEFAULT 10.00;
    
    -- Verificar se o lead tem indicação vinculada e se o status mudou
    IF OLD.status != NEW.status AND NEW.indicador_id IS NOT NULL THEN
        
        -- ============================================
        -- CASO 1: Lead mudou para PROPOSTA_ENVIADA (Cotação)
        -- ============================================
        -- Libera R$ 2,00 do saldo_bloqueado para saldo_disponível
        IF NEW.status = 'proposta_enviada' AND OLD.status != 'proposta_enviada' THEN
            
            UPDATE indicadores 
            SET saldo_bloqueado = saldo_bloqueado - comissao_resposta,
                saldo_disponivel = saldo_disponivel + comissao_resposta,
                indicacoes_respondidas = indicacoes_respondidas + 1
            WHERE id = NEW.indicador_id
              AND saldo_bloqueado >= comissao_resposta;
            
            -- Atualizar status da indicação
            UPDATE indicacoes
            SET status = 'respondeu',
                data_resposta = NOW()
            WHERE id = NEW.indicacao_id;
            
            -- Registrar transação
            INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, 
                saldo_anterior, saldo_novo, descricao
            )
            SELECT 
                NEW.indicador_id,
                NEW.indicacao_id,
                'liberacao',
                comissao_resposta,
                saldo_bloqueado + comissao_resposta,
                saldo_bloqueado,
                CONCAT('Comissão liberada - Lead respondeu: ', NEW.nome)
            FROM indicadores 
            WHERE id = NEW.indicador_id;
            
        END IF;
        
        -- ============================================
        -- CASO 2: Lead mudou para CONVERTIDO (Venda Fechada)
        -- ============================================
        -- Adiciona R$ 10,00 ao saldo_disponível + incrementa contador de lootbox
        IF NEW.status = 'convertido' AND OLD.status != 'convertido' THEN
            
            UPDATE indicadores 
            SET saldo_disponivel = saldo_disponivel + comissao_venda,
                indicacoes_convertidas = indicacoes_convertidas + 1,
                vendas_para_proxima_caixa = vendas_para_proxima_caixa + 1
            WHERE id = NEW.indicador_id;
            
            -- Atualizar status da indicação
            UPDATE indicacoes
            SET status = 'converteu',
                comissao_venda = comissao_venda,
                data_conversao = NOW()
            WHERE id = NEW.indicacao_id;
            
            -- Registrar transação
            INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, 
                saldo_anterior, saldo_novo, descricao
            )
            SELECT 
                NEW.indicador_id,
                NEW.indicacao_id,
                'liberacao',
                comissao_venda,
                saldo_disponivel - comissao_venda,
                saldo_disponivel,
                CONCAT('Comissão de venda - Lead converteu: ', NEW.nome)
            FROM indicadores 
            WHERE id = NEW.indicador_id;
            
        END IF;
        
        -- ============================================
        -- CASO 2.1: REVERSÃO - Lead voltou de CONVERTIDO para PROPOSTA_ENVIADA
        -- ============================================
        -- Remove R$ 10,00 do saldo_disponível + decrementa contadores
        IF OLD.status = 'convertido' AND NEW.status = 'proposta_enviada' THEN
            
            UPDATE indicadores 
            SET saldo_disponivel = saldo_disponivel - comissao_venda,
                indicacoes_convertidas = GREATEST(indicacoes_convertidas - 1, 0),
                vendas_para_proxima_caixa = GREATEST(vendas_para_proxima_caixa - 1, 0)
            WHERE id = NEW.indicador_id
              AND saldo_disponivel >= comissao_venda;
            
            -- Atualizar status da indicação de volta para respondeu
            UPDATE indicacoes
            SET status = 'respondeu',
                comissao_venda = 0,
                data_conversao = NULL
            WHERE id = NEW.indicacao_id;
            
            -- Registrar transação de estorno
            INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, 
                saldo_anterior, saldo_novo, descricao
            )
            SELECT 
                NEW.indicador_id,
                NEW.indicacao_id,
                'estorno',
                comissao_venda,
                saldo_disponivel + comissao_venda,
                saldo_disponivel,
                CONCAT('Estorno de venda - Lead voltou para cotação: ', NEW.nome)
            FROM indicadores 
            WHERE id = NEW.indicador_id;
            
        END IF;
        
        -- ============================================
        -- CASO 3: Lead mudou para PERDIDO, NÃO SOLICITADO ou ENGANO
        -- ============================================
        -- Move R$ 2,00 do saldo_bloqueado para saldo_perdido
        IF NEW.status IN ('perdido', 'nao_solicitado', 'engano') 
           AND OLD.status NOT IN ('perdido', 'nao_solicitado', 'engano') THEN
            
            UPDATE indicadores 
            SET saldo_bloqueado = saldo_bloqueado - comissao_resposta,
                saldo_perdido = saldo_perdido + comissao_resposta
            WHERE id = NEW.indicador_id
              AND saldo_bloqueado >= comissao_resposta;
            
            -- Atualizar status da indicação baseado no novo status do lead
            UPDATE indicacoes
            SET status = CASE 
                WHEN NEW.status = 'engano' THEN 'engano'
                ELSE 'perdido'
            END
            WHERE id = NEW.indicacao_id;
            
            -- Registrar transação
            INSERT INTO transacoes_indicador (
                indicador_id, indicacao_id, tipo, valor, 
                saldo_anterior, saldo_novo, descricao
            )
            SELECT 
                NEW.indicador_id,
                NEW.indicacao_id,
                'perda',
                comissao_resposta,
                saldo_bloqueado + comissao_resposta,
                saldo_bloqueado,
                CONCAT('Comissão perdida - Lead ', NEW.status, ': ', NEW.nome)
            FROM indicadores 
            WHERE id = NEW.indicador_id;
            
        END IF;
        
    END IF;
END$$

DELIMITER ;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 'Trigger criado com sucesso!' AS status;

-- Listar triggers da tabela leads
SHOW TRIGGERS WHERE `Table` = 'leads';
