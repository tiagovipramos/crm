const { NodeSSH } = require('node-ssh');
const fs = require('fs');

const ssh = new NodeSSH();

async function uploadERebuild() {
  try {
    console.log('🔌 Conectando ao servidor VPS...');
    
    await ssh.connect({
      host: '185.217.125.72',
      username: 'root',
      password: 'UA3485Z43hqvZ@4r',
      port: 22
    });

    console.log('✅ Conectado!\n');

    // 1. Fazer upload do arquivo corrigido
    console.log('📤 Fazendo upload do whatsappService.ts corrigido...');
    await ssh.putFile(
      './backend-whatsappService.ts',
      '/root/crm/backend/src/services/whatsappService.ts'
    );
    console.log('✅ Arquivo enviado com sucesso!\n');

    // 2. Rebuild do container backend
    console.log('🔨 Rebuilding backend container...');
    const rebuildResult = await ssh.execCommand(
      'cd /root/crm && docker-compose up -d --build backend',
      { cwd: '/root/crm' }
    );
    console.log(rebuildResult.stdout);
    if (rebuildResult.stderr) console.error(rebuildResult.stderr);

    // 3. Aguardar 10 segundos para container iniciar
    console.log('\n⏳ Aguardando 10 segundos para container iniciar...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 4. Verificar logs do backend
    console.log('\n📋 Verificando logs do backend (últimas 30 linhas)...');
    const logsResult = await ssh.execCommand(
      'cd /root/crm && docker-compose logs --tail=30 backend'
    );
    console.log(logsResult.stdout);

    // 5. Verificar se ainda há erros de loop
    console.log('\n🔍 Verificando se o loop foi corrigido...');
    const checkLoopResult = await ssh.execCommand(
      'cd /root/crm && docker-compose logs --tail=50 backend | grep -c "Tentando reconectar WhatsApp" || echo "0"'
    );
    const loopCount = parseInt(checkLoopResult.stdout.trim());
    
    if (loopCount === 0) {
      console.log('✅ SUCESSO! Loop infinito corrigido! Nenhuma tentativa de reconexão detectada.');
    } else {
      console.log(`⚠️ Ainda detectadas ${loopCount} tentativas de reconexão. Aguardando mais tempo...`);
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const recheckResult = await ssh.execCommand(
        'cd /root/crm && docker-compose logs --tail=20 backend | grep "Tentando reconectar" || echo "Nenhuma"'
      );
      console.log('\n📋 Recheck:', recheckResult.stdout);
    }

    // 6. Status final dos containers
    console.log('\n📊 Status final dos containers:');
    const statusResult = await ssh.execCommand('cd /root/crm && docker-compose ps');
    console.log(statusResult.stdout);

    ssh.dispose();
    console.log('\n\n✅ Processo concluído!');
    console.log('🔧 Próximo passo: Testar o sistema no navegador');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    ssh.dispose();
  }
}

uploadERebuild();
