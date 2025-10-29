const mysql = require('mysql2/promise');

async function verificarDessincronizacao() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'protecar_crm'
  });

  console.log('');
  console.log('================================================');
  console.log('🔍 VERIFICANDO DESSINCRONIZAÇÃO DE VENDAS');
  console.log('================================================');
  console.log('');

  try {
    // Buscar indicador João
    const [indicadores] = await connection.execute(
      "SELECT id, nome FROM indicadores WHERE nome LIKE '%joão%' OR nome LIKE '%João%'",
    );

    if (indicadores.length === 0) {
      console.log('❌ Indicador João não encontrado');
      return;
    }

    const indicador = indicadores[0];
    console.log(`👤 Indicador: ${indicador.nome} (${indicador.id})`);
    console.log('');

    // Buscar indicações com status "converteu"
    console.log('📊 INDICAÇÕES COM STATUS "converteu":');
    console.log('================================================');
    const [indicacoesConvertidas] = await connection.execute(
      `SELECT 
        ind.id as indicacao_id,
        ind.nome_indicado,
        ind.status as indicacao_status,
        l.id as lead_id,
        l.nome as lead_nome,
        l.status as lead_status
       FROM indicacoes ind
       LEFT JOIN leads l ON ind.lead_id = l.id
       WHERE ind.indicador_id = ?
         AND ind.status = 'converteu'
       ORDER BY ind.data_indicacao DESC`,
      [indicador.id]
    );

    console.log(`Total: ${indicacoesConvertidas.length} indicações`);
    console.log('');

    if (indicacoesConvertidas.length > 0) {
      console.log('📋 Detalhes:');
      console.log('');
      
      let statusDesincronizados = 0;
      
      indicacoesConvertidas.forEach((row, index) => {
        const desincronizado = row.lead_status !== 'convertido';
        console.log(`${index + 1}. ${row.nome_indicado}`);
        console.log(`   Indicação Status: ${row.indicacao_status} ✅`);
        console.log(`   Lead Status: ${row.lead_status} ${desincronizado ? '❌' : '✅'}`);
        console.log(`   Lead ID: ${row.lead_id || 'N/A'}`);
        console.log('');
        
        if (desincronizado) {
          statusDesincronizados++;
        }
      });

      console.log('================================================');
      console.log('📊 RESUMO:');
      console.log('================================================');
      console.log(`Total de indicações "converteu": ${indicacoesConvertidas.length}`);
      console.log(`Leads com status "convertido": ${indicacoesConvertidas.length - statusDesincronizados}`);
      console.log(`Leads com status DIFERENTE: ${statusDesincronizados} ❌`);
      console.log('');

      if (statusDesincronizados > 0) {
        console.log('⚠️ PROBLEMA ENCONTRADO!');
        console.log('');
        console.log('💡 Possíveis causas:');
        console.log('   1. Leads foram movidos manualmente de "Convertido" para outra coluna');
        console.log('   2. Status das indicações foi alterado direto no banco');
        console.log('   3. Triggers não estavam ativos quando os leads foram convertidos');
        console.log('');
        console.log('🔧 Solução:');
        console.log('   - Precisamos sincronizar o status das indicações com o status real dos leads');
        console.log('   - Ou corrigir o status dos leads para "convertido"');
      } else {
        console.log('✅ Todos os leads estão com status "convertido"');
        console.log('   O problema pode ser no cache do frontend');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

verificarDessincronizacao().catch(console.error);
