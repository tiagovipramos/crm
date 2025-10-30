const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function deployLimpo() {
  try {
    console.log('🔌 Conectando ao servidor VPS...');
    
    await ssh.connect({
      host: '185.217.125.72',
      username: 'root',
      password: 'UA3485Z43hqvZ@4r',
      port: 22
    });

    console.log('✅ Conectado!\n');

    // 1. Parar todos os containers
    console.log('⏹️  Parando todos os containers...');
    await ssh.execCommand('cd /root/crm && docker-compose down');
    console.log('✅ Containers parados\n');

    // 2. Remover containers antigos
    console.log('🗑️  Removendo containers antigos...');
    await ssh.execCommand('docker container prune -f');
    console.log('✅ Containers antigos removidos\n');

    // 3. Remover imagens antigas do backend
    console.log('🗑️  Removendo imagens antigas do backend...');
    await ssh.execCommand('docker rmi crm_backend || true');
    console.log('✅ Imagens antigas removidas\n');

    // 4. Rebuild completo
    console.log('🔨 Reconstruindo todos os containers...');
    const buildResult = await ssh.execCommand('cd /root/crm && docker-compose build --no-cache backend');
    console.log(buildResult.stdout);
    console.log('✅ Build concluído\n');

    // 5. Iniciar containers
    console.log('🚀 Iniciando containers...');
    const upResult = await ssh.execCommand('cd /root/crm && docker-compose up -d');
    console.log(upResult.stdout);
    console.log('✅ Containers iniciados\n');

    // 6. Aguardar 15 segundos
    console.log('⏳ Aguardando 15 segundos para estabilização...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 7. Status dos containers
    console.log('\n📊 Status dos containers:');
    const statusResult = await ssh.execCommand('cd /root/crm && docker-compose ps');
    console.log(statusResult.stdout);

    // 8. Logs do backend (últimas 40 linhas)
    console.log('\n📋 Logs do backend:');
    const logsResult = await ssh.execCommand('cd /root/crm && docker-compose logs --tail=40 backend');
    console.log(logsResult.stdout);

    // 9. Verificar se o loop foi corrigido
    console.log('\n🔍 Verificando correção do loop...');
    const checkResult = await ssh.execCommand(
      'cd /root/crm && docker-compose logs --tail=50 backend | grep -c "Tentando reconectar WhatsApp" || echo "0"'
    );
    const loopCount = parseInt(checkResult.stdout.trim());
    
    if (loopCount === 0) {
      console.log('✅ ✅ ✅ SUCESSO TOTAL! Loop infinito CORRIGIDO! ✅ ✅ ✅');
    } else {
      console.log(`⚠️ Ainda há ${loopCount} tentativas de reconexão nos logs`);
    }

    ssh.dispose();
    console.log('\n✅ Deploy limpo concluído!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    ssh.dispose();
  }
}

deployLimpo();
