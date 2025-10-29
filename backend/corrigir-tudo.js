const mysql = require('mysql2/promise');

async function corrigirTudo() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'protecar_crm'
  });

  console.log('');
  console.log('================================================');
  console.log('🔧 CORREÇÃO COMPLETA - SALDOS E STATUS');
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
    console.log(`👤 Indicador: ${indicador.nome} (${indicador.id})`);
    console.log('');

    // PASSO 1: Corrigir vendas fantasma
    console.log('PASSO 1: Corrigindo vendas fantasma...');
    console.log('──────────────────────────────────────');
    
    const [vendasFantasma] = await connection.execute(
      `SELECT 
        ind.id as indicacao_id,
        ind.nome_indicado,
        l.status as lead_status
       FROM indicacoes ind
       LEFT JOIN leads l ON ind.lead_id = l.id
       WHERE ind.indicador_id = ?
         AND ind.status = 'converteu'
         AND l.status != 'convertido'`,
      [indicador.id]
    );

    if (vendasFantasma.length > 0) {
      console.log(`   ❌ Encontradas ${vendasFantasma.length} vendas fantasma`);
      for (const row of vendasFantasma) {
        const novoStatus = row.lead_status === 'proposta_enviada' ? 'respondeu' : 'enviado_crm';
        await connection.execute(
          'UPDATE indicacoes SET status = ?, data_conversao = NULL WHERE id = ?',
          [novoStatus, row.indicacao_id]
        );
        console.log(`   ✓ ${row.nome_indicado}: converteu → ${novoStatus}`);
      }
    } else {
      console.log(`   ✅ Nenhuma venda fantasma encontrada`);
    }
    console.log('');

    // PASSO 2: Corrigir cotações fantasma
    console.log('PASSO 2: Corrigindo cotações fantasma...');
    console.log('──────────────────────────────────────');
    
    const [cotacoesFantasma] = await connection.execute(
      `SELECT 
        ind.id as indicacao_id,
        ind.nome_indicado,
        l.status as lead_status
       FROM indicacoes ind
       LEFT JOIN leads l ON ind.lead_id = l.id
       WHERE ind.indicador_id = ?
         AND ind.status = 'respondeu'
         AND l.status != 'proposta_enviada'`,
      [indicador.id]
    );

    if (cotacoesFantasma.length > 0) {
      console.log(`   ❌ Encontradas ${cotacoesFantasma.length} cotações fantasma`);
      for (const row of cotacoesFantasma) {
        await connection.execute(
          'UPDATE indicacoes SET status = ?, data_resposta = NULL WHERE id = ?',
          ['enviado_crm', row.indicacao_id]
        );
        console.log(`   ✓ ${row.nome_indicado}: respondeu → enviado_crm`);
      }
    } else {
      console.log(`   ✅ Nenhuma cotação fantasma encontrada`);
    }
    console.log('');

    // PASSO 3: Recalcular saldos
    console.log('PASSO 3: Recalculando saldos...');
    console.log('──────────────────────────────────────');

    const [todasIndicacoes] = await connection.execute(
      'SELECT status, comissao_resposta, comissao_venda FROM indicacoes WHERE indicador_id = ?',
      [indicador.id]
    );

    let saldoBloqueado = 0;
    let saldoDisponivel = 0;
    let saldoPerdido = 0;
    let indicacoesRespondidas = 0;
    let indicacoesConvertidas = 0;

    // Contadores por status
    const contadores = {
      pendente: 0,
      enviado_crm: 0,
      respondeu: 0,
      converteu: 0,
      perdido: 0,
      engano: 0
    };

    todasIndicacoes.forEach(ind => {
      const comissaoResposta = parseFloat(ind.comissao_resposta || 2.00);
      const comissaoVenda = parseFloat(ind.comissao_venda || 20.00);

      contadores[ind.status] = (contadores[ind.status] || 0) + 1;

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

    console.log('');
    console.log('   📊 Distribuição de indicações:');
    console.log(`      • Pendente/Enviado CRM: ${contadores.pendente + contadores.enviado_crm}`);
    console.log(`      • Respondeu (Cotação): ${contadores.respondeu}`);
    console.log(`      • Converteu (Venda): ${contadores.converteu}`);
    console.log(`      • Perdido/Engano: ${contadores.perdido + contadores.engano}`);
    console.log('');
    console.log('   💰 Saldos calculados:');
    console.log(`      • Disponível: R$ ${saldoDisponivel.toFixed(2)}`);
    console.log(`      • Bloqueado: R$ ${saldoBloqueado.toFixed(2)}`);
    console.log(`      • Perdido: R$ ${saldoPerdido.toFixed(2)}`);
    console.log('');

    // Atualizar no banco
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

    console.log('   ✅ Saldos atualizados no banco de dados!');
    console.log('');

    // Registrar transação
    await connection.execute(
      `INSERT INTO transacoes_indicador (
        indicador_id, tipo, valor, saldo_anterior, saldo_novo, descricao
      ) VALUES (?, 'correcao', 0, 0, 0, ?)`,
      [indicador.id, '🔧 CORREÇÃO COMPLETA - Status e saldos sincronizados com CRM']
    );

    console.log('================================================');
    console.log('✅ CORREÇÃO COMPLETA FINALIZADA!');
    console.log('================================================');
    console.log('');
    console.log(`📊 Resumo:`);
    console.log(`   • ${vendasFantasma.length} vendas fantasma corrigidas`);
    console.log(`   • ${cotacoesFantasma.length} cotações fantasma corrigidas`);
    console.log(`   • Saldos recalculados e atualizados`);
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   1. Recarregue o app de indicação (Ctrl+Shift+R)');
    console.log('   2. Limpe o cache se necessário (Ctrl+Shift+Delete)');
    console.log('   3. Verifique se os valores estão corretos');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
  }
}

corrigirTudo().catch(console.error);
