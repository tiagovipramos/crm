const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function executarTriggersReversao() {
  let connection;

  try {
    console.log('========================================');
    console.log('EXECUTAR TRIGGERS DE REVERSÃO');
    console.log('========================================');
    console.log('');

    // Conectar ao banco
    console.log('📡 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'protecar_crm',
      multipleStatements: true
    });
    console.log('✅ Conectado com sucesso!');
    console.log('');

    // Remover triggers antigos se existirem
    console.log('🗑️ Removendo triggers antigos (se existirem)...');
    console.log('');
    
    const triggersParaRemover = [
      'trigger_reversao_para_proposta',
      'trigger_reversao_para_convertido'
    ];

    for (const trigger of triggersParaRemover) {
      try {
        await connection.execute(`DROP TRIGGER IF EXISTS ${trigger}`);
        console.log(`  ✅ ${trigger} removido (se existia)`);
      } catch (error) {
        console.log(`  ⚠️ ${trigger} não existia`);
      }
    }

    console.log('');
    console.log('⚙️ Criando novos triggers...');
    console.log('');

    // Trigger 1: Reversão para proposta
    await connection.query(`
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
        
        IF NEW.indicacao_id IS NOT NULL 
           AND (OLD.status = 'nao_solicitado' OR OLD.status = 'engano' OR OLD.status = 'perdido')
           AND NEW.status = 'proposta_enviada' THEN
          
          SELECT id, indicador_id, comissao_resposta, status
          INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
          FROM indicacoes 
          WHERE id = NEW.indicacao_id 
            AND status IN ('perdido', 'engano')
          LIMIT 1;
          
          IF v_indicacao_id IS NOT NULL THEN
            SELECT saldo_perdido, saldo_disponivel 
            INTO v_saldo_perdido_anterior, v_saldo_disponivel_anterior
            FROM indicadores WHERE id = v_indicador_id;
            
            UPDATE indicacoes 
            SET status = 'respondeu', data_resposta = CURRENT_TIMESTAMP 
            WHERE id = v_indicacao_id;
            
            UPDATE indicadores 
            SET 
              saldo_perdido = saldo_perdido - v_comissao,
              saldo_disponivel = saldo_disponivel + v_comissao,
              indicacoes_respondidas = indicacoes_respondidas + 1
            WHERE id = v_indicador_id;
            
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
      END
    `);
    console.log('  ✅ trigger_reversao_para_proposta criado');

    // Trigger 2: Reversão para convertido
    await connection.query(`
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
        
        IF NEW.indicacao_id IS NOT NULL 
           AND (OLD.status = 'nao_solicitado' OR OLD.status = 'engano' OR OLD.status = 'perdido')
           AND NEW.status = 'convertido' THEN
          
          SELECT id, indicador_id, comissao_resposta, comissao_venda, status
          INTO v_indicacao_id, v_indicador_id, v_comissao_resposta, v_comissao_venda, v_status_indicacao
          FROM indicacoes 
          WHERE id = NEW.indicacao_id 
            AND status IN ('perdido', 'engano')
          LIMIT 1;
          
          IF v_indicacao_id IS NOT NULL THEN
            SELECT saldo_perdido, saldo_disponivel 
            INTO v_saldo_perdido_anterior, v_saldo_disponivel_anterior
            FROM indicadores WHERE id = v_indicador_id;
            
            UPDATE indicacoes 
            SET status = 'converteu', 
                data_resposta = CURRENT_TIMESTAMP,
                data_conversao = CURRENT_TIMESTAMP 
            WHERE id = v_indicacao_id;
            
            UPDATE indicadores 
            SET 
              saldo_perdido = saldo_perdido - v_comissao_resposta,
              saldo_disponivel = saldo_disponivel + v_comissao_resposta + v_comissao_venda,
              indicacoes_respondidas = indicacoes_respondidas + 1,
              indicacoes_convertidas = indicacoes_convertidas + 1,
              vendas_para_proxima_caixa = COALESCE(vendas_para_proxima_caixa, 0) + 1
            WHERE id = v_indicador_id;
            
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
      END
    `);
    console.log('  ✅ trigger_reversao_para_convertido criado');

    console.log('');
    console.log('✅ Todos os triggers foram criados com sucesso!');
    console.log('');

    // Verificar triggers instalados
    console.log('🔍 Verificando triggers instalados...');
    console.log('');
    const [triggers] = await connection.execute(
      `SHOW TRIGGERS WHERE \`Table\` = 'leads' AND Trigger LIKE '%reversao%'`
    );

    console.log('📊 Triggers de reversão instalados:');
    console.log('──────────────────────────────────────────────────');
    triggers.forEach(t => console.log(`✅ ${t.Trigger}`));
    console.log('──────────────────────────────────────────────────');
    console.log('');

    console.log('🎉 SUCESSO! Triggers de reversão ativados!');
    console.log('');
    console.log('Agora você pode corrigir leads marcados incorretamente:');
    console.log('  → "Não Solicitado" → "Cotação": Saldo volta para disponível');
    console.log('  → "Engano" → "Venda": Saldo + comissão vão para disponível');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERRO:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

executarTriggersReversao();
