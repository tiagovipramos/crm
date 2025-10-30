const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

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

    // 5. Verificar se existe usuário admin
    console.log('👤 5. VERIFICANDO USUÁRIO ADMIN:');
    const [admins] = await connection.execute(
      "SELECT id, nome, email, role, ativo FROM consultores WHERE role = 'diretor'"
    );
    
    if (admins.length === 0) {
      console.log('   ❌ Nenhum usuário com role "diretor" encontrado!');
      console.log('   🔧 É necessário criar um usuário admin.\n');
      
      // Criar usuário admin
      console.log('🔧 6. CRIANDO USUÁRIO ADMIN...');
      const senhaHash = await bcrypt.hash('123456', 10);
      
      try {
        await connection.execute(
          `INSERT INTO consultores (nome, email, senha, role, ativo, meta_mensal, tipo_comissao, comissao_fixa, comissao_minima, comissao_maxima)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['Diretor', 'diretor@protecar.com', senhaHash, 'diretor', 1, 0, 'fixa', 0, 0, 0]
        );
        console.log('   ✅ Usuário admin criado com sucesso!');
        console.log('   📧 Email: diretor@protecar.com');
        console.log('   🔑 Senha: 123456\n');
      } catch (error) {
        console.log('   ❌ Erro ao criar usuário admin:', error.message);
        console.log();
      }
    } else {
      console.log(`   ✅ ${admins.length} usuário(s) admin encontrado(s):`);
      admins.forEach(admin => {
        console.log(`   - ID: ${admin.id}`);
        console.log(`     Nome: ${admin.nome}`);
        console.log(`     Email: ${admin.email}`);
        console.log(`     Role: ${admin.role}`);
        console.log(`     Ativo: ${admin.ativo ? 'Sim' : 'Não'}`);
      });
      console.log();
    }

    // 6. Testar autenticação do admin principal
    console.log('🔐 7. TESTANDO AUTENTICAÇÃO:');
    const [users] = await connection.execute(
      "SELECT id, nome, email, senha, role, ativo FROM consultores WHERE email = ?",
      ['diretor@protecar.com']
    );
    
    if (users.length === 0) {
      console.log('   ❌ Usuário diretor@protecar.com não encontrado!\n');
      return;
    }

    const user = users[0];
    console.log('   📧 Testando login com: diretor@protecar.com');
    console.log('   🔑 Senha: 123456');
    
    if (!user.ativo) {
      console.log('   ❌ Usuário está INATIVO!');
      console.log('   🔧 Ativando usuário...');
      await connection.execute(
        "UPDATE consultores SET ativo = 1 WHERE email = ?",
        ['diretor@protecar.com']
      );
      console.log('   ✅ Usuário ativado!\n');
    }

    const senhaCorreta = await bcrypt.compare('123456', user.senha);
    
    if (senhaCorreta) {
      console.log('   ✅ Senha verificada com sucesso!');
      console.log('   ✅ Login deve funcionar corretamente!\n');
    } else {
      console.log('   ❌ Senha incorreta!');
      console.log('   🔧 Atualizando senha para "123456"...');
      
      const novaSenhaHash = await bcrypt.hash('123456', 10);
      await connection.execute(
        "UPDATE consultores SET senha = ? WHERE email = ?",
        [novaSenhaHash, 'diretor@protecar.com']
      );
      console.log('   ✅ Senha atualizada com sucesso!\n');
    }

    // 7. Verificar todos os consultores
    console.log('👥 8. LISTA DE TODOS OS CONSULTORES:');
    const [allUsers] = await connection.execute(
      "SELECT id, nome, email, role, ativo FROM consultores ORDER BY id"
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
    console.log('🌐 9. TESTANDO ENDPOINT DE LOGIN:');
    const http = require('http');
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
            } else {
              console.log('   ❌ Erro no endpoint:');
              console.log('   ', JSON.stringify(jsonData, null, 2));
            }
          } catch (e) {
            console.log('   ⚠️  Resposta não é JSON:', data.substring(0, 200));
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
  console.log('📝 PRÓXIMOS PASSOS:');
  console.log('   1. Se o usuário admin foi criado/corrigido, tente fazer login');
  console.log('   2. Verifique os logs do backend: docker logs crm-backend');
  console.log('   3. Verifique os logs do frontend: docker logs crm-frontend');
  console.log('   4. Acesse: http://SEU_IP:3000/admin/login');
  console.log();
}

debugLogin().catch(console.error);
