const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarLeadsSemWhatsapp() {
  console.log('🔍 Verificando leads com status "sem_whatsapp" no banco...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_protecar'
  });

  try {
    // Buscar TODOS os leads com status sem_whatsapp
    const [leads] = await connection.execute(
      `SELECT id, nome, telefone, status, origem, consultor_id
       FROM leads 
       WHERE status = 'sem_whatsapp'
       ORDER BY id`
    );

    console.log(`📊 Total de leads com status "sem_whatsapp": ${leads.length}\n`);

    if (leads.length === 0) {
      console.log('⚠️ NENHUM lead encontrado com status "sem_whatsapp"!');
      console.log('💡 Execute o script de migração primeiro.\n');
    } else {
      console.log('📋 Leads encontrados:\n');
      leads.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.nome}`);
        console.log(`      ID: ${lead.id}`);
        console.log(`      Telefone: ${lead.telefone}`);
        console.log(`      Status: ${lead.status}`);
        console.log(`      Origem: ${lead.origem}`);
        console.log(`      Consultor ID: ${lead.consultor_id}`);
        console.log('');
      });
    }

    // Verificar TODOS os status possíveis
    console.log('\n📊 Distribuição de leads por status:\n');
    const [statusCounts] = await connection.execute(
      `SELECT status, COUNT(*) as total
       FROM leads 
       GROUP BY status
       ORDER BY total DESC`
    );

    statusCounts.forEach((row) => {
      console.log(`   ${row.status}: ${row.total} leads`);
    });

  } catch (error) {
    console.error('❌ Erro ao verificar leads:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('\n🔌 Conexão fechada.\n');
  }
}

// Executar
verificarLeadsSemWhatsapp()
  .then(() => {
    console.log('✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
