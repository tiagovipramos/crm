const { Client } = require('ssh2');
const fs = require('fs');

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
  console.log('🔍 INVESTIGANDO ESTRUTURA DO PROJETO NO VPS\n');
  const ssh = new SSHManager();
  
  try {
    await ssh.connect();

    // 1. Verificar estrutura do projeto
    console.log('1️⃣ Estrutura do projeto /root/crm:');
    const estrutura = await ssh.executeCommand('cd /root/crm && find . -maxdepth 3 -type d | head -30');
    console.log(estrutura.stdout);

    // 2. Verificar se existe favicon
    console.log('\n2️⃣ Verificando favicon:');
    const favicon = await ssh.executeCommand('ls -la /root/crm/public/favicon* 2>/dev/null || echo "Não encontrado"');
    console.log(favicon.stdout);

    // 3. Verificar estrutura de páginas do app
    console.log('\n3️⃣ Estrutura do diretório app:');
    const appStruct = await ssh.executeCommand('cd /root/crm && find ./app -type f -name "*.tsx" -o -name "*.ts" | grep -E "(admin|crm)" | head -20');
    console.log(appStruct.stdout);

    // 4. Verificar next.config.js
    console.log('\n4️⃣ Verificando configuração Next.js:');
    const nextConfig = await ssh.executeCommand('cat /root/crm/next.config.js');
    console.log(nextConfig.stdout);

    // 5. Verificar se há arquivo page.tsx em admin/users
    console.log('\n5️⃣ Procurando arquivo de usuários:');
    const usersPage = await ssh.executeCommand('find /root/crm/app -path "*admin*users*" -name "*.tsx" 2>/dev/null');
    console.log(usersPage.stdout || 'Nenhum arquivo encontrado');

    // 6. Verificar logs do container frontend para entender os 404s
    console.log('\n6️⃣ Logs recentes do frontend (últimas 20 linhas):');
    const frontendLogs = await ssh.executeCommand('cd /root/crm && docker-compose logs --tail=20 frontend');
    console.log(frontendLogs.stdout);

    // 7. Verificar se o build do Next.js está correto
    console.log('\n7️⃣ Verificando build do Next.js no container:');
    const buildCheck = await ssh.executeCommand('docker exec crm-frontend ls -la .next/ 2>/dev/null | head -20');
    console.log(buildCheck.stdout);

    console.log('\n\n📊 ANÁLISE COMPLETA\n');
    console.log('Próximos passos:');
    console.log('1. Adicionar favicon.ico no diretório public');
    console.log('2. Verificar rotas do Next.js');
    console.log('3. Investigar por que páginas retornam 404 mesmo carregando');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    ssh.disconnect();
  }
}

main();
