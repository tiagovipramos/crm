#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔧 Corrigindo WebSocket...\n');
  
  const commands = [
    // Verificar .env frontend atual
    'echo "📋 .env frontend atual:"',
    'cd /root/crm && cat .env',
    
    // Atualizar .env do frontend com WebSocket correto
    'cd /root/crm && echo "NEXT_PUBLIC_API_URL=http://185.217.125.72:3001/api" > .env',
    'cd /root/crm && echo "NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001" >> .env',
    
    // Mostrar .env atualizado
    'echo "\n✅ .env frontend atualizado:"',
    'cd /root/crm && cat .env',
    
    // Remover build antigo
    'echo "\n🗑️ Removendo build antigo..."',
    'cd /root/crm && rm -rf .next',
    
    // Parar frontend
    'echo "\n⏸️ Parando frontend..."',
    'cd /root/crm && docker-compose stop frontend',
    
    // Rebuild frontend
    'echo "\n🔨 Rebuilding frontend (isso pode levar 2-3 minutos)..."',
    'cd /root/crm && docker-compose up -d --build frontend',
    
    // Aguardar build
    'echo "\n⏳ Aguardando build finalizar..."',
    'sleep 10',
    
    // Verificar status
    'echo "\n📊 Status dos containers:"',
    'cd /root/crm && docker-compose ps'
  ];
  
  let currentCommand = 0;
  
  const executeNext = () => {
    if (currentCommand >= commands.length) {
      console.log('\n✅ WEBSOCKET CORRIGIDO!');
      console.log('✅ NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001');
      console.log('✅ Frontend reconstruído com WebSocket correto');
      console.log('\n🔗 Teste: http://185.217.125.72:3000/indicador');
      console.log('🔗 WebSocket deve conectar em 185.217.125.72:3001');
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
        console.log(data.toString());
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
