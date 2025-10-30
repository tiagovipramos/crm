#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔧 Fazendo rebuild do frontend...\n');
  
  const commands = [
    // Remover build antigo
    'cd /root/crm && rm -rf .next',
    // Parar containers
    'cd /root/crm && docker-compose down',
    // Rebuild e start
    'cd /root/crm && docker-compose up -d --build'
  ];
  
  let currentCommand = 0;
  
  const executeNext = () => {
    if (currentCommand >= commands.length) {
      console.log('\n✅ Rebuild concluído!');
      console.log('✅ Frontend reconstruído com IP correto: 185.217.125.72');
      console.log('🔗 Acesse: http://185.217.125.72:3000/indicador');
      conn.end();
      return;
    }
    
    const cmd = commands[currentCommand];
    console.log(`\n📝 Executando: ${cmd.split('&&').pop().trim()}\n`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('❌ Erro:', err.message);
        conn.end();
        return;
      }
      
      stream.on('data', (data) => {
        console.log(data.toString());
      });
      
      stream.stderr.on('data', (data) => {
        const msg = data.toString();
        if (!msg.includes('Warning')) {
          console.log(msg);
        }
      });
      
      stream.on('close', (code) => {
        currentCommand++;
        executeNext();
      });
    });
  };
  
  executeNext();
  
}).connect({
  host: '185.217.125.72',
  port: 22,
  username: 'root',
  password: 'UA3485Z43hqvZ@4r'
});

conn.on('error', (err) => {
  console.error('❌ Erro SSH:', err.message);
});
