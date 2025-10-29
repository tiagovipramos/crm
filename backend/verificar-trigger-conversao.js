const mysql = require('mysql2/promise');

async function verificarTrigger() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'protecar_crm'
    });
    
    console.log('✅ Conectado!');
    console.log('');
    
    // Verificar trigger de conversão
    console.log('📋 Trigger de conversão:');
    console.log('═══════════════════════════════════════');
    const [triggers] = await connection.query(
      "SHOW CREATE TRIGGER trigger_comissao_conversao"
    );
    
    if (triggers.length > 0) {
      console.log(triggers[0]['SQL Original Statement']);
    } else {
      console.log('❌ Trigger não encontrado!');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (connection) await connection.end();
  }
}

verificarTrigger();
