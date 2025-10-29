const mysql = require('mysql2/promise');

async function diagnosticarProblema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'protecar_crm'
  });

  console.log('');
  console.log('================================================');
  console.log('🔍 DIAGNÓSTICO DO PROBLEMA DE SALDOS');
  console.log('================================================');
  console.log('');

  try {
    // 1. Verificar triggers instalados
    console.log('📋 1. VERIFICANDO TRIGGERS INSTALADOS:');
    console.log('================================================');
    const [triggers] = await connection.execute(
      "SHOW TRIGGERS WHERE `Table` = 'leads'"
    );
    
    const triggersEsperados = [
      'trigger_comissao_proposta_enviada',
      'trigger_comissao_conversao',
      'trigger_lead_nao_solicitado',
      'trigger_lead_perdido',
      'trigger_lead_engano',
      'trigger_reversao_para_proposta',
      'trigger_reversao_para_convertido'
    ];

    triggersEsperados.forEach(nome => {
      const existe = triggers.some(t => t.Trigger === nome);
      console.log(`${existe ? '✅' : '❌'} ${nome}`);
    });

    console.log('');

    // 2. Buscar indicador "João" (do print)
    console.log('📋 2. DADOS DO INDICADOR JOÃO:');
    console.log('================================================');
    const [indicadores] = await connection.execute(
      "SELECT id, nome, saldo_disponivel, saldo_bloqueado, saldo_perdido, total_indicacoes FROM indicadores WHERE nome LIKE '%joão%' OR nome LIKE '%João%'"
    );

    if (indicadores.length === 0) {
      console.log('❌ Indicador João não encontrado');
      await connection.end();
      return;
    }

    const indicador = indicadores[0];
    console.log(`ID: ${indicador.id}`);
    console.log(`Nome: ${indicador.nome}`);
    console.log(`💰 Saldo Disponível: R$ ${parseFloat(indicador.saldo_disponivel).toFixed(2)}`);
    console.log(`🔒 Saldo Bloqueado: R$ ${parseFloat(indicador.saldo_bloqueado).toFixed(2)}`);
    console.log(`❌ Saldo Perdido: R$ ${parseFloat(indicador.saldo_perdido).toFixed(2)}`);
    console.log(`📊 Total Indicações: ${indicador.total_indicacoes}`);
    console.log('');

    // 3. Buscar leads deste indicador
    console.log('📋 3. LEADS DO INDICADOR:');
    console.log('================================================');
    const [leads] = await connection.execute(
      "SELECT id, nome, status, indicacao_id FROM leads WHERE indicador_id = ?",
      [indicador.id]
    );

    console.log(`Total de leads: ${leads.length}`);
    console.log('');

    // Contar por status
    const statusCounts = {};
    leads.forEach(lead => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    console.log('📊 Distribuição por status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log('');

    // 4. Buscar indicações deste indicador
    console.log('📋 4. INDICAÇÕES DO INDICADOR:');
    console.log('================================================');
    const [indicacoes] = await connection.execute(
      "SELECT id, nome_indicado, status, comissao_resposta FROM indicacoes WHERE indicador_id = ?",
      [indicador.id]
    );

    console.log(`Total de indicações: ${indicacoes.length}`);
    console.log('');

    // Contar por status
    const indicacoesStatusCounts = {};
    indicacoes.forEach(ind => {
      indicacoesStatusCounts[ind.status] = (indicacoesStatusCounts[ind.status] || 0) + 1;
    });

    console.log('📊 Distribuição por status:');
    Object.entries(indicacoesStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log('');

    // 5. CALCULAR O QUE DEVERIA SER
    console.log('📋 5. CÁLCULO ESPERADO DE SALDOS:');
    console.log('================================================');

    const pendentes = indicacoesStatusCounts['pendente'] || 0;
    const enviadosCrm = indicacoesStatusCounts['enviado_crm'] || 0;
    const respondeu = indicacoesStatusCounts['respondeu'] || 0;
    const converteu = indicacoesStatusCounts['converteu'] || 0;
    const perdido = indicacoesStatusCounts['perdido'] || 0;
    const engano = indicacoesStatusCounts['engano'] || 0;

    const saldoBloqueadoEsperado = (pendentes + enviadosCrm) * 2.00;
    const saldoDisponivelEsperado = (respondeu * 2.00) + (converteu * 22.00); // 2 + 20
    const saldoPerdidoEsperado = (perdido + engano) * 2.00;

    console.log(`🔒 Saldo Bloqueado Esperado: R$ ${saldoBloqueadoEsperado.toFixed(2)}`);
    console.log(`   (${pendentes} pendentes + ${enviadosCrm} enviados) × R$ 2,00`);
    console.log('');
    console.log(`💰 Saldo Disponível Esperado: R$ ${saldoDisponivelEsperado.toFixed(2)}`);
    console.log(`   (${respondeu} respondeu × R$ 2,00) + (${converteu} converteu × R$ 22,00)`);
    console.log('');
    console.log(`❌ Saldo Perdido Esperado: R$ ${saldoPerdidoEsperado.toFixed(2)}`);
    console.log(`   (${perdido} perdido + ${engano} engano) × R$ 2,00`);
    console.log('');

    // 6. COMPARAR COM O REAL
    console.log('📋 6. COMPARAÇÃO REAL vs ESPERADO:');
    console.log('================================================');

    const saldoDisponivelReal = parseFloat(indicador.saldo_disponivel);
    const saldoBloqueadoReal = parseFloat(indicador.saldo_bloqueado);
    const saldoPerdidoReal = parseFloat(indicador.saldo_perdido);

    const diferencaDisponivel = saldoDisponivelReal - saldoDisponivelEsperado;
    const diferencaBloqueado = saldoBloqueadoReal - saldoBloqueadoEsperado;
    const diferencaPerdido = saldoPerdidoReal - saldoPerdidoEsperado;

    console.log('💰 Saldo Disponível:');
    console.log(`   Real: R$ ${saldoDisponivelReal.toFixed(2)}`);
    console.log(`   Esperado: R$ ${saldoDisponivelEsperado.toFixed(2)}`);
    console.log(`   Diferença: R$ ${diferencaDisponivel.toFixed(2)} ${Math.abs(diferencaDisponivel) < 0.01 ? '✅' : '❌'}`);
    console.log('');

    console.log('🔒 Saldo Bloqueado:');
    console.log(`   Real: R$ ${saldoBloqueadoReal.toFixed(2)}`);
    console.log(`   Esperado: R$ ${saldoBloqueadoEsperado.toFixed(2)}`);
    console.log(`   Diferença: R$ ${diferencaBloqueado.toFixed(2)} ${Math.abs(diferencaBloqueado) < 0.01 ? '✅' : '❌'}`);
    console.log('');

    console.log('❌ Saldo Perdido:');
    console.log(`   Real: R$ ${saldoPerdidoReal.toFixed(2)}`);
    console.log(`   Esperado: R$ ${saldoPerdidoEsperado.toFixed(2)}`);
    console.log(`   Diferença: R$ ${diferencaPerdido.toFixed(2)} ${Math.abs(diferencaPerdido) < 0.01 ? '✅' : '❌'}`);
    console.log('');

    // 7. DIAGNÓSTICO FINAL
    console.log('📋 7. DIAGNÓSTICO:');
    console.log('================================================');

    if (Math.abs(diferencaDisponivel) < 0.01 && Math.abs(diferencaBloqueado) < 0.01 && Math.abs(diferencaPerdido) < 0.01) {
      console.log('✅ SALDOS ESTÃO CORRETOS!');
      console.log('');
      console.log('⚠️ Se o dashboard não atualiza, o problema pode ser:');
      console.log('   1. Cache do navegador');
      console.log('   2. Socket.IO não conectado');
      console.log('   3. Frontend não recarregando dados');
    } else {
      console.log('❌ SALDOS ESTÃO INCORRETOS!');
      console.log('');
      console.log('💡 Possíveis causas:');
      if (triggers.length < 7) {
        console.log('   ❌ Triggers faltando - Execute as migrations');
      }
      console.log('   ❌ Triggers não executaram corretamente');
      console.log('   ❌ Status das indicações inconsistente com status dos leads');
      console.log('');
      console.log('🔧 Solução sugerida:');
      console.log('   1. Reexecutar migrations dos triggers');
      console.log('   2. Criar script de sincronização para corrigir saldos');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

diagnosticarProblema().catch(console.error);
