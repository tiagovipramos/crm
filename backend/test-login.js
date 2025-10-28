const http = require('http');

async function testLogin() {
  try {
    console.log('🔐 Testando login do admin...');
    console.log('📧 Email: diretor@protecar.com');
    console.log('🔑 Senha: 123456');
    console.log();

    const postData = JSON.stringify({
      email: 'diretor@protecar.com',
      senha: '123456'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📊 Status:', res.statusCode, res.statusMessage);
        console.log();

        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ LOGIN REALIZADO COM SUCESSO!');
            console.log();
            console.log('👤 Admin:', jsonData.admin.nome);
            console.log('📧 Email:', jsonData.admin.email);
            console.log('🎭 Role:', jsonData.admin.role);
            console.log('🎫 Token:', jsonData.token.substring(0, 50) + '...');
          } else {
            console.log('❌ ERRO NO LOGIN:');
            console.log(jsonData);
          }
        } catch (e) {
          console.log('❌ Erro ao processar resposta:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro ao testar login:', error.message);
      console.log();
      console.log('⚠️  Certifique-se de que o backend está rodando em http://localhost:3001');
    });

    req.write(postData);
    req.end();
  } catch (error) {
    console.error('❌ Erro ao testar login:', error.message);
  }
}

testLogin();
