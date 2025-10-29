const mysql = require('mysql2/promise');

async function verificarTriggersReversao() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'protecar_crm'
  });

  console.log('');
  console.log('===============================================');
  console.log('VERIFICANDO TRIGGERS DE REVERSÃO');
  console.log('===============================================');
  console.log('');

  const [triggers] = await connection.execute(
    `SHOW TRIGGERS WHERE \`Table\` = 'leads'`
  );

  console.log('📋 Triggers encontrados no banco:');
  console.log('');
  
  triggers.forEach((trigger) => {
    console.log(`✓ ${trigger.Trigger}`);
    console.log(`  Evento: ${trigger.Event}`);
    console.log(`  Timing: ${trigger.Timing}`);
    console.log('');
  });

  // Verificar se os triggers de reversão existem
  const triggersReversao = triggers.filter(t => 
    t.Trigger === 'trigger_reversao_para_proposta' || 
    t.Trigger === 'trigger_reversao_para_convertido'
  );

  console.log('');
  console.log('===============================================');
  if (triggersReversao.length === 2) {
    console.log('✅ TRIGGERS DE REVERSÃO INSTALADOS!');
    console.log('');
    console.log('Triggers encontrados:');
    triggersReversao.forEach(t => console.log(`  - ${t.Trigger}`));
  } else {
    console.log('❌ TRIGGERS DE REVERSÃO NÃO ENCONTRADOS!');
    console.log('');
    console.log('Você precisa executar:');
    console.log('  backend\\executar-migration-triggers-reversao.bat');
  }
  console.log('===============================================');
  console.log('');

  await connection.end();
}

verificarTriggersReversao().catch(console.error);
