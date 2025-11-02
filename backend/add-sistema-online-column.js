const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSistemaOnlineColumn() {
  let connection;
  
  try {
    // Criar conexão
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'protecar_crm'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM consultores LIKE 'sistema_online'
    `);

    if (columns.length > 0) {
      console.log('ℹ️  Coluna sistema_online já existe');
    } else {
      // Adicionar coluna
      await connection.query(`
        ALTER TABLE consultores 
        ADD COLUMN sistema_online BOOLEAN DEFAULT FALSE AFTER status_conexao
      `);
      console.log('✅ Coluna sistema_online adicionada com sucesso!');

      // Atualizar todos para offline
      await connection.query(`
        UPDATE consultores SET sistema_online = FALSE
      `);
      console.log('✅ Todos os consultores marcados como offline');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Conexão fechada');
    }
  }
}

addSistemaOnlineColumn();
