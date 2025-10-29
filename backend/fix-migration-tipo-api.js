require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixMigration() {
  let connection;
  
  try {
    console.log('Conectando ao MySQL...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'protecar_crm',
      multipleStatements: true
    });

    console.log('✅ Conectado ao MySQL\n');

    // 1. Verificar se a coluna já existe
    console.log('1️⃣ Verificando se coluna tipo_api_whatsapp existe...');
    const [checkColumn] = await connection.execute(`
      SELECT COUNT(*) as existe 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'consultores' 
      AND COLUMN_NAME = 'tipo_api_whatsapp'
    `, [process.env.DB_NAME || 'protecar_crm']);

    if (checkColumn[0].existe > 0) {
      console.log('✅ Coluna tipo_api_whatsapp JÁ EXISTE');
    } else {
      console.log('❌ Coluna tipo_api_whatsapp NÃO EXISTE');
      console.log('   Criando coluna...');
      
      await connection.execute(`
        ALTER TABLE consultores 
        ADD COLUMN tipo_api_whatsapp VARCHAR(20) DEFAULT 'nao_oficial' 
        COMMENT 'Tipo de API WhatsApp: oficial ou nao_oficial'
      `);
      
      console.log('✅ Coluna criada com sucesso!');
    }

    // 2. Atualizar registros NULL
    console.log('\n2️⃣ Atualizando registros NULL...');
    const [updateResult] = await connection.execute(`
      UPDATE consultores 
      SET tipo_api_whatsapp = 'nao_oficial' 
      WHERE tipo_api_whatsapp IS NULL
    `);
    console.log(`✅ ${updateResult.affectedRows} registros atualizados`);

    // 3. Verificar tabela whatsapp_oficial_config
    console.log('\n3️⃣ Verificando tabela whatsapp_oficial_config...');
    const [checkTable] = await connection.execute(`
      SELECT COUNT(*) as existe 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'whatsapp_oficial_config'
    `, [process.env.DB_NAME || 'protecar_crm']);

    if (checkTable[0].existe > 0) {
      console.log('✅ Tabela whatsapp_oficial_config JÁ EXISTE');
    } else {
      console.log('❌ Tabela whatsapp_oficial_config NÃO EXISTE');
      console.log('   Criando tabela...');
      
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS whatsapp_oficial_config (
          id VARCHAR(36) PRIMARY KEY,
          consultor_id VARCHAR(36) NOT NULL UNIQUE,
          phone_number_id VARCHAR(255) NOT NULL,
          access_token TEXT NOT NULL,
          webhook_verify_token VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
        )
      `);
      
      console.log('✅ Tabela criada com sucesso!');
    }

    // 4. Listar consultores com novo campo
    console.log('\n4️⃣ Consultores registrados:');
    const [consultores] = await connection.execute(`
      SELECT id, nome, email, tipo_api_whatsapp 
      FROM consultores 
      LIMIT 5
    `);
    
    consultores.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.nome} (${c.email}) - API: ${c.tipo_api_whatsapp}`);
    });

    // 5. Testar UPDATE
    if (consultores.length > 0) {
      console.log('\n5️⃣ Testando UPDATE...');
      const testeId = consultores[0].id;
      
      await connection.execute(`
        UPDATE consultores 
        SET tipo_api_whatsapp = 'oficial' 
        WHERE id = ?
      `, [testeId]);
      
      const [verificacao] = await connection.execute(`
        SELECT tipo_api_whatsapp 
        FROM consultores 
        WHERE id = ?
      `, [testeId]);
      
      if (verificacao[0].tipo_api_whatsapp === 'oficial') {
        console.log('✅ UPDATE funcionando corretamente!');
        
        // Reverter
        await connection.execute(`
          UPDATE consultores 
          SET tipo_api_whatsapp = 'nao_oficial' 
          WHERE id = ?
        `, [testeId]);
        console.log('✅ Teste revertido');
      } else {
        console.log('❌ UPDATE NÃO funcionou!');
      }
    }

    await connection.end();
    
    console.log('\n========================================');
    console.log('✅ MIGRATION CONCLUÍDA COM SUCESSO!');
    console.log('========================================');
    console.log('\nPRÓXIMOS PASSOS:');
    console.log('1. Reinicie o backend (Ctrl+C e depois npm run dev)');
    console.log('2. Recarregue o navegador com Ctrl+Shift+R');
    console.log('3. Tente alterar o tipo de API novamente');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    if (error.code) {
      console.error('Código:', error.code);
    }
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixMigration();
