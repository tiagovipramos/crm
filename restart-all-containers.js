#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔄 Reiniciando todos os containers...\n');
  
  conn.exec('cd /root/crm && docker-compose down && docker-compose up -d', (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    stream.on('data', (data) => {
      console.log(data.toString());
    });
    
    stream.on('close', () => {
      console.log('\n✅ Containers reiniciados!');
      console.log('✅ Frontend agora usa: http://185.217.125.72:3001/api');
      console.log('🔗 Teste: http://185.217.125.72:3000/indicador/login');
      conn.end();
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
