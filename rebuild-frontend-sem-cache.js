#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔧 Rebuild completo SEM cache...\n');
  
  const commands = [
    // Verificar .env
    'echo "📋 .env frontend:"',
    'cd /root/crm && cat .env',
    
    // Parar tudo
    'echo "\n⏸️ Parando containers..."',
    'cd /root/crm && docker-compose down',
    
    // Remover build antigo
    'echo "\n🗑️ Removendo build e cache..."',
    'cd /root/crm && rm -rf .next',
    'cd /root/crm && rm -rf node_modules/.cache',
    
    // Remover imagem docker do frontend
    'echo "\n🗑️ Removendo imagem Docker antiga..."',
    'docker rmi crm_frontend 2>/dev/null || echo "Imagem não existe"',
    
    // Rebuild SEM CACHE
    'echo "\n🔨 Rebuild COMPLETO sem cache (3-5 min)..."',
    'cd /root/crm && docker-compose build --no-cache frontend',
    
    // Subir todos os containers
    'echo "\n🚀 Subindo containers..."',
    'cd /root/crm && docker-compose up -d',
    
    // Aguardar
    'echo "\n⏳ Aguardando containers iniciarem..."',
    'sleep 15',
    
    // Verificar logs do frontend
    'echo "\n📋 Logs do frontend (últimas 20 linhas):"',
    'cd /root/crm && docker-compose logs frontend --tail=20 | grep -i "ready\\|started\\|listening" || echo "Frontend iniciando..."',
    
    // Status final
    'echo "\n📊 Status dos containers:"',
    'cd /root/crm && docker-compose ps'
  ];
  
  let currentCommand = 0;
  
  const executeNext = () => {
    if (currentCommand >= commands.length) {
      console.log('\n✅ REBUILD COMPLETO FINALIZADO!');
      console.log('✅ Frontend reconstruído SEM cache');
      console.log('✅ NEXT_PUBLIC_WS_URL deve estar correto agora');
      console.log('\n🔗 Teste: http://185.217.125.72:3000/indicador/login');
      console.log('🔗 WebSocket DEVE conectar em 185.217.125.72:3001');
      console.log('\n⚠️ Aguarde 30 segundos antes de testar para garantir que tudo esteja pronto');
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
