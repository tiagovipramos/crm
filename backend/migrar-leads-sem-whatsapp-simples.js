const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrarLeadsSemWhatsappSimples() {
  console.log('🚀 Iniciando migração SIMPLES de leads sem WhatsApp...\n');
  console.log('📋 Este script busca APENAS no banco de dados');
  console.log('⚠️  NÃO valida WhatsApp novamente\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_protecar'
  });

  try {
    // Buscar leads que foram indicados E não têm WhatsApp validado
    console.log('🔍 Buscando leads com origem "Indicação" sem WhatsApp validado...\n');
    
    const [leads] = await connection.execute(
      `SELECT l.id, l.nome, l.telefone, l.origem, l.status, i.whatsapp_validado
       FROM leads l
       LEFT JOIN indicacoes i ON l.indicacao_id = i.id
       WHERE l.origem = 'Indicação' 
         AND l.status = 'indicacao'
         AND (i.whatsapp_validado = 0 OR i.whatsapp_validado IS NULL)
       ORDER BY l.id`
    );

    console.log(`📊 Total de leads SEM WhatsApp encontrados: ${leads.length}\n`);

    if (leads.length === 0) {
      console.log('✅ Nenhum lead para migrar.');
      console.log('💡 Todos os leads de indicação já têm WhatsApp validado ou já foram migrados.\n');
      await connection.end();
      return;
    }

    console.log('📋 Lista de leads que serão movidos:\n');
    leads.forEach((lead, index) => {
      console.log(`   ${index + 1}. ID: ${lead.id} | ${lead.nome} | ${lead.telefone}`);
    });

    console.log('\n⏳ Movendo leads para coluna "Sem WhatsApp"...\n');

    // Mover todos de uma vez - UUIDs precisam estar entre aspas
    const idsParaMover = leads.map(lead => `'${lead.id}'`);
    
    const [result] = await connection.execute(
      `UPDATE leads 
       SET status = 'sem_whatsapp', data_atualizacao = NOW() 
       WHERE id IN (${idsParaMover.join(',')})
       AND status = 'indicacao'`
    );

    console.log('='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log('='.repeat(60));
    console.log(`✅ Leads movidos para "Sem WhatsApp": ${result.affectedRows}`);
    console.log(`📋 IDs migrados: ${idsParaMover.join(', ')}`);
    console.log('='.repeat(60));

    if (result.affectedRows > 0) {
      console.log(`\n🎉 Migração concluída! ${result.affectedRows} leads movidos para "Sem WhatsApp".\n`);
      console.log('💡 Atualize o navegador (F5) para ver as mudanças no funil.\n');
    } else {
      console.log('\n⚠️ Nenhum lead foi movido. Verifique se já foram migrados anteriormente.\n');
    }

  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    console.error('📋 Detalhes:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Conexão com banco de dados fechada.\n');
  }
}

// Executar migração
migrarLeadsSemWhatsappSimples()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
