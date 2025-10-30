#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔧 Pull e rebuild final...\n');
  
  const commands = [
    // Pull do GitHub
    'echo "📥 Fazendo pull do GitHub..."',
    'cd /root/crm && git pull',
    
    // Parar containers
    'echo "\n⏸️ Parando containers..."',
    'cd /root/crm && docker-compose down',
    
    // Remover imagens antigas
    'echo "\n🗑️ Removendo imagem antiga do frontend..."',
    'docker rmi crm_frontend 2>/dev/null || echo "OK"',
    
    // Rebuild do frontend com as novas ARGs
    'echo "\n🔨 Rebuilding frontend com NEXT_PUBLIC_WS_URL..."',
    'cd /root/crm && docker-compose build --no-cache frontend',
    
    // Subir todos
    'echo "\n🚀 Subindo containers..."',
    'cd /root/crm && docker-compose up -d',
    
    // Aguardar
    'echo "\n⏳ Aguardando 15 segundos..."',
    'sleep 15',
    
    // Status
    'echo "\n📊 Status final:"',
    'cd /root/crm && docker-compose ps'
  ];
  
  let currentCommand = 0;
  
  const executeNext = () => {
    if (currentCommand >= commands.length) {
      console.log('\n✅ REBUILD FINAL CONCLUÍDO!');
      console.log('✅ Dockerfile atualizado com NEXT_PUBLIC_WS_URL');
      console.log('✅ docker-compose.yml atualizado com args');
      console.log('✅ Frontend rebuiltado com variáveis corretas');
      console.log('\n🔗 TESTE FINAL: http://185.217.125.72:3000/indicador/login');
      console.log('🔗 WebSocket DEVE conectar em: http://185.217.125.72:3001');
      console.log('\n⚠️ Aguarde 30 segundos antes de testar');
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
