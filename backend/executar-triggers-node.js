/**
 * Script para executar a migration de triggers via Node.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executarMigration() {
  console.log('========================================');
  console.log('EXECUTAR TRIGGERS DE COMISSÃO');
  console.log('========================================');
  console.log('');

  let connection;

  try {
    // Conectar ao banco de dados
    console.log('📡 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'protecar_crm',
      multipleStatements: true
    });

    console.log('✅ Conectado com sucesso!\n');

    // Remover triggers antigos
    console.log('🗑️ Removendo triggers antigos...\n');
    const triggersAntigos = [
      'trigger_comissao_resposta',
      'trigger_comissao_conversao',
      'trigger_lead_engano',
      'trigger_comissao_proposta_enviada',
      'trigger_lead_nao_solicitado',
      'trigger_lead_perdido'
    ];

    for (const trigger of triggersAntigos) {
      try {
        await connection.query(`DROP TRIGGER IF EXISTS ${trigger}`);
        console.log(`  ✅ ${trigger} removido`);
      } catch (err) {
        console.log(`  ⚠️ ${trigger} não existe`);
      }
    }

    console.log('\n⚙️ Criando novos triggers...\n');

    // TRIGGER 1: Cotação Enviada
    await connection.query(`
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
        
        IF NEW.indicacao_id IS NOT NULL 
           AND OLD.status != 'proposta_enviada' 
           AND NEW.status = 'proposta_enviada' THEN
          
          SELECT id, indicador_id, comissao_resposta, status
          INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
          FROM indicacoes 
          WHERE id = NEW.indicacao_id 
            AND status IN ('pendente', 'enviado_crm')
          LIMIT 1;
          
          IF v_indicacao_id IS NOT NULL THEN
            SELECT saldo_bloqueado, saldo_disponivel 
            INTO v_saldo_bloqueado_anterior, v_saldo_disponivel_anterior
            FROM indicadores WHERE id = v_indicador_id;
            
            UPDATE indicacoes 
            SET status = 'respondeu', data_resposta = CURRENT_TIMESTAMP 
            WHERE id = v_indicacao_id;
            
            UPDATE indicadores 
            SET 
              saldo_bloqueado = saldo_bloqueado - v_comissao,
              saldo_disponivel = saldo_disponivel + v_comissao,
              indicacoes_respondidas = indicacoes_respondidas + 1
            WHERE id = v_indicador_id;
            
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
      END
    `);
    console.log('  ✅ trigger_comissao_proposta_enviada criado');

    // TRIGGER 2: Conversão
    await connection.query(`
      CREATE TRIGGER trigger_comissao_conversao
      AFTER UPDATE ON leads
      FOR EACH ROW
      BEGIN
        DECLARE v_indicacao_id VARCHAR(36);
        DECLARE v_indicador_id VARCHAR(36);
        DECLARE v_comissao DECIMAL(10,2);
        DECLARE v_saldo_anterior DECIMAL(10,2);
        DECLARE v_status_indicacao VARCHAR(50);
        
        IF NEW.indicacao_id IS NOT NULL 
           AND OLD.status != 'convertido' 
           AND NEW.status = 'convertido' THEN
          
          SELECT id, indicador_id, comissao_venda, status
          INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
          FROM indicacoes 
          WHERE id = NEW.indicacao_id 
            AND status = 'respondeu'
          LIMIT 1;
          
          IF v_indicacao_id IS NOT NULL THEN
            SELECT saldo_disponivel INTO v_saldo_anterior 
            FROM indicadores WHERE id = v_indicador_id;
            
            UPDATE indicacoes 
            SET status = 'converteu', data_conversao = CURRENT_TIMESTAMP 
            WHERE id = v_indicacao_id;
            
            UPDATE indicadores 
            SET 
              saldo_disponivel = saldo_disponivel + v_comissao,
              indicacoes_convertidas = indicacoes_convertidas + 1,
              vendas_para_proxima_caixa = COALESCE(vendas_para_proxima_caixa, 0) + 1
            WHERE id = v_indicador_id;
            
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
      END
    `);
    console.log('  ✅ trigger_comissao_conversao criado');

    // TRIGGER 3: Não Solicitado
    await connection.query(`
      CREATE TRIGGER trigger_lead_nao_solicitado
      AFTER UPDATE ON leads
      FOR EACH ROW
      BEGIN
        DECLARE v_indicacao_id VARCHAR(36);
        DECLARE v_indicador_id VARCHAR(36);
        DECLARE v_comissao DECIMAL(10,2);
        DECLARE v_saldo_bloqueado_anterior DECIMAL(10,2);
        DECLARE v_status_indicacao VARCHAR(50);
        
        IF NEW.indicacao_id IS NOT NULL 
           AND OLD.status != 'nao_solicitado' 
           AND NEW.status = 'nao_solicitado' THEN
          
          SELECT id, indicador_id, comissao_resposta, status
          INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
          FROM indicacoes 
          WHERE id = NEW.indicacao_id 
            AND status IN ('pendente', 'enviado_crm')
          LIMIT 1;
          
          IF v_indicacao_id IS NOT NULL THEN
            SELECT saldo_bloqueado 
            INTO v_saldo_bloqueado_anterior
            FROM indicadores WHERE id = v_indicador_id;
            
            UPDATE indicacoes 
            SET status = 'perdido' 
            WHERE id = v_indicacao_id;
            
            UPDATE indicadores 
            SET 
              saldo_bloqueado = saldo_bloqueado - v_comissao,
              saldo_perdido = saldo_perdido + v_comissao
            WHERE id = v_indicador_id;
            
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
      END
    `);
    console.log('  ✅ trigger_lead_nao_solicitado criado');

    // TRIGGER 4: Perdido
    await connection.query(`
      CREATE TRIGGER trigger_lead_perdido
      AFTER UPDATE ON leads
      FOR EACH ROW
      BEGIN
        DECLARE v_indicacao_id VARCHAR(36);
        DECLARE v_indicador_id VARCHAR(36);
        DECLARE v_comissao DECIMAL(10,2);
        DECLARE v_saldo_bloqueado_anterior DECIMAL(10,2);
        DECLARE v_status_indicacao VARCHAR(50);
        
        IF NEW.indicacao_id IS NOT NULL 
           AND OLD.status != 'perdido' 
           AND NEW.status = 'perdido' THEN
          
          SELECT id, indicador_id, comissao_resposta, status
          INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
          FROM indicacoes 
          WHERE id = NEW.indicacao_id 
            AND status IN ('pendente', 'enviado_crm')
          LIMIT 1;
          
          IF v_indicacao_id IS NOT NULL THEN
            SELECT saldo_bloqueado 
            INTO v_saldo_bloqueado_anterior
            FROM indicadores WHERE id = v_indicador_id;
            
            UPDATE indicacoes 
            SET status = 'perdido' 
            WHERE id = v_indicacao_id;
            
            UPDATE indicadores 
            SET 
              saldo_bloqueado = saldo_bloqueado - v_comissao,
              saldo_perdido = saldo_perdido + v_comissao
            WHERE id = v_indicador_id;
            
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
      END
    `);
    console.log('  ✅ trigger_lead_perdido criado');

    // TRIGGER 5: Engano
    await connection.query(`
      CREATE TRIGGER trigger_lead_engano
      AFTER UPDATE ON leads
      FOR EACH ROW
      BEGIN
        DECLARE v_indicacao_id VARCHAR(36);
        DECLARE v_indicador_id VARCHAR(36);
        DECLARE v_comissao DECIMAL(10,2);
        DECLARE v_saldo_bloqueado_anterior DECIMAL(10,2);
        DECLARE v_status_indicacao VARCHAR(50);
        
        IF NEW.indicacao_id IS NOT NULL 
           AND OLD.status != 'engano' 
           AND NEW.status = 'engano' THEN
          
          SELECT id, indicador_id, comissao_resposta, status
          INTO v_indicacao_id, v_indicador_id, v_comissao, v_status_indicacao
          FROM indicacoes 
          WHERE id = NEW.indicacao_id 
            AND status IN ('pendente', 'enviado_crm')
          LIMIT 1;
          
          IF v_indicacao_id IS NOT NULL THEN
            SELECT saldo_bloqueado 
            INTO v_saldo_bloqueado_anterior
            FROM indicadores WHERE id = v_indicador_id;
            
            UPDATE indicacoes 
            SET status = 'engano' 
            WHERE id = v_indicacao_id;
            
            UPDATE indicadores 
            SET 
              saldo_bloqueado = saldo_bloqueado - v_comissao,
              saldo_perdido = saldo_perdido + v_comissao
            WHERE id = v_indicador_id;
            
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
      END
    `);
    console.log('  ✅ trigger_lead_engano criado');

    console.log('\n✅ Todos os triggers foram criados com sucesso!\n');

    // Verificar triggers instalados
    console.log('🔍 Verificando triggers instalados...\n');
    const [triggers] = await connection.query(`
      SHOW TRIGGERS WHERE \`Table\` = 'leads'
    `);

    console.log('📊 Triggers instalados:');
    console.log('─'.repeat(50));
    triggers.forEach(t => {
      console.log(`✅ ${t.Trigger}`);
    });
    console.log('─'.repeat(50));
    console.log('');

    console.log('🎉 SUCESSO! Sistema de comissão instantânea ativado!');
    console.log('');
    console.log('Agora quando o vendedor mover um lead:');
    console.log('  → Para "Cotação Enviada": Saldo fica disponível');
    console.log('  → Para "Não Solicitado": Saldo vai para perdido');
    console.log('  → Para "Convertido": Adiciona R$ 20,00 de comissão');
    console.log('');

  } catch (error) {
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

// Executar
executarMigration();
