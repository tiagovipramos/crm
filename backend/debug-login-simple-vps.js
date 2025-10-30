const mysql = require('mysql2/promise');
const http = require('http');

async function debugLogin() {
  console.log('🔍 === DEBUG DE LOGIN NO CRM ===\n');
  
  // 1. Verificar variáveis de ambiente
  console.log('📋 1. VARIÁVEIS DE AMBIENTE:');
  console.log('   DB_HOST:', process.env.DB_HOST);
  console.log('   DB_PORT:', process.env.DB_PORT);
  console.log('   DB_NAME:', process.env.DB_NAME);
  console.log('   DB_USER:', process.env.DB_USER);
  console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NÃO DEFINIDA');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'NÃO DEFINIDA');
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('   PORT:', process.env.PORT);
  console.log();

  let connection;

  try {
    // 2. Testar conexão com banco de dados
    console.log('🔌 2. TESTANDO CONEXÃO COM BANCO DE DADOS...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'protecar_crm'
    });
    console.log('   ✅ Conexão estabelecida com sucesso!\n');

    // 3. Verificar se a tabela consultores existe
    console.log('📊 3. VERIFICANDO ESTRUTURA DO BANCO:');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'consultores'"
    );
    
    if (tables.length === 0) {
      console.log('   ❌ Tabela "consultores" não encontrada!');
      console.log('   🔧 Execute as migrations do banco de dados.\n');
      console.log('   Comando: docker exec crm-backend npm run migrate\n');
      return;
    }
    console.log('   ✅ Tabela "consultores" existe\n');

    // 4. Verificar estrutura da tabela consultores
    console.log('📋 4. ESTRUTURA DA TABELA CONSULTORES:');
    const [columns] = await connection.execute(
      "DESCRIBE consultores"
    );
    console.log('   Colunas encontradas:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log();

    // 5. Verificar se coluna 'role' existe
    console.log('👤 5. VERIFICANDO COLUNA ROLE:');
    const roleExists = columns.find(col => col.Field === 'role');
    
    if (!roleExists) {
      console.log('   ⚠️  Coluna "role" não existe!');
      console.log('   🔧 Criando coluna role...');
      
      try {
        await connection.execute(
          `ALTER TABLE consultores ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'vendedor' AFTER senha`
        );
        console.log('   ✅ Coluna "role" criada com sucesso!\n');
      } catch (error) {
        console.log('   ❌ Erro ao criar coluna:', error.message);
      }
    } else {
      console.log('   ✅ Coluna "role" existe\n');
    }

    // 6. Verificar se existe usuário admin
    console.log('👥 6. VERIFICANDO USUÁRIO ADMIN:');
    const [admins] = await connection.execute(
      "SELECT id, nome, email, " + (roleExists ? "role," : "'vendedor' as role,") + " ativo, senha FROM consultores " + (roleExists ? "WHERE role = 'diretor'" : "LIMIT 5")
    );
    
    if (admins.length === 0) {
      console.log('   ❌ Nenhum usuário com role "diretor" encontrado!');
      console.log('   🔧 Você precisa criar um usuário admin manualmente.\n');
      console.log('   Execute as migrations: docker exec crm-backend npm run migrate\n');
    } else {
      console.log(`   ✅ ${admins.length} usuário(s) admin encontrado(s):`);
      admins.forEach(admin => {
        console.log(`   - ID: ${admin.id}`);
        console.log(`     Nome: ${admin.nome}`);
        console.log(`     Email: ${admin.email}`);
        console.log(`     Role: ${admin.role}`);
        console.log(`     Ativo: ${admin.ativo ? 'Sim' : 'Não'}`);
        console.log(`     Senha Hash: ${admin.senha ? admin.senha.substring(0, 20) + '...' : 'NÃO DEFINIDA'}`);
      });
      console.log();

      // Verificar se o usuário está ativo
      const adminPrincipal = admins.find(a => a.email === 'diretor@protecar.com');
      if (adminPrincipal && !adminPrincipal.ativo) {
        console.log('   ⚠️  Usuário admin está INATIVO!');
        console.log('   🔧 Ativando usuário...');
        await connection.execute(
          "UPDATE consultores SET ativo = 1 WHERE email = ?",
          ['diretor@protecar.com']
        );
        console.log('   ✅ Usuário ativado com sucesso!\n');
      }
    }

    // 7. Verificar todos os consultores
    console.log('👥 7. LISTA DE TODOS OS CONSULTORES:');
    
    // Recarregar estrutura para verificar se role foi criada
    const [newColumns] = await connection.execute("DESCRIBE consultores");
    const roleNowExists = newColumns.find(col => col.Field === 'role');
    
    const [allUsers] = await connection.execute(
      "SELECT id, nome, email, " + (roleNowExists ? "role," : "'vendedor' as role,") + " ativo FROM consultores ORDER BY id"
    );
    
    if (allUsers.length === 0) {
      console.log('   ⚠️  Nenhum consultor cadastrado!\n');
    } else {
      console.log(`   Total: ${allUsers.length} consultor(es)\n`);
      allUsers.forEach((u, index) => {
        console.log(`   ${index + 1}. ${u.nome}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      Role: ${u.role}`);
        console.log(`      Ativo: ${u.ativo ? 'Sim' : 'Não'}`);
        console.log();
      });
    }

    // 8. Testar endpoint de login
    console.log('🌐 8. TESTANDO ENDPOINT DE LOGIN:');
    const postData = JSON.stringify({
      email: 'diretor@protecar.com',
      senha: '123456'
    });

    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3001,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
          
          try {
            const jsonData = JSON.parse(data);
            
            if (res.statusCode === 200) {
              console.log('   ✅ ENDPOINT FUNCIONANDO!');
              console.log('   ✅ Token gerado com sucesso!');
              console.log('   👤 Admin:', jsonData.admin?.nome);
            } else {
              console.log('   ❌ Erro no endpoint:');
              console.log('   ', JSON.stringify(jsonData, null, 2));
            }
          } catch (e) {
            console.log('   ⚠️  Resposta não é JSON:');
            console.log('   ', data.substring(0, 500));
          }
          console.log();
          resolve();
        });
      });

      req.on('error', (error) => {
        console.log('   ⚠️  Erro ao conectar ao endpoint:', error.message);
        console.log('   ℹ️  O servidor pode não estar respondendo ainda.\n');
        resolve();
      });

      req.on('timeout', () => {
        console.log('   ⚠️  Timeout ao conectar ao endpoint\n');
        req.destroy();
        resolve();
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco fechada.\n');
    }
  }

  console.log('✅ === DEBUG CONCLUÍDO ===\n');
  console.log('📝 DIAGNÓSTICO:');
  console.log('   1. Se nenhum usuário admin foi encontrado, execute as migrations');
  console.log('   2. Se o usuário existe mas o login falha, pode ser problema de senha');
  console.log('   3. Verifique os logs detalhados: docker logs crm-backend');
  console.log('   4. Verifique o frontend: docker logs crm-frontend');
  console.log();
  console.log('💡 PRÓXIMOS PASSOS:');
  console.log('   - Se não há usuário admin, execute: docker exec crm-backend npm run migrate');
  console.log('   - Para resetar senha do admin, acesse o MySQL diretamente');
  console.log('   - Para ver logs em tempo real: docker logs -f crm-backend');
  console.log();
}

debugLogin().catch(console.error);
