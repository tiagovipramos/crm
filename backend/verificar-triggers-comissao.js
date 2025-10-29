/**
 * Script para verificar se os triggers de comissão estão instalados
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarTriggers() {
  console.log('========================================');
  console.log('VERIFICAÇÃO DOS TRIGGERS DE COMISSÃO');
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
      database: process.env.DB_NAME || 'crm_protecar'
    });

    console.log('✅ Conectado com sucesso!\n');

    // Verificar triggers existentes
    console.log('🔍 Verificando triggers instalados...\n');
    
    const [triggers] = await connection.query(`
      SHOW TRIGGERS WHERE \`Table\` = 'leads'
    `);

    const triggersEsperados = [
      'trigger_comissao_proposta_enviada',
      'trigger_comissao_conversao',
      'trigger_lead_nao_solicitado',
      'trigger_lead_perdido',
      'trigger_lead_engano'
    ];

    const triggersEncontrados = triggers.map(t => t.Trigger);

    console.log('📊 RESULTADO:');
    console.log('─'.repeat(50));

    let todosInstalados = true;

    for (const triggerEsperado of triggersEsperados) {
      const instalado = triggersEncontrados.includes(triggerEsperado);
      const simbolo = instalado ? '✅' : '❌';
      console.log(`${simbolo} ${triggerEsperado}`);
      if (!instalado) todosInstalados = false;
    }

    console.log('─'.repeat(50));
    console.log('');

    if (todosInstalados) {
      console.log('🎉 TODOS OS TRIGGERS ESTÃO INSTALADOS!');
      console.log('');
      console.log('O sistema está configurado corretamente.');
      console.log('Se o saldo não está atualizando, verifique:');
      console.log('  1. Se os leads têm indicacao_id e indicador_id');
      console.log('  2. Se o status das indicações está correto');
      console.log('  3. Os logs do backend ao mover leads');
    } else {
      console.log('⚠️ ATENÇÃO: ALGUNS TRIGGERS NÃO ESTÃO INSTALADOS!');
      console.log('');
      console.log('Para instalar os triggers, execute:');
      console.log('  cd backend');
      console.log('  executar-migration-triggers-comissao.bat');
      console.log('');
      console.log('Ou manualmente:');
      console.log('  mysql -u root -p crm_protecar < migrations/atualizar-triggers-indicacao-instantaneo.sql');
    }

    console.log('');
    console.log('========================================');

    // Verificar se há leads com indicação
    console.log('');
    console.log('🔍 Verificando leads com indicação...\n');
    
    const [leadsComIndicacao] = await connection.query(`
      SELECT COUNT(*) as total FROM leads WHERE indicacao_id IS NOT NULL
    `);

    const totalLeadsComIndicacao = leadsComIndicacao[0].total;
    console.log(`📊 Total de leads com indicação: ${totalLeadsComIndicacao}`);

    if (totalLeadsComIndicacao === 0) {
      console.log('⚠️ Não há leads com indicação no sistema.');
      console.log('   Os triggers só funcionam para leads que vieram de indicações.');
    }

    console.log('');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('');
    console.error('Verifique:');
    console.error('  1. Se o MySQL está rodando');
    console.error('  2. Se as credenciais do .env estão corretas');
    console.error('  3. Se o banco de dados existe');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar verificação
verificarTriggers();
