const mysql = require('mysql2/promise');

async function sincronizarSaldos() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'protecar_crm'
  });

  console.log('');
  console.log('================================================');
  console.log('🔄 SINCRONIZAÇÃO FORÇADA DE SALDOS');
  console.log('================================================');
  console.log('');

  try {
    // Buscar TODOS os indicadores
    console.log('📋 Buscando indicadores...');
    const [indicadores] = await connection.execute(
      'SELECT id, nome FROM indicadores'
    );

    console.log(`✅ Encontrados ${indicadores.length} indicadores`);
    console.log('');

    for (const indicador of indicadores) {
      console.log('================================================');
      console.log(`🔄 Processando: ${indicador.nome} (${indicador.id})`);
      console.log('================================================');

      // Buscar todas as indicações deste indicador
      const [indicacoes] = await connection.execute(
        'SELECT id, status, comissao_resposta, comissao_venda FROM indicacoes WHERE indicador_id = ?',
        [indicador.id]
      );

      console.log(`📊 Total de indicações: ${indicacoes.length}`);

      // Calcular saldos baseado no status atual
      let saldoBloqueado = 0;
      let saldoDisponivel = 0;
      let saldoPerdido = 0;
      let indicacoesRespondidas = 0;
      let indicacoesConvertidas = 0;

      indicacoes.forEach(ind => {
        const comissaoResposta = parseFloat(ind.comissao_resposta || 2.00);
        const comissaoVenda = parseFloat(ind.comissao_venda || 20.00);

        switch (ind.status) {
          case 'pendente':
          case 'enviado_crm':
            // Saldo bloqueado aguardando resposta
            saldoBloqueado += comissaoResposta;
            break;

          case 'respondeu':
            // Comissão de resposta liberada
            saldoDisponivel += comissaoResposta;
            indicacoesRespondidas++;
            break;

          case 'converteu':
            // Comissão de resposta + comissão de venda
            saldoDisponivel += comissaoResposta + comissaoVenda;
            indicacoesRespondidas++;
            indicacoesConvertidas++;
            break;

          case 'perdido':
          case 'engano':
            // Comissão perdida
            saldoPerdido += comissaoResposta;
            break;
        }
      });

      console.log('');
      console.log('📊 SALDOS CALCULADOS:');
      console.log(`   💰 Disponível: R$ ${saldoDisponivel.toFixed(2)}`);
      console.log(`   🔒 Bloqueado: R$ ${saldoBloqueado.toFixed(2)}`);
      console.log(`   ❌ Perdido: R$ ${saldoPerdido.toFixed(2)}`);
      console.log(`   📈 Indicações respondidas: ${indicacoesRespondidas}`);
      console.log(`   🎯 Indicações convertidas: ${indicacoesConvertidas}`);
      console.log('');

      // Buscar saldos ATUAIS no banco
      const [saldosAtuais] = await connection.execute(
        'SELECT saldo_disponivel, saldo_bloqueado, saldo_perdido, indicacoes_respondidas, indicacoes_convertidas FROM indicadores WHERE id = ?',
        [indicador.id]
      );

      const atual = saldosAtuais[0];
      const disponivelAtual = parseFloat(atual.saldo_disponivel);
      const bloqueadoAtual = parseFloat(atual.saldo_bloqueado);
      const perdidoAtual = parseFloat(atual.saldo_perdido);

      console.log('📊 SALDOS NO BANCO (ANTES):');
      console.log(`   💰 Disponível: R$ ${disponivelAtual.toFixed(2)}`);
      console.log(`   🔒 Bloqueado: R$ ${bloqueadoAtual.toFixed(2)}`);
      console.log(`   ❌ Perdido: R$ ${perdidoAtual.toFixed(2)}`);
      console.log('');

      // Verificar se precisa atualizar
      const precisaAtualizar = 
        Math.abs(disponivelAtual - saldoDisponivel) > 0.01 ||
        Math.abs(bloqueadoAtual - saldoBloqueado) > 0.01 ||
        Math.abs(perdidoAtual - saldoPerdido) > 0.01 ||
        atual.indicacoes_respondidas !== indicacoesRespondidas ||
        atual.indicacoes_convertidas !== indicacoesConvertidas;

      if (precisaAtualizar) {
        console.log('⚠️ SALDOS DESATUALIZADOS! Sincronizando...');
        console.log('');

        // ATUALIZAR no banco de dados
        await connection.execute(
          `UPDATE indicadores 
           SET saldo_disponivel = ?,
               saldo_bloqueado = ?,
               saldo_perdido = ?,
               indicacoes_respondidas = ?,
               indicacoes_convertidas = ?
           WHERE id = ?`,
          [
            saldoDisponivel,
            saldoBloqueado,
            saldoPerdido,
            indicacoesRespondidas,
            indicacoesConvertidas,
            indicador.id
          ]
        );

        console.log('✅ SALDOS ATUALIZADOS COM SUCESSO!');
        console.log('');
        console.log('📊 DIFERENÇAS:');
        console.log(`   💰 Disponível: ${(saldoDisponivel - disponivelAtual).toFixed(2)} ${saldoDisponivel > disponivelAtual ? '📈' : '📉'}`);
        console.log(`   🔒 Bloqueado: ${(saldoBloqueado - bloqueadoAtual).toFixed(2)} ${saldoBloqueado > bloqueadoAtual ? '📈' : '📉'}`);
        console.log(`   ❌ Perdido: ${(saldoPerdido - perdidoAtual).toFixed(2)} ${saldoPerdido > perdidoAtual ? '📈' : '📉'}`);
        console.log('');

        // Registrar transação de sincronização
        await connection.execute(
          `INSERT INTO transacoes_indicador (
            indicador_id, tipo, valor, saldo_anterior, saldo_novo, descricao
          ) VALUES (?, 'sincronizacao', ?, ?, ?, ?)`,
          [
            indicador.id,
            Math.abs(saldoDisponivel - disponivelAtual),
            disponivelAtual,
            saldoDisponivel,
            '🔄 SINCRONIZAÇÃO - Saldos recalculados e atualizados automaticamente'
          ]
        );

      } else {
        console.log('✅ Saldos já estão corretos! Nenhuma atualização necessária.');
        console.log('');
      }
    }

    console.log('================================================');
    console.log('✅ SINCRONIZAÇÃO CONCLUÍDA!');
    console.log('================================================');
    console.log('');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   1. Recarregue a página do app de indicação (Ctrl+Shift+R)');
    console.log('   2. Limpe o cache do navegador se necessário');
    console.log('   3. Verifique se os valores estão corretos agora');
    console.log('');

  } catch (error) {
    console.error('❌ Erro durante sincronização:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

// Executar
sincronizarSaldos().catch(console.error);
