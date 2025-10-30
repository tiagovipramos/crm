#!/usr/bin/env node

const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('📋 Adicionando coluna indicacao_id...\n');
  
  const alterTableSQL = `
    ALTER TABLE transacoes_indicador 
    ADD COLUMN indicacao_id INT NULL AFTER indicador_id,
    ADD INDEX idx_indicacao (indicacao_id);
  `;
  
  const command = `cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "${alterTableSQL.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      console.log('✅ Coluna adicionada!');
      console.log('📊 Verificando estrutura...\n');
      
      conn.exec('cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "DESCRIBE transacoes_indicador;"', (err2, stream2) => {
        stream2.on('data', (data) => {
          console.log(data.toString());
        });
        
        stream2.on('close', () => {
          console.log('\n✅ Pronto! Sistema corrigido.');
          conn.end();
        });
      });
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      const dataStr = data.toString();
      if (!dataStr.includes('Duplicate column')) {
        console.log('STDERR:', dataStr);
      } else {
        console.log('⚠️ Coluna já existe, continuando...');
      }
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
