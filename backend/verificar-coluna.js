require('dotenv').config();
const mysql = require('mysql2/promise');

async function verificarColuna() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'crm_db'
    });

    console.log('✅ Conectado ao MySQL\n');

    // Verificar estrutura da tabela consultores
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM consultores LIKE 'tipo_api_whatsapp'
    `);

    if (columns.length > 0) {
      console.log('✅ Coluna tipo_api_whatsapp EXISTE na tabela consultores');
      console.log('Detalhes da coluna:', columns[0]);
    } else {
      console.log('❌ Coluna tipo_api_whatsapp NÃO EXISTE na tabela consultores');
    }

    // Mostrar todas as colunas da tabela consultores
    console.log('\n📋 Todas as colunas da tabela consultores:');
    const [allColumns] = await connection.execute('SHOW COLUMNS FROM consultores');
    allColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarColuna();
