#!/usr/bin/env node

const { Client } = require('ssh2');

const createTableSQL = `
CREATE TABLE IF NOT EXISTS transacoes_indicador (
  id INT AUTO_INCREMENT PRIMARY KEY,
  indicador_id CHAR(36) NOT NULL,
  tipo ENUM('comissao', 'saque', 'bonus', 'estorno') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT NULL,
  status ENUM('pendente', 'aprovada', 'cancelada') DEFAULT 'pendente',
  data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_aprovacao TIMESTAMP NULL,
  aprovado_por INT NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_indicador (indicador_id),
  INDEX idx_tipo (tipo),
  INDEX idx_status (status),
  INDEX idx_data (data_transacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('📋 Criando tabela transacoes_indicador...\n');
  
  const command = `cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "${createTableSQL.replace(/"/g, '\\"')}"`;
  
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Tabela transacoes_indicador criada!');
        console.log('🔄 Verificando estrutura...\n');
        
        conn.exec('cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "DESCRIBE transacoes_indicador;"', (err2, stream2) => {
          stream2.on('data', (data) => {
            console.log(data.toString());
          });
          
          stream2.on('close', () => {
            console.log('\n✅ Tabela verificada! Testando dashboard...');
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
