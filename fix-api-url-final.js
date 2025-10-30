#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔧 Corrigindo NEXT_PUBLIC_API_URL...\n');
  
  const commands = [
    // Corrigir .env do frontend (adicionar /api)
    'cd /root/crm && echo "NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api" > .env',
    'cd /root/crm && echo "NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001" >> .env',
    
    // Mostrar .env corrigido
    'echo "\n📋 .env frontend corrigido:"',
    'cd /root/crm && cat .env',
    
    // Remover build antigo
    'cd /root/crm && rm -rf .next',
    
    // Rebuild frontend
    'cd /root/crm && docker-compose down frontend',
    'cd /root/crm && docker-compose up -d --build frontend'
  ];
  
  let currentCommand = 0;
  
  const executeNext = () => {
    if (currentCommand >= commands.length) {
      console.log('\n✅ Correção completa!');
      console.log('✅ NEXT_PUBLIC_API_URL agora tem /api no final');
      console.log('🔗 Teste: http://185.217.125.72:3000/indicador/login');
      conn.end();
      return;
    }
    
    const cmd = commands[currentCommand];
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('❌ Erro:', err.message);
        conn.end();
        return;
      }
      
      stream.on('data', (data) => {
        const output = data.toString();
        if (!output.includes('npm notice')) {
          console.log(output);
        }
      });
      
      stream.stderr.on('data', (data) => {
        const msg = data.toString();
        if (!msg.includes('Warning') && !msg.includes('npm notice')) {
          console.log(msg);
        }
      });
      
      stream.on('close', () => {
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
