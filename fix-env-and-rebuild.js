#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔧 Corrigindo arquivos .env e rebuild...\n');
  
  const commands = [
    // Criar/atualizar .env no frontend
    'cd /root/crm && echo "NEXT_PUBLIC_API_URL=http://185.217.125.72:3001" > .env',
    'cd /root/crm && echo "NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001" >> .env',
    
    // Criar/atualizar .env no backend  
    'cd /root/crm/backend && echo "FRONTEND_URL=http://185.217.125.72:3000" > .env',
    'cd /root/crm/backend && echo "DB_HOST=mysql" >> .env',
    'cd /root/crm/backend && echo "DB_USER=root" >> .env',
    'cd /root/crm/backend && echo "DB_PASSWORD=root123" >> .env',
    'cd /root/crm/backend && echo "DB_NAME=protecar_crm" >> .env',
    'cd /root/crm/backend && echo "PORT=3001" >> .env',
    
    // Mostrar .env files
    'echo "\\n📋 Arquivo .env frontend:"',
    'cd /root/crm && cat .env',
    'echo "\\n📋 Arquivo .env backend:"',
    'cd /root/crm/backend && cat .env',
    
    // Remover build e rebuild
    'cd /root/crm && rm -rf .next',
    'cd /root/crm && docker-compose down',
    'cd /root/crm && docker-compose up -d --build'
  ];
  
  let currentCommand = 0;
  
  const executeNext = () => {
    if (currentCommand >= commands.length) {
      console.log('\n✅ Correção completa!');
      console.log('✅ Variáveis de ambiente configuradas com IP correto');
      console.log('🔗 Acesse: http://185.217.125.72:3000/indicador');
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
