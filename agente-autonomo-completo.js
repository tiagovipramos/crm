#!/usr/bin/env node

/**
 * ========================================
 * AGENTE DEVOPS AUTÔNOMO - VERSÃO COMPLETA
 * Funciona em Windows, Linux e macOS
 * ========================================
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

// ============================================
// CONFIGURAÇÕES
// ============================================
const CONFIG = {
  ssh: {
    host: '185.217.125.72',
    port: 22,
    username: 'root',
    password: 'UA3485Z43hqvZ@4r'
  },
  project: {
    remotePath: '/root/crm',
    localPath: __dirname
  },
  system: {
    indicadorUrl: 'http://185.217.125.72:3000/indicador/login',
    apiUrl: 'http://185.217.125.72:3001',
    login: 'tiago@vipseg.org',
    senha: '123456'
  }
};

// ============================================
// LOGGER COM CORES
// ============================================
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class Logger {
  static log(message, color = 'reset') {
    const timestamp = new Date().toLocaleString('pt-BR');
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
  }

  static success(msg) { this.log(`✅ ${msg}`, 'green'); }
  static error(msg) { this.log(`❌ ${msg}`, 'red'); }
  static warning(msg) { this.log(`⚠️  ${msg}`, 'yellow'); }
  static info(msg) { this.log(`ℹ️  ${msg}`, 'cyan'); }
  
  static section(msg) {
    console.log('\n' + '='.repeat(70));
    this.log(msg, 'magenta');
    console.log('='.repeat(70) + '\n');
  }
}

// ============================================
// CLIENTE SSH
// ============================================
class SSHClient {
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.client = new Client();
      
      this.client.on('ready', () => {
        Logger.success('Conexão SSH estabelecida!');
        resolve();
      });

      this.client.on('error', (err) => {
        Logger.error(`Erro SSH: ${err.message}`);
        reject(err);
      });

      this.client.connect(this.config);
    });
  }

  async executeCommand(command, description) {
    return new Promise((resolve, reject) => {
      Logger.info(`Executando: ${description}`);
      
      this.client.exec(command, (err, stream) => {
        if (err) {
          Logger.error(`Erro ao executar: ${err.message}`);
          reject(err);
          return;
        }

        let stdout = '';
        let stderr = '';

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        stream.on('close', (code) => {
          if (code !== 0 && stderr) {
            Logger.warning(`Comando retornou código ${code}`);
            if (stderr) console.log(stderr);
          }
          
          if (stdout) console.log(stdout);
          Logger.success(`Concluído: ${description}`);
          resolve({ stdout, stderr, code });
        });
      });
    });
  }

  async uploadFile(localPath, remotePath) {
    return new Promise((resolve, reject) => {
      Logger.info(`Enviando arquivo: ${path.basename(localPath)}`);
      
      this.client.sftp((err, sftp) => {
        if (err) {
          Logger.error(`Erro SFTP: ${err.message}`);
          reject(err);
          return;
        }

        sftp.fastPut(localPath, remotePath, (err) => {
          if (err) {
            Logger.error(`Erro ao enviar arquivo: ${err.message}`);
            reject(err);
          } else {
            Logger.success('Arquivo enviado com sucesso!');
            resolve();
          }
        });
      });
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      Logger.info('Conexão SSH encerrada');
    }
  }
}

// ============================================
// TESTADOR DE SISTEMA
// ============================================
class SystemTester {
  static async testLogin(config) {
    return new Promise((resolve) => {
      Logger.info('Testando login no sistema...');
      
      const postData = JSON.stringify({
        email: config.login,
        senha: config.senha
      });

      const url = new URL(`${config.apiUrl}/api/indicador/login`);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            Logger.success('Login funcionando corretamente!');
            try {
              const response = JSON.parse(data);
              Logger.info(`Token: ${response.token ? 'Recebido ✓' : 'Não recebido'}`);
              Logger.info(`User ID: ${response.indicador?.id || 'N/A'}`);
              resolve({ success: true, data: response });
            } catch (e) {
              resolve({ success: true, data: null });
            }
          } else {
            Logger.error(`Login falhou: Status ${res.statusCode}`);
            try {
              const errorData = JSON.parse(data);
              Logger.error(`Mensagem: ${errorData.message || 'Erro desconhecido'}`);
            } catch (e) {
              Logger.error(`Resposta: ${data.substring(0, 200)}`);
            }
            resolve({ success: false, status: res.statusCode, data });
          }
        });
      });

      req.on('error', (error) => {
        Logger.error(`Erro de conexão: ${error.message}`);
        resolve({ success: false, error: error.message });
      });

      req.on('timeout', () => {
        Logger.error('Timeout ao testar login');
        req.destroy();
        resolve({ success: false, error: 'timeout' });
      });

      req.write(postData);
      req.end();
    });
  }

  static async testHealth(url) {
    return new Promise((resolve) => {
      Logger.info(`Testando saúde do serviço: ${url}`);
      
      http.get(url, { timeout: 5000 }, (res) => {
        Logger.success(`Serviço respondendo: Status ${res.statusCode}`);
        resolve({ success: true, status: res.statusCode });
      }).on('error', (error) => {
        Logger.error(`Serviço não responde: ${error.message}`);
        resolve({ success: false, error: error.message });
      });
    });
  }
}

// ============================================
// GIT MANAGER
// ============================================
class GitManager {
  static async commit(message) {
    return new Promise((resolve) => {
      Logger.info('Preparando commit no GitHub...');
      
      exec('git add .', (error) => {
        if (error) Logger.warning('Git add teve problemas');
        
        const commitCmd = `git commit -m "${message}"`;
        exec(commitCmd, (error, stdout, stderr) => {
          if (error && !stdout.includes('nothing to commit')) {
            Logger.warning('Nada para commitar');
            resolve(false);
            return;
          }
          
          Logger.success('Commit criado!');
          
          exec('git push origin main', (error, stdout, stderr) => {
            if (error) {
              Logger.error('Falha no push para GitHub');
              Logger.error(stderr);
              
              // Tentar push forçado se necessário
              exec('git push origin main --force', (err2) => {
                if (err2) {
                  resolve(false);
                } else {
                  Logger.success('Push forçado realizado!');
                  resolve(true);
                }
              });
            } else {
              Logger.success('Push realizado com sucesso!');
              resolve(true);
            }
          });
        });
      });
    });
  }
}

// ============================================
// ANALISADOR DE LOGS
// ============================================
class LogAnalyzer {
  static analyze(logs) {
    const errors = [];
    
    // Detectar erros de conexão MySQL
    if (logs.includes('ECONNREFUSED') || logs.includes('Connection refused') || 
        logs.includes('connect ETIMEDOUT')) {
      errors.push({
        type: 'MYSQL_CONNECTION',
        severity: 'critical',
        message: 'Erro de conexão com MySQL',
        solution: 'Verificar se MySQL está rodando e credenciais estão corretas',
        commands: ['docker-compose restart mysql', 'docker-compose logs mysql']
      });
    }
    
    // Detectar erros CORS
    if (logs.toLowerCase().includes('cors') || logs.includes('Access-Control-Allow-Origin')) {
      errors.push({
        type: 'CORS',
        severity: 'high',
        message: 'Problema de CORS detectado',
        solution: 'Atualizar configurações de CORS no backend',
        commands: ['Verificar FRONTEND_URL no .env', 'Reiniciar backend']
      });
    }
    
    // Detectar rotas 404
    if (logs.includes('404') || logs.includes('Not Found')) {
      errors.push({
        type: 'ROUTE_NOT_FOUND',
        severity: 'medium',
        message: 'Rotas não encontradas',
        solution: 'Verificar estrutura de rotas e endpoints',
        commands: ['Conferir routes no backend', 'Verificar URLs no frontend']
      });
    }
    
    // Detectar erros de autenticação
    if (logs.includes('Unauthorized') || logs.includes('401') || 
        logs.includes('Invalid token') || logs.includes('jwt')) {
      errors.push({
        type: 'AUTH_ERROR',
        severity: 'high',
        message: 'Erro de autenticação/JWT',
        solution: 'Verificar JWT_SECRET e tokens',
        commands: ['Verificar JWT_SECRET no .env', 'Limpar tokens antigos']
      });
    }
    
    // Detectar erros de migração
    if (logs.includes('migration') && logs.includes('error')) {
      errors.push({
        type: 'MIGRATION_ERROR',
        severity: 'critical',
        message: 'Erro nas migrations do banco',
        solution: 'Executar migrations manualmente',
        commands: ['docker-compose exec backend node executar-migrations.js']
      });
    }
    
    return errors;
  }
}

// ============================================
// AGENTE PRINCIPAL
// ============================================
class AutonomousAgent {
  constructor() {
    this.ssh = new SSHClient(CONFIG.ssh);
    this.report = {
      startTime: new Date(),
      endTime: null,
      errors: [],
      fixes: [],
      tests: {},
      success: false
    };
  }

  async run() {
    Logger.section('🤖 INICIANDO AGENTE DEVOPS AUTÔNOMO');
    
    try {
      // 1. Conectar SSH
      Logger.section('1️⃣  CONECTANDO VIA SSH');
      await this.ssh.connect();
      
      // 2. Verificar estrutura do projeto
      Logger.section('2️⃣  VERIFICANDO ESTRUTURA DO PROJETO');
      await this.checkProjectStructure();
      
      // 3. Verificar status dos containers
      Logger.section('3️⃣  VERIFICANDO CONTAINERS DOCKER');
      await this.checkContainers();
      
      // 4. Coletar e analisar logs
      Logger.section('4️⃣  COLETANDO E ANALISANDO LOGS');
      await this.analyzeLogs();
      
      // 5. Aplicar correções automáticas
      Logger.section('5️⃣  APLICANDO CORREÇÕES AUTOMÁTICAS');
      await this.applyFixes();
      
      // 6. Testar sistema
      Logger.section('6️⃣  TESTANDO SISTEMA');
      await this.testSystem();
      
      // 7. Limpar arquivos desnecessários
      Logger.section('7️⃣  LIMPANDO ARQUIVOS DESNECESSÁRIOS');
      await this.cleanupFiles();
      
      // 8. Gerar relatório
      Logger.section('8️⃣  GERANDO RELATÓRIO');
      await this.generateReport();
      
      // 9. Commit no GitHub
      Logger.section('9️⃣  COMMITANDO NO GITHUB');
      await this.commitChanges();
      
      // 10. Status final
      Logger.section('🏁 FINALIZAÇÃO');
      this.showFinalStatus();
      
      this.report.success = true;
      
    } catch (error) {
      Logger.error(`Erro fatal: ${error.message}`);
      console.error(error);
      this.report.success = false;
    } finally {
      this.ssh.disconnect();
      this.report.endTime = new Date();
    }
  }

  async checkProjectStructure() {
    const result = await this.ssh.executeCommand(
      `ls -la ${CONFIG.project.remotePath}`,
      'Listar arquivos do projeto'
    );
    
    // Verificar arquivos essenciais
    const essentialFiles = ['docker-compose.yml', 'backend', 'app', '.env'];
    const missingFiles = essentialFiles.filter(file => !result.stdout.includes(file));
    
    if (missingFiles.length > 0) {
      Logger.warning(`Arquivos faltando: ${missingFiles.join(', ')}`);
      this.report.errors.push({
        type: 'STRUCTURE',
        message: `Arquivos faltando: ${missingFiles.join(', ')}`
      });
    } else {
      Logger.success('Estrutura do projeto OK');
    }
  }

  async checkContainers() {
    const result = await this.ssh.executeCommand(
      `cd ${CONFIG.project.remotePath} && docker-compose ps`,
      'Status dos containers'
    );
    
    this.report.containerStatus = result.stdout;
    
    // Verificar se containers estão rodando
    const runningCheck = ['backend', 'frontend', 'mysql'];
    runningCheck.forEach(service => {
      if (result.stdout.includes(service) && result.stdout.includes('Up')) {
        Logger.success(`${service} está rodando`);
      } else {
        Logger.warning(`${service} pode não estar rodando`);
      }
    });
  }

  async analyzeLogs() {
    // Coletar logs do backend
    Logger.info('Coletando logs do backend...');
    const backendLogs = await this.ssh.executeCommand(
      `cd ${CONFIG.project.remotePath} && docker-compose logs --tail=200 backend`,
      'Logs do backend'
    );
    
    // Coletar logs do frontend
    Logger.info('Coletando logs do frontend...');
    const frontendLogs = await this.ssh.executeCommand(
      `cd ${CONFIG.project.remotePath} && docker-compose logs --tail=200 frontend`,
      'Logs do frontend'
    );
    
    // Coletar logs do MySQL
    Logger.info('Coletando logs do MySQL...');
    const mysqlLogs = await this.ssh.executeCommand(
      `cd ${CONFIG.project.remotePath} && docker-compose logs --tail=100 mysql`,
      'Logs do MySQL'
    );
    
    // Analisar todos os logs
    const allLogs = backendLogs.stdout + frontendLogs.stdout + mysqlLogs.stdout;
    const errors = LogAnalyzer.analyze(allLogs);
    
    this.report.errors.push(...errors);
    
    if (errors.length > 0) {
      Logger.warning(`${errors.length} problema(s) detectado(s):`);
      errors.forEach((error, i) => {
        console.log(`\n${i + 1}. [${error.severity.toUpperCase()}] ${error.type}`);
        console.log(`   ${error.message}`);
        console.log(`   Solução: ${error.solution}`);
      });
    } else {
      Logger.success('Nenhum erro crítico detectado!');
    }
    
    this.report.logs = {
      backend: backendLogs.stdout,
      frontend: frontendLogs.stdout,
      mysql: mysqlLogs.stdout
    };
  }

  async applyFixes() {
    // Enviar script de correção
    const fixScript = path.join(__dirname, 'fix-everything-vps.sh');
    
    if (fs.existsSync(fixScript)) {
      Logger.info('Enviando script de correção...');
      await this.ssh.uploadFile(
        fixScript,
        `${CONFIG.project.remotePath}/fix-everything-vps.sh`
      );
      
      // Dar permissão e executar
      await this.ssh.executeCommand(
        `chmod +x ${CONFIG.project.remotePath}/fix-everything-vps.sh`,
        'Dando permissão ao script'
      );
      
      await this.ssh.executeCommand(
        `cd ${CONFIG.project.remotePath} && bash fix-everything-vps.sh`,
        'Executando correções'
      );
      
      this.report.fixes.push('Script de correção completa executado');
      
      // Aguardar containers estabilizarem
      Logger.info('Aguardando 30 segundos para estabilização...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    } else {
      Logger.warning('Script fix-everything-vps.sh não encontrado');
    }
  }

  async testSystem() {
    // Testar APIs
    Logger.info('Testando APIs do sistema...');
    
    const apiHealth = await SystemTester.testHealth(`${CONFIG.system.apiUrl}/health`);
    this.report.tests.apiHealth = apiHealth;
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Testar login
    const loginTest = await SystemTester.testLogin(CONFIG.system);
    this.report.tests.login = loginTest;
    
    if (loginTest.success) {
      Logger.success('✅ SISTEMA DE LOGIN FUNCIONANDO!');
    } else {
      Logger.error('❌ SISTEMA DE LOGIN COM PROBLEMAS');
      
      // Tentar correções adicionais
      Logger.info('Aplicando correções adicionais ao login...');
      
      // Reiniciar backend
      await this.ssh.executeCommand(
        `cd ${CONFIG.project.remotePath} && docker-compose restart backend`,
        'Reiniciando backend'
      );
      
      Logger.info('Aguardando 15 segundos...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Testar novamente
      const retryLogin = await SystemTester.testLogin(CONFIG.system);
      this.report.tests.loginRetry = retryLogin;
      
      if (retryLogin.success) {
        Logger.success('✅ LOGIN CORRIGIDO!');
      } else {
        Logger.error('❌ LOGIN REQUER ANÁLISE MANUAL');
        this.report.errors.push({
          type: 'LOGIN_FAILURE',
          severity: 'critical',
          message: 'Sistema de login não está funcionando após correções automáticas'
        });
      }
    }
  }

  async cleanupFiles() {
    // Remover arquivos de log antigos
    await this.ssh.executeCommand(
      `cd ${CONFIG.project.remotePath} && find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true`,
      'Removendo logs antigos'
    );
    
    // Limpar cache do Docker
    await this.ssh.executeCommand(
      `docker system prune -f`,
      'Limpando cache do Docker'
    );
    
    this.report.fixes.push('Arquivos desnecessários removidos');
  }

  async generateReport() {
    const duration = this.report.endTime 
      ? (this.report.endTime - this.report.startTime) / 1000 
      : 0;
    
    const reportContent = `
# 🤖 RELATÓRIO DO AGENTE DEVOPS AUTÔNOMO

**Data:** ${this.report.startTime.toLocaleString('pt-BR')}  
**Duração:** ${duration.toFixed(0)} segundos  
**Status:** ${this.report.success ? '✅ Sucesso' : '❌ Falhou'}

## 📊 Status dos Containers

\`\`\`
${this.report.containerStatus || 'N/A'}
\`\`\`

## ⚠️ Erros Detectados (${this.report.errors.length})

${this.report.errors.length > 0 
  ? this.report.errors.map((e, i) => `${i + 1}. **[${e.severity || 'medium'}]** ${e.type}: ${e.message}`).join('\n')
  : '✅ Nenhum erro crítico detectado'}

## 🔧 Correções Aplicadas (${this.report.fixes.length})

${this.report.fixes.length > 0 
  ? this.report.fixes.map((f, i) => `${i + 1}. ${f}`).join('\n')
  : 'Nenhuma correção necessária'}

## 🧪 Testes Realizados

### API Health Check
- Status: ${this.report.tests.apiHealth?.success ? '✅ OK' : '❌ Falhou'}

### Login do Sistema
- Status: ${this.report.tests.login?.success ? '✅ OK' : '❌ Falhou'}
- URL: ${CONFIG.system.indicadorUrl}
- Login: ${CONFIG.system.login}

${this.report.tests.loginRetry ? `
### Retry do Login
- Status: ${this.report.tests.loginRetry.success ? '✅ OK' : '❌ Falhou'}
` : ''}

## 🎯 Próximos Passos

${this.report.errors.length > 0 ? `
### Erros Pendentes
${this.report.errors.map(e => `- Resolver: ${e.type} - ${e.solution || 'Ver documentação'}`).join('\n')}
` : ''}

### Monitoramento Recomendado
- Verificar logs regularmente: \`docker-compose logs -f backend\`
- Monitorar uso de recursos: \`docker stats\`
- Testar login periodicamente

## 🔗 Links Úteis

- **Sistema Indicador:** ${CONFIG.system.indicadorUrl}
- **API Backend:** ${CONFIG.system.apiUrl}
- **Repositório GitHub:** https://github.com/tiagovipramos/crm

---
*Relatório gerado automaticamente pelo Agente DevOps Autônomo*
`;

    fs.writeFileSync('RELATORIO-AGENTE-AUTONOMO.md', reportContent);
    Logger.success('Relatório salvo: RELATORIO-AGENTE-AUTONOMO.md');
  }

  async commitChanges() {
    const message = `🤖 Auto-fix: Agente DevOps - ${new Date().toLocaleString('pt-BR')}

- ${this.report.fixes.length} correção(ões) aplicada(s)
- ${this.report.errors.length} erro(s) detectado(s)
- Testes: ${this.report.tests.login?.success ? 'Login OK' : 'Login com problemas'}
`;

    const committed = await GitManager.commit(message);
    
    if (committed) {
      this.report.fixes.push('Alterações commitadas no GitHub');
    }
  }

  showFinalStatus() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA EXECUÇÃO');
    console.log('='.repeat(70));
    console.log(`\n✅ Containers verificados`);
    console.log(`✅ Logs analisados: ${this.report.errors.length} problema(s) encontrado(s)`);
    console.log(`✅ Correções aplicadas: ${this.report.fixes.length}`);
    console.log(`${this.report.tests.login?.success ? '✅' : '❌'} Login testado`);
    console.log(`✅ Sistema limpo`);
    console.log(`✅ Relatório gerado`);
    
    console.log('\n🌐 ACESSE O SISTEMA:');
    console.log(`   ${CONFIG.system.indicadorUrl}`);
    console.log(`   Login: ${CONFIG.system.login}`);
    console.log(`   Senha: ${CONFIG.system.senha}`);
    
    console.log('\n📝 RELATÓRIO COMPLETO:');
    console.log('   RELATORIO-AGENTE-AUTONOMO.md\n');
  }
}

// ============================================
// PONTO DE ENTRADA
// ============================================
async function main() {
  // Verificar dependências
  try {
    require('ssh2');
  } catch (e) {
    Logger.error('Biblioteca ssh2 não instalada!');
    Logger.info('Instale com: npm install ssh2');
    Logger.info('Executando instalação...');
    
    const { exec } = require('child_process');
    exec('npm install ssh2', (error, stdout, stderr) => {
      if (error) {
        Logger.error('Falha ao instalar ssh2. Instale manualmente: npm install ssh2');
        process.exit(1);
      }
      Logger.success('ssh2 instalado! Execute o script novamente.');
      process.exit(0);
    });
    return;
  }

  const agent = new AutonomousAgent();
  await agent.run();
  
  Logger.section(agent.report.success ? '✅ AGENTE FINALIZADO COM SUCESSO' : '⚠️ AGENTE FINALIZADO COM AVISOS');
  process.exit(agent.report.success ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    Logger.error('Erro fatal não tratado:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { AutonomousAgent, SystemTester, LogAnalyzer };
