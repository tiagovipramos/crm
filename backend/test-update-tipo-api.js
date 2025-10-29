require('dotenv').config();
const mysql = require('mysql2/promise');

async function testarUpdate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'protecar_crm'
    });

    console.log('✅ Conectado ao MySQL\n');

    // 1. Verificar se a coluna existe
    console.log('📋 Verificando coluna tipo_api_whatsapp...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM consultores LIKE 'tipo_api_whatsapp'
    `);

    if (columns.length === 0) {
      console.log('❌ ERRO: Coluna tipo_api_whatsapp NÃO EXISTE!');
      console.log('   Execute: cd backend; node executar-migrations.js adicionar-tipo-api-whatsapp.sql');
      await connection.end();
      return;
    }

    console.log('✅ Coluna existe!');
    console.log('   Tipo:', columns[0].Type);
    console.log('   Default:', columns[0].Default);
    console.log('');

    // 2. Listar consultores
    console.log('📋 Consultores no banco:');
    const [consultores] = await connection.execute(`
      SELECT id, nome, email, tipo_api_whatsapp FROM consultores
    `);
    
    if (consultores.length === 0) {
      console.log('⚠️ Nenhum consultor encontrado!');
      await connection.end();
      return;
    }

    consultores.forEach(c => {
      console.log(`  - ID: ${c.id}, Nome: ${c.nome}, Email: ${c.email}, Tipo API: ${c.tipo_api_whatsapp || 'NULL'}`);
    });
    console.log('');

    // 3. Testar UPDATE no primeiro consultor
    const primeiroConsultor = consultores[0];
    console.log(`🧪 Testando UPDATE no consultor ${primeiroConsultor.nome} (ID: ${primeiroConsultor.id})...`);
    
    const novoTipo = primeiroConsultor.tipo_api_whatsapp === 'oficial' ? 'nao_oficial' : 'oficial';
    
    await connection.execute(
      'UPDATE consultores SET tipo_api_whatsapp = ? WHERE id = ?',
      [novoTipo, primeiroConsultor.id]
    );

    console.log(`✅ UPDATE executado com sucesso! Novo tipo: ${novoTipo}`);
    console.log('');

    // 4. Verificar se foi atualizado
    const [resultado] = await connection.execute(
      'SELECT tipo_api_whatsapp FROM consultores WHERE id = ?',
      [primeiroConsultor.id]
    );

    console.log('📋 Valor atual no banco:', resultado[0].tipo_api_whatsapp);
    
    if (resultado[0].tipo_api_whatsapp === novoTipo) {
      console.log('✅ Verificação OK! O UPDATE funcionou corretamente.');
    } else {
      console.log('❌ ERRO: O UPDATE não funcionou!');
    }

    await connection.end();
    
    console.log('\n========================================');
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('========================================');
    console.log('\nSe o teste funcionou, o problema pode estar:');
    console.log('1. Backend não foi reiniciado após a migration');
    console.log('2. Cache do navegador/frontend');
    console.log('3. Erro no código do endpoint /whatsapp/alterar-tipo-api');
    console.log('\nReinicie o backend e limpe o cache do navegador (Ctrl+Shift+R)');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

testarUpdate();
