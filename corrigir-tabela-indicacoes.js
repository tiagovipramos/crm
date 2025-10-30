#!/usr/bin/env node

const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('📋 Corrigindo estrutura da tabela indicacoes...\n');
  
  // Primeiro dropar a tabela e recriar corretamente
  const dropAndRecreateSQL = `
    DROP TABLE IF EXISTS indicacoes;
    
    CREATE TABLE indicacoes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      indicador_id CHAR(36) NOT NULL,
      lead_id INT NULL,
      nome_indicado VARCHAR(255) NOT NULL,
      telefone_indicado VARCHAR(20) NOT NULL,
      whatsapp_validado BOOLEAN DEFAULT FALSE,
      status ENUM('pendente', 'enviado_crm', 'respondeu', 'converteu', 'engano') DEFAULT 'pendente',
      comissao_resposta DECIMAL(10,2) DEFAULT 2.00,
      comissao_venda DECIMAL(10,2) DEFAULT 0.00,
      data_indicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data_envio_crm TIMESTAMP NULL,
      data_resposta TIMESTAMP NULL,
      data_conversao TIMESTAMP NULL,
      data_validacao_whatsapp TIMESTAMP NULL,
      observacoes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_indicador (indicador_id),
      INDEX idx_lead (lead_id),
      INDEX idx_status (status),
      INDEX idx_telefone (telefone_indicado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  const command = `cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "${dropAndRecreateSQL.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Tabela indicacoes corrigida!');
        console.log('📊 Verificando estrutura...\n');
        
        conn.exec('cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "DESCRIBE indicacoes;"', (err2, stream2) => {
          stream2.on('data', (data) => {
            console.log(data.toString());
          });
          
          stream2.on('close', () => {
            console.log('\n✅ Estrutura corrigida! Pronto para testes.');
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
