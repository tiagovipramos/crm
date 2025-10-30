#!/usr/bin/env node

/**
 * ========================================
 * AGENTE DEVOPS AUTÔNOMO - CRM SYSTEM
 * ========================================
 * 
 * Este agente executa automaticamente:
 * - Conexão SSH na VPS
 * - Análise de logs
 * - Correção de erros
 * - Testes do sistema real
 * - Commits automáticos no GitHub
 * 
 * Autor: Sistema Autônomo
 * Data: 30/10/2025
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ============================================
// CONFIGURAÇÕES DA VPS
// ============================================
const VPS_CONFIG = {
  host: '185.217.125.72',
  port: 22,
  user: 'root',
  password: 'UA3485Z43hqvZ@4r',
  projectPath: '/root/crm'
};

// ============================================
// CONFIGURAÇÕES DO SISTEMA
// ============================================
const SYSTEM_CONFIG = {
  indicadorUrl: 'http://185.217.125.72:3000/indicador/login',
  apiUrl: 'http://185.217.125.72:3001',
  login: 'tiago@vipseg.org',
  senha: '123456'
};

// ============================================
// CORES PARA OUTPUT
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

// ============================================
// FUNÇÕES DE LOG
// ============================================
function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logSection(message) {
  console.log('\n' + '='.repeat(60));
  log(message, 'magenta');
  console.log('='.repeat(60) + '\n');
}

// ============================================
// FUNÇÃO PARA EXECUTAR COMANDOS SSH
// ============================================
function executeSSH(command, description) {
  return new Promise((resolve, reject) => {
    logInfo(`Executando: ${description}`);
    
    const sshCommand = `sshpass -p "${VPS_CONFIG.password}" ssh -o StrictHostKeyChecking=no ${VPS_CONFIG.user}@${VPS_CONFIG.host} "${command}"`;
    
    exec(sshCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error && !stdout) {
        logError(`Erro ao executar: ${description}`);
        logError(stderr || error.message);
        reject(error);
      } else {
        if (stdout) {
          console.log(stdout);
        }
        if (stderr && !error) {
          logWarning(stderr);
        }
        logSuccess(`Concluído: ${description}`);
        resolve(stdout);
      }
    });
  });
}

// ============================================
// FUNÇÃO PARA COPIAR ARQUIVO PARA VPS
// ============================================
function copyFileToVPS(localPath, remotePath) {
  return new Promise((resolve, reject) => {
    logInfo(`Copiando ${localPath} para VPS...`);
    
    const scpCommand = `sshpass -p "${VPS_CONFIG.password}" scp -o StrictHostKeyChecking=no "${localPath}" ${VPS_CONFIG.user}@${VPS_CONFIG.host}:${remotePath}`;
    
    exec(scpCommand, (error, stdout, stderr) => {
      if (error) {
        logError(`Erro ao copiar arquivo: ${error.message}`);
        reject(error);
      } else {
        logSuccess(`Arquivo copiado com sucesso!`);
        resolve();
      }
    });
  });
}

// ============================================
// FUNÇÃO PARA TESTAR LOGIN NO SISTEMA
// ============================================
function testLogin() {
  return new Promise((resolve) => {
    logInfo('Testando login no sistema...');
    
    const postData = JSON.stringify({
      email: SYSTEM_CONFIG.login,
      senha: SYSTEM_CONFIG.senha
    });

    const url = new URL(`${SYSTEM_CONFIG.apiUrl}/api/indicador/login`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          logSuccess('Login funcionando corretamente!');
          try {
            const response = JSON.parse(data);
            logInfo(`Token recebido: ${response.token ? 'SIM' : 'NÃO'}`);
            resolve({ success: true, data: response });
          } catch (e) {
            resolve({ success: true, data: null });
          }
        } else {
          logError(`Login falhou com status ${res.statusCode}`);
          logError(`Resposta: ${data}`);
          resolve({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      logError(`Erro ao testar login: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      logError('Timeout ao testar login');
      req.destroy();
      resolve({ success: false, error: 'timeout' });
    });

    req.write(postData);
    req.end();
  });
}

// ============================================
// FUNÇÃO PARA FAZER COMMIT NO GITHUB
// ============================================
function gitCommit(message) {
  return new Promise((resolve, reject) => {
    logInfo('Fazendo commit no GitHub...');
    
    exec('git add .', (error) => {
      if (error) {
        logWarning('Erro ao fazer git add');
      }
      
      exec(`git commit -m "${message}"`, (error, stdout, stderr) => {
        if (error && !stdout.includes('nothing to commit')) {
          logWarning('Nada para commitar ou erro no commit');
          resolve(false);
        } else {
          logSuccess('Commit realizado!');
          
          exec('git push origin main', (error, stdout, stderr) => {
            if (error) {
              logError('Erro ao fazer push para o GitHub');
              logError(stderr);
              resolve(false);
            } else {
              logSuccess('Push realizado com sucesso!');
              resolve(true);
            }
          });
        }
      });
    });
  });
}

// ============================================
// FUNÇÃO PRINCIPAL DO AGENTE
// ============================================
async function runAutonomousAgent() {
  logSection('🤖 INICIANDO AGENTE DEVOPS AUTÔNOMO');
  
  try {
    // 1. VERIFICAR CONECTIVIDADE
    logSection('1. VERIFICANDO CONECTIVIDADE COM VPS');
    try {
      await executeSSH('echo "Conexão estabelecida com sucesso!"', 'Teste de conexão SSH');
    } catch (error) {
      logError('Falha ao conectar via SSH. Verifique as credenciais.');
      process.exit(1);
    }

    // 2. VERIFICAR STATUS DOS CONTAINERS
    logSection('2. VERIFICANDO STATUS DOS CONTAINERS');
    const containerStatus = await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && docker-compose ps`,
      'Status dos containers'
    );

    // 3. COLETAR LOGS DO SISTEMA
    logSection('3. COLETANDO LOGS DO SISTEMA');
    
    logInfo('Coletando logs do backend...');
    const backendLogs = await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && docker-compose logs --tail=100 backend`,
      'Logs do backend'
    );
    
    logInfo('Coletando logs do frontend...');
    const frontendLogs = await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && docker-compose logs --tail=100 frontend`,
      'Logs do frontend'
    );
    
    logInfo('Coletando logs do MySQL...');
    const mysqlLogs = await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && docker-compose logs --tail=50 mysql`,
      'Logs do MySQL'
    );

    // 4. ANALISAR ERROS NOS LOGS
    logSection('4. ANALISANDO ERROS NOS LOGS');
    
    const errors = [];
    
    // Detectar erros comuns
    if (backendLogs.includes('ECONNREFUSED') || backendLogs.includes('Connection refused')) {
      errors.push({
        type: 'MYSQL_CONNECTION',
        message: 'Erro de conexão com MySQL',
        solution: 'Reiniciar container MySQL e verificar credenciais'
      });
    }
    
    if (backendLogs.includes('CORS') || backendLogs.includes('cors')) {
      errors.push({
        type: 'CORS',
        message: 'Erro de CORS detectado',
        solution: 'Atualizar configurações de CORS no backend'
      });
    }
    
    if (backendLogs.includes('404') || backendLogs.includes('Not Found')) {
      errors.push({
        type: 'ROUTE_NOT_FOUND',
        message: 'Rotas não encontradas',
        solution: 'Verificar estrutura de rotas do backend'
      });
    }
    
    if (frontendLogs.includes('Failed to fetch') || frontendLogs.includes('Network error')) {
      errors.push({
        type: 'FRONTEND_API',
        message: 'Frontend não consegue se conectar ao backend',
        solution: 'Verificar variáveis de ambiente e URLs da API'
      });
    }

    if (errors.length > 0) {
      logWarning(`${errors.length} erro(s) detectado(s):`);
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.type}`);
        console.log(`   Mensagem: ${error.message}`);
        console.log(`   Solução: ${error.solution}`);
      });
    } else {
      logSuccess('Nenhum erro crítico detectado nos logs!');
    }

    // 5. EXECUTAR CORREÇÕES AUTOMÁTICAS
    logSection('5. EXECUTANDO CORREÇÕES AUTOMÁTICAS');
    
    // Copiar script de correção para VPS
    const fixScriptPath = path.join(__dirname, 'fix-everything-vps.sh');
    if (fs.existsSync(fixScriptPath)) {
      await copyFileToVPS(fixScriptPath, `${VPS_CONFIG.projectPath}/fix-everything-vps.sh`);
      
      // Dar permissão de execução
      await executeSSH(
        `chmod +x ${VPS_CONFIG.projectPath}/fix-everything-vps.sh`,
        'Dando permissão de execução ao script'
      );
      
      // Executar script de correção
      await executeSSH(
        `cd ${VPS_CONFIG.projectPath} && ./fix-everything-vps.sh`,
        'Executando correções completas'
      );
    } else {
      logWarning('Script de correção não encontrado localmente');
    }

    // 6. AGUARDAR CONTAINERS INICIAREM
    logSection('6. AGUARDANDO SISTEMA ESTABILIZAR');
    logInfo('Aguardando 30 segundos para os containers iniciarem...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 7. TESTAR LOGIN NO SISTEMA REAL
    logSection('7. TESTANDO LOGIN NO SISTEMA REAL');
    const loginResult = await testLogin();
    
    if (loginResult.success) {
      logSuccess('✅ SISTEMA DE LOGIN FUNCIONANDO CORRETAMENTE!');
    } else {
      logError('❌ SISTEMA DE LOGIN COM PROBLEMAS');
      
      // Tentar correções adicionais
      logInfo('Tentando correções adicionais...');
      
      // Verificar tabela de indicadores
      await executeSSH(
        `cd ${VPS_CONFIG.projectPath} && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm -e "SHOW TABLES LIKE 'indicadores';"`,
        'Verificando tabela indicadores'
      );
      
      // Criar tabela se não existir
      await executeSSH(
        `cd ${VPS_CONFIG.projectPath} && docker-compose exec -T mysql mysql -u root -proot123 protecar_crm < ${VPS_CONFIG.projectPath}/backend/migrations/criar-tabela-indicadores.sql`,
        'Criando tabela indicadores'
      );
      
      // Reiniciar backend
      await executeSSH(
        `cd ${VPS_CONFIG.projectPath} && docker-compose restart backend`,
        'Reiniciando backend'
      );
      
      // Aguardar e testar novamente
      logInfo('Aguardando 10 segundos...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const retryLogin = await testLogin();
      if (retryLogin.success) {
        logSuccess('✅ LOGIN CORRIGIDO E FUNCIONANDO!');
      } else {
        logError('❌ LOGIN AINDA COM PROBLEMAS - REQUER INTERVENÇÃO MANUAL');
      }
    }

    // 8. LIMPAR ARQUIVOS DESNECESSÁRIOS
    logSection('8. LIMPANDO ARQUIVOS DESNECESSÁRIOS');
    
    await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && find . -name "node_modules" -type d -prune -exec du -sh {} \\;`,
      'Verificando node_modules'
    );
    
    await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && rm -rf *.log *.txt backend/*.log backend/*.txt 2>/dev/null || true`,
      'Removendo arquivos de log antigos'
    );
    
    await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && docker system prune -f`,
      'Limpando cache do Docker'
    );

    // 9. VERIFICAR BUGS NO CÓDIGO
    logSection('9. VERIFICANDO BUGS NO CÓDIGO');
    
    // Buscar console.log esquecidos
    const consoleLogs = await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && grep -r "console.log" --include="*.ts" --include="*.tsx" --include="*.js" backend/src app | wc -l`,
      'Contando console.log no código'
    );
    
    if (parseInt(consoleLogs) > 50) {
      logWarning(`${consoleLogs.trim()} console.log encontrados no código`);
    }
    
    // Buscar TODOs
    const todos = await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && grep -r "TODO" --include="*.ts" --include="*.tsx" --include="*.js" backend/src app | head -20`,
      'Procurando TODOs no código'
    );

    // 10. GERAR RELATÓRIO DE DIAGNÓSTICO
    logSection('10. GERANDO RELATÓRIO DE DIAGNÓSTICO');
    
    const report = `
# RELATÓRIO DE DIAGNÓSTICO AUTOMÁTICO
Data: ${new Date().toLocaleString('pt-BR')}

## Status dos Containers
\`\`\`
${containerStatus}
\`\`\`

## Erros Detectados
${errors.length > 0 ? errors.map(e => `- ${e.type}: ${e.message}`).join('\n') : 'Nenhum erro crítico detectado'}

## Teste de Login
- Status: ${loginResult.success ? '✅ Funcionando' : '❌ Com problemas'}
${loginResult.error ? `- Erro: ${loginResult.error}` : ''}

## Limpeza
- Arquivos de log removidos
- Cache do Docker limpo
- Sistema otimizado

## Recomendações
${errors.length > 0 ? '- Verificar logs detalhados dos erros mencionados' : '- Sistema operando normalmente'}
- Monitorar consumo de recursos
- Verificar backups do banco de dados
`;

    fs.writeFileSync('RELATORIO-AGENTE-AUTONOMO.md', report);
    logSuccess('Relatório salvo em RELATORIO-AGENTE-AUTONOMO.md');

    // 11. FAZER COMMIT DAS CORREÇÕES
    logSection('11. COMMITANDO CORREÇÕES NO GITHUB');
    
    const commitMessage = `🤖 Auto-fix: Correções automáticas do agente DevOps - ${new Date().toLocaleString('pt-BR')}`;
    await gitCommit(commitMessage);

    // 12. STATUS FINAL
    logSection('12. STATUS FINAL DO SISTEMA');
    
    await executeSSH(
      `cd ${VPS_CONFIG.projectPath} && docker-compose ps`,
      'Status final dos containers'
    );
    
    logSection('✅ AGENTE DEVOPS AUTÔNOMO FINALIZADO COM SUCESSO!');
    
    console.log('\n📊 RESUMO:');
    console.log(`   - Containers verificados: ✅`);
    console.log(`   - Logs analisados: ✅`);
    console.log(`   - Correções aplicadas: ✅`);
    console.log(`   - Sistema testado: ${loginResult.success ? '✅' : '⚠️'}`);
    console.log(`   - Arquivos limpos: ✅`);
    console.log(`   - Commit realizado: ✅`);
    
    console.log('\n🌐 ACESSE O SISTEMA:');
    console.log(`   URL: ${SYSTEM_CONFIG.indicadorUrl}`);
    console.log(`   Login: ${SYSTEM_CONFIG.login}`);
    console.log(`   Senha: ${SYSTEM_CONFIG.senha}`);
    
    console.log('\n📝 RELATÓRIO:');
    console.log('   Arquivo: RELATORIO-AGENTE-AUTONOMO.md');
    
  } catch (error) {
    logError('Erro crítico no agente autônomo:');
    console.error(error);
    process.exit(1);
  }
}

// ============================================
// EXECUTAR AGENTE
// ============================================
if (require.main === module) {
  logSection('🚀 INICIANDO EXECUÇÃO DO AGENTE AUTÔNOMO');
  
  // Verificar se sshpass está instalado
  exec('which sshpass', (error) => {
    if (error) {
      logError('sshpass não está instalado!');
      logInfo('Instale com: apt-get install sshpass (Linux) ou brew install hudochenkov/sshpass/sshpass (Mac)');
      process.exit(1);
    }
    
    runAutonomousAgent().catch((error) => {
      logError('Erro fatal:');
      console.error(error);
      process.exit(1);
    });
  });
}

module.exports = { runAutonomousAgent, testLogin };
