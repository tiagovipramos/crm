const mysql = require('mysql2/promise');
require('dotenv').config();

const { whatsappValidationService } = require('./src/services/whatsappValidationService');

async function migrarLeadsSemWhatsapp() {
  console.log('🚀 Iniciando migração de leads sem WhatsApp...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_protecar'
  });

  try {
    // Buscar todos os leads que foram indicados e estão na coluna "Indicação"
    const [leads] = await connection.execute(
      `SELECT id, nome, telefone, origem, status 
       FROM leads 
       WHERE origem = 'Indicação' AND status = 'indicacao'
       ORDER BY id`
    );

    console.log(`📊 Total de leads com origem "Indicação" encontrados: ${leads.length}\n`);

    if (leads.length === 0) {
      console.log('✅ Nenhum lead para migrar.');
      await connection.end();
      return;
    }

    let totalMigrados = 0;
    let totalComWhatsapp = 0;
    let erros = 0;

    for (const lead of leads) {
      try {
        console.log(`\n🔍 Verificando lead ${lead.id}: ${lead.nome} (${lead.telefone})`);

        // Validar WhatsApp
        const validacao = await whatsappValidationService.validarComCache(lead.telefone);

        if (validacao.existe) {
          console.log(`   ✅ TEM WhatsApp - Mantém na coluna "Indicação"`);
          totalComWhatsapp++;
        } else {
          console.log(`   ❌ SEM WhatsApp - Movendo para "Sem WhatsApp"`);
          
          // Mover para status "sem_whatsapp"
          await connection.execute(
            `UPDATE leads SET status = 'sem_whatsapp', data_atualizacao = NOW() WHERE id = ?`,
            [lead.id]
          );
          
          totalMigrados++;
          console.log(`   ✅ Lead ${lead.id} migrado com sucesso!`);
        }

        // Delay de 1 segundo entre validações para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Erro ao processar lead ${lead.id}:`, error.message);
        erros++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log('='.repeat(60));
    console.log(`✅ Leads COM WhatsApp (mantidos): ${totalComWhatsapp}`);
    console.log(`⚠️  Leads SEM WhatsApp (migrados): ${totalMigrados}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📋 Total processado: ${leads.length}`);
    console.log('='.repeat(60));

    if (totalMigrados > 0) {
      console.log(`\n🎉 Migração concluída! ${totalMigrados} leads movidos para "Sem WhatsApp".\n`);
    } else {
      console.log('\n✅ Nenhum lead precisou ser migrado.\n');
    }

  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Conexão com banco de dados fechada.\n');
  }
}

// Executar migração
migrarLeadsSemWhatsapp()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
