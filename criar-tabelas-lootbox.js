#!/usr/bin/env node

const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Conectado via SSH');
  console.log('📋 Criando tabelas LootBox...\n');
  
  const createTablesSQL = `
    -- Tabela de prêmios da LootBox
    CREATE TABLE IF NOT EXISTS lootbox_premios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo VARCHAR(50) NOT NULL,
      valor DECIMAL(10,2) NOT NULL,
      peso INT NOT NULL DEFAULT 100,
      emoji VARCHAR(10),
      cor_hex VARCHAR(10),
      ativo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    
    -- Tabela de histórico de caixas abertas
    CREATE TABLE IF NOT EXISTS lootbox_historico (
      id INT AUTO_INCREMENT PRIMARY KEY,
      indicador_id CHAR(36) NOT NULL,
      premio_valor DECIMAL(10,2) NOT NULL,
      premio_tipo VARCHAR(50) NOT NULL,
      leads_acumulados INT NOT NULL,
      data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      compartilhado BOOLEAN DEFAULT FALSE,
      data_compartilhamento TIMESTAMP NULL,
      INDEX idx_indicador (indicador_id),
      INDEX idx_data (data_abertura)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    
    -- Inserir prêmios de exemplo
    INSERT INTO lootbox_premios (tipo, valor, peso, emoji, cor_hex) VALUES
    ('bronze', 5.00, 50, '🥉', '#CD7F32'),
    ('prata', 10.00, 30, '🥈', '#C0C0C0'),
    ('ouro', 20.00, 15, '🥇', '#FFD700'),
    ('diamante', 50.00, 4, '💎', '#B9F2FF'),
    ('mega', 100.00, 1, '🏆', '#FF6B6B')
    ON DUPLICATE KEY UPDATE tipo=tipo;
  `;
  
  const command = `cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "${createTablesSQL.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
  
  conn.exec(command, (err, stream) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      console.log('✅ Tabelas LootBox criadas!');
      console.log('📊 Verificando prêmios...\n');
      
      conn.exec('cd /root/crm && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "SELECT id, tipo, valor, peso, emoji FROM lootbox_premios;"', (err2, stream2) => {
        stream2.on('data', (data) => {
          console.log(data.toString());
        });
        
        stream2.on('close', () => {
          console.log('\n✅ Pronto! Agora as caixinhas podem ser abertas!');
          conn.end();
        });
      });
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      const dataStr = data.toString();
      if (!dataStr.includes('Warning')) {
        console.log('STDERR:', dataStr);
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
