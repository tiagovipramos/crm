#!/usr/bin/env node

const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('🔍 Procurando arquivos com localhost...\n');
  
  // Buscar todos os arquivos com localhost
  const findCommand = `cd /root/crm && grep -r "localhost" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.json" --exclude-dir=node_modules --exclude-dir=.next | head -50`;
  
  conn.exec(findCommand, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    let output = '';
    stream.on('data', (data) => {
      output += data.toString();
    });
    
    stream.on('close', () => {
      console.log('📋 Arquivos encontrados:\n');
      console.log(output);
      
      console.log('\n🔧 Substituindo localhost por 185.217.125.72...\n');
      
      // Substituir nos arquivos principais
      const replaceCommands = [
        // Frontend
        `cd /root/crm && find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" | grep -v node_modules | xargs sed -i 's|http://localhost:3001|http://185.217.125.72:3001|g'`,
        `cd /root/crm && find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" | grep -v node_modules | xargs sed -i 's|http://localhost:3000|http://185.217.125.72:3000|g'`,
        `cd /root/crm && find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" | grep -v node_modules | xargs sed -i 's|ws://localhost:3001|ws://185.217.125.72:3001|g'`,
        
        // Backend
        `cd /root/crm/backend && find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs sed -i 's|http://localhost:3001|http://185.217.125.72:3001|g'`,
        `cd /root/crm/backend && find . -name "*.ts" -o -name "*.js" | grep -v node_modules | xargs sed -i 's|http://localhost:3000|http://185.217.125.72:3000|g'`,
        
        // .env files
        `cd /root/crm && if [ -f .env ]; then sed -i 's|http://localhost:3001|http://185.217.125.72:3001|g' .env; fi`,
        `cd /root/crm && if [ -f .env ]; then sed -i 's|http://localhost:3000|http://185.217.125.72:3000|g' .env; fi`,
        `cd /root/crm/backend && if [ -f .env ]; then sed -i 's|http://localhost:3001|http://185.217.125.72:3001|g' .env; fi`,
        `cd /root/crm/backend && if [ -f .env ]; then sed -i 's|http://localhost:3000|http://185.217.125.72:3000|g' .env; fi`,
      ];
      
      let completed = 0;
      replaceCommands.forEach((cmd, index) => {
        conn.exec(cmd, (err2, stream2) => {
          stream2.on('close', () => {
            completed++;
            if (completed === replaceCommands.length) {
              console.log('✅ Substituições concluídas!');
              console.log('\n🔄 Reiniciando containers...\n');
              
              conn.exec('cd /root/crm && docker-compose restart', (err3, stream3) => {
                stream3.on('data', (data) => console.log(data.toString()));
                stream3.on('close', () => {
                  console.log('\n✅ Containers reiniciados!');
                  console.log('✅ Sistema atualizado com IP correto: 185.217.125.72');
                  conn.end();
                });
              });
            }
          });
        });
      });
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
