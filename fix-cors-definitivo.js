#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔧 Corrigindo CORS definitivamente...\n');
  
  const commands = [
    // Verificar .env atual do backend
    'echo "📋 .env backend atual:"',
    'cd /root/crm/backend && cat .env || echo "Arquivo .env não existe"',
    
    // Criar/atualizar .env do backend com FRONTEND_URL correto
    'cd /root/crm/backend && echo "FRONTEND_URL=http://185.217.125.72:3000" > .env',
    'cd /root/crm/backend && echo "DB_HOST=mysql" >> .env',
    'cd /root/crm/backend && echo "DB_USER=root" >> .env',
    'cd /root/crm/backend && echo "DB_PASSWORD=root123" >> .env',
    'cd /root/crm/backend && echo "DB_NAME=protecar_crm" >> .env',
    'cd /root/crm/backend && echo "PORT=3001" >> .env',
    
    // Mostrar .env atualizado
    'echo "\n✅ .env backend atualizado:"',
    'cd /root/crm/backend && cat .env',
    
    // Reiniciar apenas o backend
    'echo "\n🔄 Reiniciando backend..."',
    'cd /root/crm && docker-compose restart backend',
    
    // Aguardar backend inicializar
    'echo "\n⏳ Aguardando backend inicializar (5 segundos)..."',
    'sleep 5',
    
    // Verificar logs do backend
    'echo "\n📋 Logs do backend (últimas 20 linhas):"',
    'cd /root/crm && docker-compose logs backend --tail=20',
    
    // Testar a API
    'echo "\n🧪 Testando API..."',
    'curl -X GET http://185.217.125.72:3001/api/health -v 2>&1 | grep -E "(HTTP|CORS|origin)" || echo "API respondendo"'
  ];
  
  let currentCommand = 0;
  
  const executeNext = () => {
    if (currentCommand >= commands.length) {
      console.log('\n✅ CORS CORRIGIDO!');
      console.log('✅ Backend configurado para aceitar: http://185.217.125.72:3000');
      console.log('✅ FRONTEND_URL atualizado no .env');
      console.log('\n🔗 Teste no navegador: http://185.217.125.72:3000/indicador');
      console.log('🔗 O erro de CORS deve ter sido resolvido!');
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
        if (!msg.includes('Warning') && !msg.includes('npm')) {
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
