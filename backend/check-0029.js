const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarNumero() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm'
  });

  try {
    console.log('\n🔍 ===== VERIFICAÇÃO DO NÚMERO (81) 98800-0029 =====\n');

    // Formatos possíveis do número
    const formatos = [
      '81988000029',      // Sem 55
      '5581988000029',    // Com 55
      '558188000029'      // Sem o 9 extra (formato antigo)
    ];

    console.log('📱 Buscando pelos seguintes formatos:');
    formatos.forEach(f => console.log(`   - ${f}`));
    console.log('');

    // Buscar em leads
    for (const formato of formatos) {
      const [leads] = await connection.execute(
        'SELECT id, nome, telefone, consultor_id, status, data_criacao FROM leads WHERE telefone = ?',
        [formato]
      );

      if (leads.length > 0) {
        console.log(`✅ ENCONTRADO em LEADS com formato: ${formato}`);
        console.log(JSON.stringify(leads, null, 2));
        console.log('');

        // Buscar mensagens deste lead
        const [mensagens] = await connection.execute(
          'SELECT id, conteudo, tipo, remetente, whatsapp_message_id, timestamp FROM mensagens WHERE lead_id = ? ORDER BY timestamp DESC LIMIT 10',
          [leads[0].id]
        );

        if (mensagens.length > 0) {
          console.log(`📨 ${mensagens.length} mensagens encontradas:`);
          console.log(JSON.stringify(mensagens, null, 2));
        } else {
          console.log('📭 Nenhuma mensagem encontrada para este lead');
        }
        console.log('');
      }
    }

    // Buscar em mensagens (campo whatsapp_message_id pode conter o número)
    console.log('🔍 Buscando em mensagens por conteúdo...');
    const [mensagensConteudo] = await connection.execute(
      "SELECT id, lead_id, conteudo, remetente, whatsapp_message_id, timestamp FROM mensagens WHERE conteudo LIKE '%988000029%' OR conteudo LIKE '%88000029%' LIMIT 10"
    );

    if (mensagensConteudo.length > 0) {
      console.log(`✅ ${mensagensConteudo.length} mensagens encontradas com conteúdo relacionado:`);
      console.log(JSON.stringify(mensagensConteudo, null, 2));
    } else {
      console.log('❌ Nenhuma mensagem com este número no conteúdo');
    }

    console.log('\n🔍 ===== BUSCA NO LOG FORNECIDO =====\n');
    console.log('⚠️  IMPORTANTE: Analisando o log fornecido pelo usuário:');
    console.log('');
    console.log('Números encontrados no formato internacional (55 + DDD + número):');
    console.log('   - 558188000193');
    console.log('   - 558188000213');
    console.log('   - 558188000086');
    console.log('   - 558188000089');
    console.log('');
    console.log('❌ O número (81) 98800-0029 (formato: 5581988000029 ou 558188000029)');
    console.log('   NÃO FOI ENCONTRADO no log fornecido.');
    console.log('');
    console.log('💡 Os números que aparecem no log são diferentes:');
    console.log('   - 558188000193 = (81) 98800-0193');
    console.log('   - 558188000213 = (81) 98800-0213');
    console.log('   - 558188000086 = (81) 98800-0086');
    console.log('   - 558188000089 = (81) 98800-0089');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

verificarNumero();
