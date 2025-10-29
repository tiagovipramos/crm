const mysql = require('mysql2/promise');

async function verificarMigrations() {
  console.log('🔍 Verificando migrations...\n');

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'protecar_crm'
    });

    console.log('✅ Conectado ao MySQL\n');

    // Verificar se a coluna tipo_api_whatsapp existe
    console.log('[1/2] Verificando coluna tipo_api_whatsapp...');
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM consultores LIKE 'tipo_api_whatsapp'"
    );

    if (columns.length > 0) {
      console.log('✅ Coluna tipo_api_whatsapp existe!');
    } else {
      console.log('❌ Coluna tipo_api_whatsapp NÃO existe!');
    }

    // Verificar se a tabela whatsapp_oficial_config existe
    console.log('\n[2/2] Verificando tabela whatsapp_oficial_config...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'whatsapp_oficial_config'"
    );

    if (tables.length > 0) {
      console.log('✅ Tabela whatsapp_oficial_config existe!');
    } else {
      console.log('❌ Tabela whatsapp_oficial_config NÃO existe!');
    }

    await connection.end();

    console.log('\n========================================');
    if (columns.length > 0 && tables.length > 0) {
      console.log('✅ Todas as migrations foram aplicadas!');
      console.log('========================================\n');
      console.log('Agora você pode:\n');
      console.log('1. Recarregar a página do CRM (F5)');
      console.log('2. Escolher entre API Oficial e Não Oficial\n');
    } else {
      console.log('⚠️ Algumas migrations estão faltando!');
      console.log('========================================\n');
      console.log('Execute: node backend/executar-migrations.js\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

verificarMigrations();
