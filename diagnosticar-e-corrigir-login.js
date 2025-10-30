#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔍 Diagnosticando erro de login...\n');
  
  // Ver logs do backend
  conn.exec('cd /root/crm && docker-compose logs backend --tail=100', (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    let logs = '';
    stream.on('data', (data) => {
      logs += data.toString();
    });
    
    stream.on('close', () => {
      console.log('📋 LOGS DO BACKEND:\n');
      console.log(logs);
      
      // Analisar logs
      console.log('\n🔍 ANÁLISE:\n');
      
      if (logs.includes('ECONNREFUSED') || logs.includes('connect ECONNREFUSED')) {
        console.log('❌ Backend não consegue conectar ao MySQL');
        console.log('🔧 Corrigindo configuração do banco...\n');
        
        // Verificar se MySQL está rodando
        conn.exec('cd /root/crm && docker-compose ps mysql', (err2, stream2) => {
          stream2.on('data', (data) => console.log(data.toString()));
          stream2.on('close', () => {
            // Restart containers
            console.log('\n🔄 Reiniciando containers...\n');
            conn.exec('cd /root/crm && docker-compose restart', (err3, stream3) => {
              stream3.on('data', (data) => console.log(data.toString()));
              stream3.on('close', () => {
                console.log('\n✅ Containers reiniciados!');
                console.log('⏳ Aguardando 10 segundos para backend inicializar...\n');
                
                setTimeout(() => {
                  console.log('🧪 Testando login...\n');
                  testLogin(conn);
                }, 10000);
              });
            });
          });
        });
      } else if (logs.includes('Unknown database')) {
        console.log('❌ Banco de dados não existe');
        console.log('🔧 Criando banco...\n');
        
        conn.exec('cd /root/crm && docker exec -i crm-mysql mysql -uroot -proot123 -e "CREATE DATABASE IF NOT EXISTS protecar_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"', (err2, stream2) => {
          stream2.on('close', () => {
            console.log('✅ Banco criado!');
            conn.exec('cd /root/crm && docker-compose restart backend', (err3, stream3) => {
              stream3.on('close', () => {
                console.log('✅ Backend reiniciado!');
                setTimeout(() => testLogin(conn), 10000);
              });
            });
          });
        });
      } else if (logs.includes('Access denied')) {
        console.log('❌ Credenciais do MySQL incorretas');
        console.log('🔧 Verificando credenciais...\n');
        
        conn.exec('cd /root/crm/backend && cat .env | grep DB_', (err2, stream2) => {
          stream2.on('data', (data) => console.log(data.toString()));
          stream2.on('close', () => {
            console.log('\n⚠️ Verifique se as credenciais estão corretas');
            conn.end();
          });
        });
      } else {
        console.log('📊 Logs parecem OK. Testando login...\n');
        testLogin(conn);
      }
    });
  });
}).connect({
  host: '185.217.125.72',
  port: 22,
  username: 'root',
  password: 'UA3485Z43hqvZ@4r'
});

function testLogin(conn) {
  const loginData = JSON.stringify({
    email: 'tiago@vipseg.org',
    senha: '123456'
  });
  
  const curlCmd = `curl -X POST http://185.217.125.72:3001/api/indicador/login \\
    -H "Content-Type: application/json" \\
    -d '${loginData}' \\
    -v 2>&1`;
  
  conn.exec(curlCmd, (err, stream) => {
    let output = '';
    stream.on('data', (data) => {
      output += data.toString();
    });
    
    stream.on('close', () => {
      console.log('📡 RESPOSTA DO LOGIN:\n');
      console.log(output);
      
      if (output.includes('"token"') || output.includes('"success":true')) {
        console.log('\n✅ LOGIN FUNCIONANDO!');
        console.log('🔗 Teste no browser: http://185.217.125.72:3000/indicador/login');
      } else if (output.includes('Connection refused')) {
        console.log('\n❌ Backend não está respondendo');
        console.log('🔧 Verificando status dos containers...\n');
        
        conn.exec('cd /root/crm && docker-compose ps', (err2, stream2) => {
          stream2.on('data', (data) => console.log(data.toString()));
          stream2.on('close', () => conn.end());
        });
      } else {
        console.log('\n⚠️ Login retornou erro. Verifique a resposta acima.');
        conn.end();
      }
    });
  });
}

conn.on('error', (err) => {
  console.error('❌ Erro SSH:', err.message);
});
