#!/usr/bin/env node

const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('📋 Verificando logs do backend...\n');
  
  conn.exec('cd /root/crm && docker-compose logs --tail=50 backend', (err, stream) => {
    if (err) throw err;
    
    stream.on('close', (code) => {
      console.log('\n✅ Logs coletados');
      conn.end();
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
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
