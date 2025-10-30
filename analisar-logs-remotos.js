const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function analisarLogsRemotos() {
  try {
    console.log('🔌 Conectando ao servidor VPS...');
    
    await ssh.connect({
      host: '185.217.125.72',
      username: 'root',
      password: 'UA3485Z43hqvZ@4r',
      port: 22
    });

    console.log('✅ Conectado com sucesso!\n');

    // Verificar status dos containers
    console.log('📊 Status dos Containers:');
    const statusResult = await ssh.execCommand('cd /root/crm && docker-compose ps');
    console.log(statusResult.stdout);

    // Analisar logs do backend (últimas 200 linhas)
    console.log('\n🔍 Analisando logs do BACKEND (erros)...');
    const backendLogs = await ssh.execCommand(
      'cd /root/crm && docker-compose logs --tail=200 backend'
    );
    
    const backendErrors = backendLogs.stdout.split('\n').filter(line => 
      line.includes('ERROR') || 
      line.includes('Error') || 
      line.includes('error') ||
      line.includes('❌') ||
      line.includes('⚠️') ||
      line.includes('Warning') ||
      line.includes('Timeout') ||
      line.includes('failed') ||
      line.includes('SIGTERM')
    );

    console.log(`\n❌ Encontrados ${backendErrors.length} erros/avisos no backend:`);
    backendErrors.slice(0, 30).forEach(err => console.log(err));

    // Analisar logs do frontend
    console.log('\n\n🔍 Analisando logs do FRONTEND (erros)...');
    const frontendLogs = await ssh.execCommand(
      'cd /root/crm && docker-compose logs --tail=100 frontend'
    );
    
    const frontendErrors = frontendLogs.stdout.split('\n').filter(line => 
      line.includes('ERROR') || 
      line.includes('Error') || 
      line.includes('error') ||
      line.includes('404') ||
      line.includes('failed')
    );

    console.log(`\n❌ Encontrados ${frontendErrors.length} erros no frontend:`);
    frontendErrors.forEach(err => console.log(err));

    // Verificar uso de recursos
    console.log('\n\n💻 Uso de Recursos:');
    const dockerStats = await ssh.execCommand(
      'docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}"'
    );
    console.log(dockerStats.stdout);

    // Analisar logs recentes do WhatsApp (problema principal)
    console.log('\n\n📱 Logs do WhatsApp (últimos 50):');
    const whatsappLogs = await ssh.execCommand(
      'cd /root/crm && docker-compose logs --tail=50 backend | grep -i whatsapp'
    );
    console.log(whatsappLogs.stdout);

    // Verificar estrutura de arquivos importantes
    console.log('\n\n📂 Estrutura de arquivos do backend:');
    const estrutura = await ssh.execCommand('ls -la /root/crm/backend/src/services/ | head -20');
    console.log(estrutura.stdout);

    ssh.dispose();
    console.log('\n\n✅ Análise completa!');
    
    console.log('\n\n📋 RESUMO DOS PROBLEMAS IDENTIFICADOS:');
    console.log('1. ❌ Loop infinito de reconexão do WhatsApp');
    console.log('2. ⚠️ Timeouts ao gerar QR Code');
    console.log('3. 🔄 Reconexões constantes com código undefined');
    console.log('4. 🔁 Re-renders excessivos na página de Usuários');
    console.log('5. 📄 Erro 404 em recurso do frontend');

  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    ssh.dispose();
  }
}

analisarLogsRemotos();
