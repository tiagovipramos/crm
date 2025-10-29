const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function executarMigrations() {
  console.log('========================================');
  console.log('Executando Migration: Tipo API WhatsApp');
  console.log('========================================\n');

  try {
    // Conectar ao MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'protecar_crm'
    });

    console.log('✅ Conectado ao MySQL\n');

    // Migration 1: Adicionar coluna tipo_api_whatsapp
    console.log('[1/2] Adicionando coluna tipo_api_whatsapp...');
    const migration1 = fs.readFileSync(
      path.join(__dirname, 'migrations', 'adicionar-tipo-api-whatsapp.sql'),
      'utf8'
    );

    const statements1 = migration1
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements1) {
      await connection.execute(statement);
    }
    console.log('OK - Coluna adicionada!\n');

    // Migration 2: Criar tabela whatsapp_oficial_config
    console.log('[2/2] Criando tabela whatsapp_oficial_config...');
    const migration2 = fs.readFileSync(
      path.join(__dirname, 'migrations', 'criar-tabela-whatsapp-oficial-config.sql'),
      'utf8'
    );

    const statements2 = migration2
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements2) {
      if (statement) {
        await connection.execute(statement);
      }
    }
    console.log('OK - Tabela criada!\n');

    await connection.end();

    console.log('========================================');
    console.log('Migration concluída com sucesso!');
    console.log('========================================\n');
    console.log('Agora reinicie o backend e recarregue a página\n');

  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error.message);
    process.exit(1);
  }
}

executarMigrations();
