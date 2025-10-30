const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();

async function baixarECorrigirWhatsApp() {
  try {
    console.log('🔌 Conectando ao servidor VPS...');
    
    await ssh.connect({
      host: '185.217.125.72',
      username: 'root',
      password: 'UA3485Z43hqvZ@4r',
      port: 22
    });

    console.log('✅ Conectado!\n');

    // Baixar o arquivo whatsappService.ts
    console.log('📥 Baixando whatsappService.ts...');
    await ssh.getFile(
      './backend-whatsappService.ts',
      '/root/crm/backend/src/services/whatsappService.ts'
    );
    console.log('✅ Arquivo baixado: backend-whatsappService.ts\n');

    // Ler o arquivo
    const conteudo = fs.readFileSync('./backend-whatsappService.ts', 'utf8');
    
    // Verificar se há o problema de loop infinito
    console.log('🔍 Analisando código...');
    
    const problemas = [];
    
    // Procurar por reconexão automática problemática
    if (conteudo.includes('setTimeout') && conteudo.includes('reconnect')) {
      problemas.push('❌ Encontrado: Reconexão automática com setTimeout');
    }
    
    if (conteudo.includes('Tentando reconectar WhatsApp')) {
      problemas.push('❌ Encontrado: Lógica de reconexão que causa loop');
    }

    if (conteudo.includes('qr-timeout')) {
      problemas.push('⚠️ Encontrado: Timeout de QR Code');
    }

    console.log('\n📋 Problemas identificados:');
    problemas.forEach(p => console.log(p));

    console.log('\n\n✅ Arquivo baixado com sucesso!');
    console.log('📁 Local: ./backend-whatsappService.ts');
    console.log('\n🔧 Próximo passo: Analisar e corrigir o código');

    ssh.dispose();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    ssh.dispose();
  }
}

baixarECorrigirWhatsApp();
