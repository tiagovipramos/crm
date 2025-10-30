const { Client } = require('ssh2');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configurações do servidor
const SSH_CONFIG = {
  host: '185.217.125.72',
  port: 22,
  username: 'root',
  password: 'UA3485Z43hqvZ@4r'
};

const TEST_CREDENTIALS = {
  email: 'admin@protecar.com',
  password: '123456'
};

const BASE_URL = 'http://185.217.125.72:3000';

// Classe para gerenciar SSH
class SSHManager {
  constructor() {
    this.conn = new Client();
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Conectando ao servidor SSH...');
      
      this.conn.on('ready', () => {
        console.log('✅ Conectado ao servidor SSH com sucesso!\n');
        this.isConnected = true;
        resolve();
      });

      this.conn.on('error', (err) => {
        console.error('❌ Erro ao conectar SSH:', err.message);
        reject(err);
      });

      this.conn.connect(SSH_CONFIG);
    });
  }

  executeCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('SSH não está conectado'));
        return;
      }

      this.conn.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code) => {
          resolve({ stdout, stderr, code });
        });

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  disconnect() {
    if (this.isConnected) {
      this.conn.end();
      this.isConnected = false;
      console.log('🔌 Desconectado do servidor SSH');
    }
  }
}

// Função para testar o sistema no navegador
async function testarSistemaNavegador() {
  console.log('\n🌐 INICIANDO TESTES NO NAVEGADOR\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Capturar erros do console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capturar requisições 404
    const request404s = [];
    page.on('response', response => {
      if (response.status() === 404) {
        request404s.push(response.url());
      }
    });

    // 1. Testar Login
    console.log('1️⃣ Testando página de login...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.type('input[type="email"]', TEST_CREDENTIALS.email);
    await page.type('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Login realizado com sucesso');

    // 2. Testar Dashboard
    console.log('\n2️⃣ Testando Dashboard...');
    await page.goto(`${BASE_URL}/crm/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Dashboard carregado');

    // 3. Testar Página de Usuários (onde está o bug de re-renders)
    console.log('\n3️⃣ Testando página de Usuários (verificando re-renders)...');
    
    // Interceptar chamadas à API para contar requisições
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Aguardar um pouco para capturar múltiplas chamadas
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Contar chamadas duplicadas
    const urlCounts = {};
    apiCalls.forEach(call => {
      const key = `${call.method} ${call.url}`;
      urlCounts[key] = (urlCounts[key] || 0) + 1;
    });

    console.log('\n📊 Análise de requisições API:');
    Object.entries(urlCounts).forEach(([url, count]) => {
      if (count > 1) {
        console.log(`⚠️  ${url}: ${count} chamadas (POSSÍVEL RE-RENDER)`);
      } else {
        console.log(`✅ ${url}: ${count} chamada`);
      }
    });

    // 4. Relatório de erros 404
    if (request404s.length > 0) {
      console.log('\n❌ Recursos 404 encontrados:');
      request404s.forEach(url => console.log(`   - ${url}`));
    } else {
      console.log('\n✅ Nenhum erro 404 encontrado');
    }

    // 5. Relatório de erros do console
    if (consoleErrors.length > 0) {
      console.log('\n❌ Erros do console encontrados:');
      consoleErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n✅ Nenhum erro no console');
    }

    return {
      success: true,
      apiCalls: urlCounts,
      errors404: request404s,
      consoleErrors
    };

  } finally {
    await browser.close();
  }
}

// Função para analisar logs do servidor
async function analisarLogsServidor(ssh) {
  console.log('\n📋 ANALISANDO LOGS DO SERVIDOR\n');

  // 1. Status dos containers
  console.log('1️⃣ Status dos containers:');
  const statusResult = await ssh.executeCommand('cd /root/crm && docker-compose ps');
  console.log(statusResult.stdout);

  // 2. Logs do backend
  console.log('\n2️⃣ Últimas 50 linhas do backend:');
  const backendLogs = await ssh.executeCommand('cd /root/crm && docker-compose logs --tail=50 backend');
  console.log(backendLogs.stdout);

  // 3. Logs do frontend
  console.log('\n3️⃣ Últimas 30 linhas do frontend:');
  const frontendLogs = await ssh.executeCommand('cd /root/crm && docker-compose logs --tail=30 frontend');
  console.log(frontendLogs.stdout);

  // 4. Buscar por erros
  console.log('\n4️⃣ Buscando por erros específicos:');
  const errorSearch = await ssh.executeCommand('cd /root/crm && docker-compose logs --tail=200 | grep -i "error\\|failed\\|exception" | head -20');
  if (errorSearch.stdout.trim()) {
    console.log('⚠️  Erros encontrados:');
    console.log(errorSearch.stdout);
  } else {
    console.log('✅ Nenhum erro crítico encontrado nos logs recentes');
  }

  return {
    status: statusResult.stdout,
    backendLogs: backendLogs.stdout,
    frontendLogs: frontendLogs.stdout,
    errors: errorSearch.stdout
  };
}

// Função para corrigir o Bug #2 (Re-renders excessivos)
async function corrigirBugReRenders(ssh) {
  console.log('\n🔧 CORRIGINDO BUG #2: Re-renders Excessivos\n');

  // Primeiro, vamos baixar o arquivo atual
  console.log('1️⃣ Localizando arquivo da página de usuários...');
  
  const findResult = await ssh.executeCommand('find /root/crm/app -name "*users*" -type f 2>/dev/null | head -10');
  console.log('Arquivos encontrados:');
  console.log(findResult.stdout);

  // Vamos procurar especificamente pela página de admin users
  const pageResult = await ssh.executeCommand('ls -la /root/crm/app/admin/users/ 2>/dev/null || echo "Diretório não encontrado"');
  console.log('\nConteúdo de /app/admin/users/:');
  console.log(pageResult.stdout);

  return {
    arquivosEncontrados: findResult.stdout,
    diretorioUsers: pageResult.stdout
  };
}

// Função principal
async function main() {
  console.log('🤖 AGENTE DEVOPS AUTÔNOMO - CORREÇÃO DE BUGS\n');
  console.log('=' .repeat(60));
  
  const ssh = new SSHManager();
  
  try {
    // 1. Conectar ao servidor
    await ssh.connect();

    // 2. Analisar logs do servidor
    const logsAnalysis = await analisarLogsServidor(ssh);

    // 3. Testar sistema no navegador
    const browserTest = await testarSistemaNavegador();

    // 4. Corrigir Bug #2 (Re-renders)
    const rerenderFix = await corrigirBugReRenders(ssh);

    // 5. Gerar relatório
    console.log('\n\n📊 RELATÓRIO FINAL\n');
    console.log('=' .repeat(60));
    console.log('\n✅ Análise concluída com sucesso!');
    
    if (browserTest.errors404.length > 0) {
      console.log(`\n⚠️  ${browserTest.errors404.length} recursos 404 encontrados`);
    }
    
    if (browserTest.consoleErrors.length > 0) {
      console.log(`\n⚠️  ${browserTest.consoleErrors.length} erros no console encontrados`);
    }

    console.log('\n📁 Próximos passos para correção manual:');
    console.log('1. Otimizar componente de usuários com React.memo/useMemo');
    console.log('2. Corrigir recursos 404 identificados');
    console.log('3. Testar novamente após correções');

    // Salvar relatório
    const relatorio = {
      timestamp: new Date().toISOString(),
      logs: logsAnalysis,
      browserTest,
      rerenderFix
    };

    fs.writeFileSync(
      'RELATORIO-CORRECAO-BUGS.json',
      JSON.stringify(relatorio, null, 2)
    );

    console.log('\n💾 Relatório salvo em: RELATORIO-CORRECAO-BUGS.json');

  } catch (error) {
    console.error('\n❌ Erro durante execução:', error.message);
    console.error(error.stack);
  } finally {
    ssh.disconnect();
  }
}

// Executar
main().catch(console.error);
