const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function analisarLogsProfundo() {
  try {
    console.log('🔌 Conectando ao servidor VPS...');
    
    await ssh.connect({
      host: '185.217.125.72',
      username: 'root',
      password: 'UA3485Z43hqvZ@4r',
      port: 22
    });

    console.log('✅ Conectado!\n');

    // 1. Logs do backend (últimas 100 linhas)
    console.log('📋 === LOGS DO BACKEND (últimas 100 linhas) ===');
    const backendLogs = await ssh.execCommand('cd /root/crm && docker-compose logs --tail=100 backend');
    console.log(backendLogs.stdout);
    
    // 2. Logs do frontend (últimas 50 linhas)
    console.log('\n📋 === LOGS DO FRONTEND (últimas 50 linhas) ===');
    const frontendLogs = await ssh.execCommand('cd /root/crm && docker-compose logs --tail=50 frontend');
    console.log(frontendLogs.stdout);
    
    // 3. Verificar erros específicos
    console.log('\n🔍 === ANÁLISE DE ERROS ===');
    
    // Buscar por ERROR
    const errors = await ssh.execCommand('cd /root/crm && docker-compose logs --tail=200 backend | grep -i "error" || echo "Nenhum erro encontrado"');
    console.log('\n❌ ERROS encontrados:');
    console.log(errors.stdout);
    
    // Buscar por WARNING
    const warnings = await ssh.execCommand('cd /root/crm && docker-compose logs --tail=200 backend | grep -i "warn" || echo "Nenhum warning encontrado"');
    console.log('\n⚠️ WARNINGS encontrados:');
    console.log(warnings.stdout);
    
    // Buscar por FAILED
    const failed = await ssh.execCommand('cd /root/crm && docker-compose logs --tail=200 | grep -i "failed" || echo "Nenhuma falha encontrada"');
    console.log('\n💥 FALHAS encontradas:');
    console.log(failed.stdout);
    
    // 4. Status dos containers
    console.log('\n📊 === STATUS DOS CONTAINERS ===');
    const status = await ssh.execCommand('cd /root/crm && docker-compose ps');
    console.log(status.stdout);
    
    // 5. Uso de recursos
    console.log('\n💻 === USO DE RECURSOS ===');
    const resources = await ssh.execCommand('docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"');
    console.log(resources.stdout);

    ssh.dispose();
    console.log('\n✅ Análise de logs concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    ssh.dispose();
  }
}

analisarLogsProfundo();
