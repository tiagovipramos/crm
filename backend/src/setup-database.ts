import fs from 'fs';
import path from 'path';
import { pool } from './config/database';

async function setupDatabase() {
  try {
    console.log('🔧 Configurando banco de dados MySQL...\n');

    // Ler schema
    const schemaPath = path.join(__dirname, '../schema-mysql.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Dividir por comandos SQL
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    for (const command of commands) {
      if (command.toLowerCase().includes('create database')) {
        // Executar CREATE DATABASE separadamente
        const conn = await pool.getConnection();
        await conn.query(command);
        conn.release();
        console.log('✅ Banco de dados criado');
      } else if (command.toLowerCase().includes('use protecar_crm')) {
        // Skip USE command (já estamos usando o banco)
        continue;
      } else {
        // Executar outros comandos
        await pool.query(command);
      }
    }

    console.log('\n✅ Banco de dados configurado com sucesso!');
    console.log('\n📊 Verificando tabelas...');

    // Verificar tabelas
    const [tables] = await pool.query('SHOW TABLES');
    console.log(`\n✅ ${(tables as any[]).length} tabelas criadas:`);
    (tables as any[]).forEach((table: any) => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Verificar consultor teste
    const [consultores] = await pool.query('SELECT nome, email FROM consultores');
    if ((consultores as any[]).length > 0) {
      console.log('\n✅ Consultor de teste criado:');
      console.log(`   Email: ${(consultores as any[])[0].email}`);
      console.log(`   Senha: 123456`);
    }

    console.log('\n🎉 Tudo pronto! Agora execute: npm run dev');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro ao configurar banco:', error.message);
    process.exit(1);
  }
}

setupDatabase();
