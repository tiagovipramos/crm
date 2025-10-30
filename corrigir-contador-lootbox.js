#!/usr/bin/env node

const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('📋 Atualizando contador de LootBox...\n');
  
  const updateSQL = `
    UPDATE indicadores 
    SET leads_para_proxima_caixa = 10
    WHERE email = 'tiago@vipseg.org';
  `;
  
  const command = `cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "${updateSQL.replace(/"/g, '\\"')}"`;
  
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Contador atualizado para 10!');
        console.log('📊 Verificando...\n');
        
        conn.exec('cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "SELECT email, leads_para_proxima_caixa, vendas_para_proxima_caixa FROM indicadores WHERE email = \'tiago@vipseg.org\';"', (err2, stream2) => {
          stream2.on('data', (data) => {
            console.log(data.toString());
          });
          
          stream2.on('close', () => {
            console.log('\n✅ Pronto! Agora a caixinha está 10/10!');
            conn.end();
          });
        });
      } else {
        console.log('\n⚠️ Comando retornou código:', code);
        conn.end();
      }
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.log('STDERR:', data.toString());
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
