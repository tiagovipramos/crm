#!/usr/bin/env node

const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('📋 Criando consultor de teste...\n');
  
  const createConsultorSQL = `
    INSERT INTO consultores (nome, email, senha, telefone, status_conexao, ativo, data_criacao)
    VALUES ('Consultor Teste', 'teste@crm.com', '$2a$10$abcdefghijklmnopqrstuv', '11999999999', 'online', 1, NOW())
    ON DUPLICATE KEY UPDATE status_conexao = 'online', ativo = 1;
  `;
  
  const command = `cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "${createConsultorSQL.replace(/"/g, '\\"')}"`;
  
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Consultor de teste criado/atualizado!');
        console.log('📊 Verificando consultores online...\n');
        
        conn.exec('cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "SELECT id, nome, email, status_conexao FROM consultores WHERE status_conexao = \'online\';"', (err2, stream2) => {
          stream2.on('data', (data) => {
            console.log(data.toString());
          });
          
          stream2.on('close', () => {
            console.log('\n✅ Consultor configurado! Agora os testes podem prosseguir.');
            conn.end();
          });
        });
      } else {
        console.log('\n⚠️ Comando retornou código:', code);
        conn.end();
      }
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.log('STDERR:', data.toString());
    });
  });
}).connect({
  host: '185.217.125.72',
  port: 22,
  username: 'root',
  password: 'UA3485Z43hqvZ@4r'
});

conn.on('error', (err) => {
  console.error('❌ Erro SSH:', err.message);
});
