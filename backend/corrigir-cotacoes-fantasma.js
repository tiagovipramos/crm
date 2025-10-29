const mysql = require('mysql2/promise');

async function corrigirCotacoesFantasma() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'protecar_crm'
  });

  console.log('');
  console.log('================================================');
  console.log('🔧 CORRIGINDO COTAÇÕES FANTASMA');
  console.log('================================================');
  console.log('');

  try {
    // Buscar indicador João
    const [indicadores] = await connection.execute(
      "SELECT id, nome FROM indicadores WHERE nome LIKE '%joão%' OR nome LIKE '%João%'"
    );

    if (indicadores.length === 0) {
      console.log('❌ Indicador João não encontrado');
      return;
    }

    const indicador = indicadores[0];
    console.log(`👤 Indicador: ${indicador.nome}`);
    console.log('');

    // Buscar indicações "respondeu" com leads que NÃO estão em "proposta_enviada"
    const [indicacoesErradas] = await connection.execute(
      `SELECT 
        ind.id as indicacao_id,
        ind.nome_indicado,
        ind.status as indicacao_status,
        l.id as lead_id,
        l.status as lead_status
       FROM indicacoes ind
       LEFT JOIN leads l ON ind.lead_id = l.id
       WHERE ind.indicador_id = ?
         AND ind.status = 'respondeu'
         AND l.status != 'proposta_enviada'`,
      [indicador.id]
    );

    console.log(`📊 Encontradas ${indicacoesErradas.length} cotações fantasma`);
    console.log('');

    if (indicacoesErradas.length === 0) {
      console.log('✅ Nenhuma correção necessária!');
      return;
    }

    console.log('📋 Detalhes:');
    indicacoesErradas.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nome_indicado}`);
      console.log(`      Indicação: ${row.indicacao_status}`);
      console.log(`      Lead: ${row.lead_status}`);
      console.log('');
    });

    console.log('🔄 Corrigindo status das indicações...');
    console.log('');

    // Corrigir cada indicação
    for (const row of indicacoesErradas) {
      // Determinar novo status baseado no status do lead
      let novoStatus = 'enviado_crm';
      
      console.log(`   ✓ ${row.nome_indicado}: "respondeu" → "${novoStatus}"`);

      // Atualizar status da indicação
      await connection.execute(
        'UPDATE indicacoes SET status = ?, data_resposta = NULL WHERE id = ?',
        [novoStatus, row.indicacao_id]
      );
    }

    console.log('');
    console.log('✅ Status das indicações corrigidos!');
    console.log('');

    // Agora recalcular saldos do indicador
    console.log('💰 Recalculando saldos...');
    console.log('');

    // Buscar todas as indicações do indicador
    const [todasIndicacoes] = await connection.execute(
      'SELECT status, comissao_resposta, comissao_venda FROM indicacoes WHERE indicador_id = ?',
      [indicador.id]
    );

    let saldoBloqueado = 0;
    let saldoDisponivel = 0;
    let saldoPerdido = 0;
    let indicacoesRespondidas = 0;
    let indicacoesConvertidas = 0;

    todasIndicacoes.forEach(ind => {
      const comissaoResposta = parseFloat(ind.comissao_resposta || 2.00);
      const comissaoVenda = parseFloat(ind.comissao_venda || 20.00);

      switch (ind.status) {
        case 'pendente':
        case 'enviado_crm':
          saldoBloqueado += comissaoResposta;
          break;
        case 'respondeu':
          saldoDisponivel += comissaoResposta;
          indicacoesRespondidas++;
          break;
        case 'converteu':
          saldoDisponivel += comissaoResposta + comissaoVenda;
          indicacoesRespondidas++;
          indicacoesConvertidas++;
          break;
        case 'perdido':
        case 'engano':
          saldoPerdido += comissaoResposta;
          break;
      }
    });

    console.log('📊 NOVOS SALDOS:');
    console.log(`   💰 Disponível: R$ ${saldoDisponivel.toFixed(2)}`);
    console.log(`   🔒 Bloqueado: R$ ${saldoBloqueado.toFixed(2)}`);
    console.log(`   ❌ Perdido: R$ ${saldoPerdido.toFixed(2)}`);
    console.log(`   📈 Indicações respondidas: ${indicacoesRespondidas}`);
    console.log(`   🎯 Indicações convertidas: ${indicacoesConvertidas}`);
    console.log('');

    // Atualizar saldos no banco
    await connection.execute(
      `UPDATE indicadores 
       SET saldo_disponivel = ?,
           saldo_bloqueado = ?,
           saldo_perdido = ?,
           indicacoes_respondidas = ?,
           indicacoes_convertidas = ?
       WHERE id = ?`,
      [saldoDisponivel, saldoBloqueado, saldoPerdido, indicacoesRespondidas, indicacoesConvertidas, indicador.id]
    );

    console.log('✅ Saldos atualizados!');
    console.log('');

    // Registrar transação
    await connection.execute(
      `INSERT INTO transacoes_indicador (
        indicador_id, tipo, valor, saldo_anterior, saldo_novo, descricao
      ) VALUES (?, 'correcao', 0, 0, 0, ?)`,
      [indicador.id, '🔧 CORREÇÃO - Cotações fantasma removidas, status sincronizado']
    );

    console.log('================================================');
    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('================================================');
    console.log('');
    console.log(`📊 ${indicacoesErradas.length} cotações fantasma corrigidas`);
    console.log('💰 Saldos recalculados e atualizados');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   1. Recarregue o app de indicação (Ctrl+Shift+R)');
    console.log('   2. Os valores agora devem estar corretos!');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

corrigirCotacoesFantasma().catch(console.error);
