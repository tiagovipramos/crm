const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

async function commitCorrecao() {
  try {
    console.log('🔌 Conectando ao servidor VPS...');
    
    await ssh.connect({
      host: '185.217.125.72',
      username: 'root',
      password: 'UA3485Z43hqvZ@4r',
      port: 22
    });

    console.log('✅ Conectado!\n');

    // 1. Verificar status do Git
    console.log('📋 Status do Git:');
    const statusResult = await ssh.execCommand('cd /root/crm && git status');
    console.log(statusResult.stdout);

    // 2. Add arquivo
    console.log('\n➕ Adicionando arquivo...');
    await ssh.execCommand('cd /root/crm && git add backend/src/services/whatsappService.ts');

    // 3. Commit
    console.log('💾 Fazendo commit...');
    const commitResult = await ssh.execCommand(
      'cd /root/crm && git commit -m "fix: Corrigir loop infinito de reconexão do WhatsApp\n\n- Removido reconexão automática para timeouts e erros de QR Code\n- Reconexão apenas para erros de servidor (5xx)\n- Aumentado intervalo de reconexão de 3s para 10s\n- Loop infinito que causava 73+ erros nos logs foi completamente eliminado"'
    );
    console.log(commitResult.stdout);
    if (commitResult.stderr) console.log(commitResult.stderr);

    // 4. Push
    console.log('\n🚀 Fazendo push para o GitHub...');
    const pushResult = await ssh.execCommand('cd /root/crm && git push origin main');
    console.log(pushResult.stdout);
    if (pushResult.stderr) console.log(pushResult.stderr);

    ssh.dispose();
    console.log('\n✅ Commit e push concluídos com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    ssh.dispose();
  }
}

commitCorrecao();
