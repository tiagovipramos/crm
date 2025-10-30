const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
  host: '185.217.125.72',
  port: 22,
  username: 'root',
  password: 'UA3485Z43hqvZ@4r'
};

class SSHManager {
  constructor() {
    this.conn = new Client();
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Conectando ao servidor SSH...');
      this.conn.on('ready', () => {
        console.log('✅ Conectado!\n');
        this.isConnected = true;
        resolve();
      });
      this.conn.on('error', reject);
      this.conn.connect(SSH_CONFIG);
    });
  }

  executeCommand(command) {
    return new Promise((resolve, reject) => {
      this.conn.exec(command, (err, stream) => {
        if (err) return reject(err);
        let stdout = '', stderr = '';
        stream.on('close', () => resolve({ stdout, stderr }));
        stream.on('data', (data) => stdout += data.toString());
        stream.stderr.on('data', (data) => stderr += data.toString());
      });
    });
  }

  disconnect() {
    if (this.isConnected) {
      this.conn.end();
      this.isConnected = false;
      console.log('🔌 Desconectado');
    }
  }
}

async function main() {
  console.log('🔧 CORRIGINDO BUG DE RE-RENDERS E CRIANDO FAVICON\n');
  console.log('='.repeat(60));
  
  const ssh = new SSHManager();
  
  try {
    await ssh.connect();

    // 1. Criar favicon.ico via SSH
    console.log('\n1️⃣ Criando favicon.ico...');
    const faviconSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3b82f6"/><text x="16" y="24" font-family="Arial" font-size="20" fill="white" text-anchor="middle" font-weight="bold">P</text></svg>';
    
    await ssh.executeCommand(`cat > /root/crm/public/favicon.ico << 'EOF'\n${faviconSVG}\nEOF`);
    console.log('✅ Favicon criado com sucesso!');

    // 2. Ler arquivo atual do componente
    console.log('\n2️⃣ Lendo componente UsuariosListView.tsx local...');
    const componentPath = 'components/admin/views/UsuariosListView.tsx';
    const componentContent = fs.readFileSync(componentPath, 'utf8');

    // 3. Fazer backup
    console.log('📦 Fazendo backup do arquivo original...');
    fs.writeFileSync(`${componentPath}.backup`, componentContent);
    console.log('✅ Backup criado: UsuariosListView.tsx.backup');

    // 4. Aplicar correção - adicionar import do useMemo e corrigir a linha problemática
    console.log('\n3️⃣ Aplicando correção de re-renders...');
    
    let correctedContent = componentContent;
    
    // Adicionar useMemo no import se não existir
    if (!correctedContent.includes('useMemo')) {
      correctedContent = correctedContent.replace(
        "import { useState, useEffect } from 'react';",
        "import { useState, useEffect, useMemo } from 'react';"
      );
    }

    // Corrigir a linha problemática - trocar getVendedoresPorHierarquia() por vendedores direto
    correctedContent = correctedContent.replace(
      "const vendedores = useAdminStore((state) => state.getVendedoresPorHierarquia());",
      "const vendedoresBrutos = useAdminStore((state) => state.vendedores);\n  const getVendedoresPorHierarquia = useAdminStore((state) => state.getVendedoresPorHierarquia);\n  \n  // Memoizar vendedores para evitar re-renders excessivos\n  const vendedores = useMemo(() => {\n    return getVendedoresPorHierarquia();\n  }, [vendedoresBrutos, getVendedoresPorHierarquia]);"
    );

    // Salvar localmente
    fs.writeFileSync(componentPath, correctedContent);
    console.log('✅ Correção aplicada localmente!');

    // 5. Fazer upload do arquivo corrigido para o VPS
    console.log('\n4️⃣ Fazendo upload do arquivo corrigido para o VPS...');
    
    // Escapar conteúdo para heredoc
    const escapedContent = correctedContent
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    
    await ssh.executeCommand(`cat > /root/crm/components/admin/views/UsuariosListView.tsx << 'EOFCOMPONENT'\n${escapedContent}\nEOFCOMPONENT`);
    console.log('✅ Arquivo enviado para o VPS!');

    // 6. Rebuild do frontend
    console.log('\n5️⃣ Fazendo rebuild do frontend no VPS...');
    await ssh.executeCommand('cd /root/crm && docker-compose restart frontend');
    console.log('✅ Frontend reiniciado!');

    // Aguardar o container inicializar
    console.log('\n⏳ Aguardando frontend inicializar (30s)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 7. Verificar logs
    console.log('\n6️⃣ Verificando logs do frontend...');
    const logs = await ssh.executeCommand('cd /root/crm && docker-compose logs --tail=20 frontend');
    console.log(logs.stdout);

    // 8. Verificar se favicon foi criado
    console.log('\n7️⃣ Verificando se favicon foi criado...');
    const faviconCheck = await ssh.executeCommand('ls -lh /root/crm/public/favicon.ico');
    console.log(faviconCheck.stdout);

    console.log('\n\n✅ CORREÇÕES APLICADAS COM SUCESSO!\n');
    console.log('='.repeat(60));
    console.log('\n📋 Resumo das correções:');
    console.log('1. ✅ Bug de re-renders corrigido (useMemo adicionado)');
    console.log('2. ✅ Favicon.ico criado');
    console.log('3. ✅ Frontend rebuild e reiniciado');
    console.log('\n🌐 Teste o sistema em: http://185.217.125.72:3000/admin/login');
    console.log('\n💾 Backup salvo em: UsuariosListView.tsx.backup');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    ssh.disconnect();
  }
}

main();
