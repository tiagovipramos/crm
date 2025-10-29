const mysql = require('mysql2/promise');
require('dotenv').config();

async function corrigirConsultorId() {
  console.log('🔧 Corrigindo consultor_id dos leads sem WhatsApp...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_protecar'
  });

  try {
    // 1. Buscar o consultor Carlos especificamente
    console.log('🔍 Buscando consultor Carlos (carlos@protecar.com)...');
    const [consultores] = await connection.execute(
      "SELECT id, nome, email FROM consultores WHERE email = 'carlos@protecar.com' LIMIT 1"
    );

    if (consultores.length === 0) {
      console.error('❌ Consultor Carlos não encontrado no sistema!');
      console.error('💡 Verifique se o email está correto: carlos@protecar.com');
      return;
    }

    const consultor = consultores[0];
    console.log(`✅ Consultor encontrado: ${consultor.nome} (${consultor.email})`);
    console.log(`📋 ID do consultor: ${consultor.id}\n`);

    // 2. Buscar leads sem consultor_id
    console.log('🔍 Buscando leads sem consultor_id...');
    const [leadsSemConsultor] = await connection.execute(
      `SELECT id, nome, telefone
       FROM leads 
       WHERE consultor_id IS NULL
       AND status = 'sem_whatsapp'`
    );

    console.log(`📊 Encontrados ${leadsSemConsultor.length} leads sem consultor\n`);

    if (leadsSemConsultor.length === 0) {
      console.log('✅ Todos os leads já têm consultor atribuído!');
      return;
    }

    console.log('📋 Leads que serão corrigidos:\n');
    leadsSemConsultor.forEach((lead, index) => {
      console.log(`   ${index + 1}. ${lead.nome} - ${lead.telefone}`);
    });

    console.log(`\n⏳ Atribuindo consultor "${consultor.nome}" a estes leads...\n`);

    // 3. Atualizar leads
    const [result] = await connection.execute(
      `UPDATE leads 
       SET consultor_id = ?, data_atualizacao = NOW()
       WHERE consultor_id IS NULL 
       AND status = 'sem_whatsapp'`,
      [consultor.id]
    );

    console.log('='.repeat(60));
    console.log('📊 RESULTADO:');
    console.log('='.repeat(60));
    console.log(`✅ Leads atualizados: ${result.affectedRows}`);
    console.log(`👤 Consultor atribuído: ${consultor.nome}`);
    console.log(`🆔 ID do consultor: ${consultor.id}`);
    console.log('='.repeat(60));

    console.log('\n🎉 Correção concluída!');
    console.log('💡 Agora faça logout e login novamente no CRM para ver os leads.\n');

  } catch (error) {
    console.error('❌ Erro ao corrigir:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Conexão fechada.\n');
  }
}

// Executar
corrigirConsultorId()
  .then(() => {
    console.log('✅ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
