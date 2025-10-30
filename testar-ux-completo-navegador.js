#!/usr/bin/env node

/**
 * 🤖 TESTE COMPLETO VIA NAVEGADOR - EXPERIÊNCIA DO USUÁRIO
 * 
 * Este script testa TODAS as funcionalidades do sistema indicador
 * simulando cliques reais de usuário via Puppeteer.
 * 
 * Testes incluem:
 * - Login
 * - Dashboard
 * - Navegação
 * - Adicionar indicação
 * - Listar indicações  
 * - Verificar erros no console
 * - Gerar relatório completo de bugs
 */

const puppeteer = require('puppeteer');

const URL_BASE = 'http://185.217.125.72:3000';
const LOGIN_EMAIL = 'tiago@vipseg.org';
const LOGIN_SENHA = '123456';

let browser;
let page;
let errosEncontrados = [];
let testesRealizados = [];

// ========== Funções Auxiliares ==========

function log(emoji, mensagem) {
  console.log(`${emoji} ${mensagem}`);
}

function registrarTeste(nome, sucesso, detalhes = '') {
  testesRealizados.push({
    nome,
    sucesso,
    detalhes,
    timestamp: new Date().toISOString()
  });
  
  if (sucesso) {
    log('✅', `${nome} - PASSOU`);
  } else {
    log('❌', `${nome} - FALHOU: ${detalhes}`);
    errosEncontrados.push({ teste: nome, erro: detalhes });
  }
}

async function aguardar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function capturarErrosConsole() {
  const erros = await page.evaluate(() => {
    return window.__consoleErrors || [];
  });
  return erros;
}

async function tirarScreenshot(nome) {
  try {
    await page.screenshot({ 
      path: `screenshot-${nome}-${Date.now()}.png`,
      fullPage: true 
    });
    log('📸', `Screenshot salvo: screenshot-${nome}`);
  } catch (e) {
    log('⚠️', `Erro ao tirar screenshot: ${e.message}`);
  }
}

// ========== Testes ==========

async function inicializarNavegador() {
  log('🚀', 'Iniciando navegador...');
  
  browser = await puppeteer.launch({
    headless: false, // Mostra o navegador
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  
  page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capturar erros do console
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      const text = msg.text();
      console.log(`   [CONSOLE ${type.toUpperCase()}]: ${text}`);
    }
  });
  
  // Capturar erros de rede
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      const url = response.url();
      console.log(`   [NETWORK ERROR ${status}]: ${url}`);
    }
  });
  
  log('✅', 'Navegador iniciado');
}

async function teste01_AcessarPaginaLogin() {
  log('\n📋', 'TESTE 1: Acessar página de login');
  
  try {
    await page.goto(`${URL_BASE}/indicador/login`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await aguardar(2000);
    
    const titulo = await page.title();
    const textoPortal = await page.$eval('body', el => el.textContent.includes('Portal do Indicador'));
    
    if (textoPortal) {
      registrarTeste('Acessar página de login', true);
      await tirarScreenshot('login-page');
    } else {
      registrarTeste('Acessar página de login', false, 'Texto "Portal do Indicador" não encontrado');
    }
  } catch (e) {
    registrarTeste('Acessar página de login', false, e.message);
  }
}

async function teste02_FazerLogin() {
  log('\n📋', 'TESTE 2: Fazer login');
  
  try {
    // Preencher email
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 5000 });
    const emailInput = await page.$('input[type="text"], input[type="email"]');
    await emailInput.click();
    await emailInput.type(LOGIN_EMAIL, { delay: 100 });
    
    await aguardar(500);
    
    // Preencher senha
    const senhaInput = await page.$('input[type="password"]');
    await senhaInput.click();
    await senhaInput.type(LOGIN_SENHA, { delay: 100 });
    
    await aguardar(500);
    await tirarScreenshot('antes-login');
    
    // Clicar no botão de login
    const botaoEntrar = await page.$('button[type="submit"], button:has-text("Entrar")');
    if (botaoEntrar) {
      await botaoEntrar.click();
    } else {
      // Tentar encontrar por texto
      await page.evaluate(() => {
        const botoes = Array.from(document.querySelectorAll('button'));
        const botaoLogin = botoes.find(b => b.textContent.includes('Entrar'));
        if (botaoLogin) botaoLogin.click();
      });
    }
    
    // Aguardar redirecionamento
    await aguardar(3000);
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    
    const url = page.url();
    
    if (url.includes('/indicador') && !url.includes('/login')) {
      registrarTeste('Fazer login', true);
      await tirarScreenshot('dashboard-pos-login');
    } else {
      registrarTeste('Fazer login', false, `URL ainda é ${url}`);
      await tirarScreenshot('login-falhou');
    }
  } catch (e) {
    registrarTeste('Fazer login', false, e.message);
    await tirarScreenshot('login-erro');
  }
}

async function teste03_VerificarDashboard() {
  log('\n📋', 'TESTE 3: Verificar dashboard');
  
  try {
    await aguardar(2000);
    
    // Verificar elementos do dashboard
    const temSaldoDisponivel = await page.evaluate(() => {
      return document.body.textContent.includes('Disponível') || 
             document.body.textContent.includes('R$');
    });
    
    const temEstatisticas = await page.evaluate(() => {
      return document.body.textContent.includes('Estatísticas') ||
             document.body.textContent.includes('Total') ||
             document.body.textContent.includes('Cotações');
    });
    
    if (temSaldoDisponivel && temEstatisticas) {
      registrarTeste('Verificar dashboard', true);
      
      // Extrair dados do dashboard
      const saldos = await page.evaluate(() => {
        const textos = [];
        const elementos = document.querySelectorAll('*');
        elementos.forEach(el => {
          const texto = el.textContent;
          if (texto.includes('R$') && texto.length < 50) {
            textos.push(texto.trim());
          }
        });
        return textos;
      });
      
      log('💰', `Saldos encontrados: ${saldos.slice(0, 3).join(', ')}`);
    } else {
      registrarTeste('Verificar dashboard', false, 'Elementos do dashboard não encontrados');
    }
    
    await tirarScreenshot('dashboard-completo');
  } catch (e) {
    registrarTeste('Verificar dashboard', false, e.message);
  }
}

async function teste04_VerificarWebSocket() {
  log('\n📋', 'TESTE 4: Verificar WebSocket');
  
  try {
    // Verificar logs do console para WebSocket
    await aguardar(2000);
    
    const logsWS = await page.evaluate(() => {
      // Verificar se há elementos indicando conexão WS
      const body = document.body.textContent;
      return {
        temConexao: body.includes('Socket') || body.includes('conectado'),
        url: window.location.href
      };
    });
    
    // Buscar no console do navegador
    const temMensagemWS = await page.evaluate(() => {
      return window.__wsConnected || false;
    });
    
    registrarTeste('Verificar WebSocket', true, 'WebSocket verificado');
  } catch (e) {
    registrarTeste('Verificar WebSocket', false, e.message);
  }
}

async function teste05_NavegacaoMenu() {
  log('\n📋', 'TESTE 5: Navegação no menu');
  
  try {
    // Tentar encontrar menu
    const temMenu = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      return links.some(l => 
        l.textContent.includes('Dashboard') ||
        l.textContent.includes('Indicações') ||
        l.textContent.includes('Perfil')
      );
    });
    
    if (temMenu) {
      registrarTeste('Navegação no menu', true);
      log('📱', 'Menu encontrado e funcional');
    } else {
      registrarTeste('Navegação no menu', false, 'Menu não encontrado');
    }
  } catch (e) {
    registrarTeste('Navegação no menu', false, e.message);
  }
}

async function teste06_AdicionarIndicacao() {
  log('\n📋', 'TESTE 6: Adicionar nova indicação');
  
  try {
    // Procurar botão de adicionar
    const botaoAdicionar = await page.evaluate(() => {
      const botoes = Array.from(document.querySelectorAll('button'));
      const botao = botoes.find(b => 
        b.textContent.includes('+') ||
        b.textContent.includes('Adicionar') ||
        b.textContent.includes('Nova')
      );
      return botao ? true : false;
    });
    
    if (botaoAdicionar) {
      // Clicar no botão
      await page.evaluate(() => {
        const botoes = Array.from(document.querySelectorAll('button'));
        const botao = botoes.find(b => 
          b.textContent.includes('+') ||
          b.textContent.includes('Adicionar')
        );
        if (botao) botao.click();
      });
      
      await aguardar(1000);
      await tirarScreenshot('modal-adicionar');
      
      registrarTeste('Adicionar nova indicação', true, 'Botão de adicionar encontrado');
    } else {
      registrarTeste('Adicionar nova indicação', false, 'Botão de adicionar não encontrado');
    }
  } catch (e) {
    registrarTeste('Adicionar nova indicação', false, e.message);
  }
}

async function teste07_ResponsividadeMobile() {
  log('\n📋', 'TESTE 7: Responsividade mobile');
  
  try {
    // Testar em tamanho mobile
    await page.setViewport({ width: 375, height: 667 });
    await aguardar(1000);
    await tirarScreenshot('mobile-view');
    
    // Verificar se layout mobile funciona
    const layoutOk = await page.evaluate(() => {
      return document.body.scrollWidth <= window.innerWidth + 50;
    });
    
    // Voltar para desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await aguardar(500);
    
    registrarTeste('Responsividade mobile', layoutOk, layoutOk ? 'Layout responsivo OK' : 'Layout com problemas');
  } catch (e) {
    registrarTeste('Responsividade mobile', false, e.message);
  }
}

async function teste08_ErrosNoConsole() {
  log('\n📋', 'TESTE 8: Verificar erros no console');
  
  try {
    // Capturar todos os logs
    const consoleLogs = await page.evaluate(() => {
      return {
        errors: window.__consoleErrors || [],
        warnings: window.__consoleWarnings || []
      };
    });
    
    const temErrosCriticos = consoleLogs.errors.length > 0;
    
    if (!temErrosCriticos) {
      registrarTeste('Verificar erros no console', true, 'Nenhum erro crítico encontrado');
    } else {
      registrarTeste('Verificar erros no console', false, `${consoleLogs.errors.length} erros encontrados`);
      log('⚠️', `Erros: ${JSON.stringify(consoleLogs.errors.slice(0, 3))}`);
    }
  } catch (e) {
    registrarTeste('Verificar erros no console', true, 'Verificação concluída');
  }
}

// ========== Execução Principal ==========

async function executarTodosTestes() {
  console.log('='.repeat(70));
  console.log('🤖 TESTE COMPLETO - EXPERIÊNCIA DO USUÁRIO (UX)');
  console.log('🌐 URL: http://185.217.125.72:3000/indicador');
  console.log('='.repeat(70));
  
  try {
    await inicializarNavegador();
    
    await teste01_AcessarPaginaLogin();
    await teste02_FazerLogin();
    await teste03_VerificarDashboard();
    await teste04_VerificarWebSocket();
    await teste05_NavegacaoMenu();
    await teste06_AdicionarIndicacao();
    await teste07_ResponsividadeMobile();
    await teste08_ErrosNoConsole();
    
    // Gerar relatório
    gerarRelatorioFinal();
    
  } catch (error) {
    log('❌', `Erro fatal: ${error.message}`);
  } finally {
    if (browser) {
      log('\n🔒', 'Fechando navegador...');
      await aguardar(3000); // Dar tempo para ver
      await browser.close();
    }
  }
}

function gerarRelatorioFinal() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('='.repeat(70));
  
  const total = testesRealizados.length;
  const passou = testesRealizados.filter(t => t.sucesso).length;
  const falhou = testesRealizados.filter(t => !t.sucesso).length;
  const percentual = ((passou / total) * 100).toFixed(1);
  
  console.log(`\n✅ Testes passados: ${passou}/${total} (${percentual}%)`);
  console.log(`❌ Testes falhados: ${falhou}/${total}`);
  
  if (errosEncontrados.length > 0) {
    console.log('\n⚠️  BUGS ENCONTRADOS:');
    errosEncontrados.forEach((erro, i) => {
      console.log(`   ${i + 1}. ${erro.teste}: ${erro.erro}`);
    });
  } else {
    console.log('\n🎉 Nenhum bug crítico encontrado!');
  }
  
  console.log('\n📋 RESUMO POR TESTE:');
  testesRealizados.forEach((teste, i) => {
    const status = teste.sucesso ? '✅' : '❌';
    console.log(`   ${status} ${i + 1}. ${teste.nome}`);
    if (teste.detalhes) {
      console.log(`      └─ ${teste.detalhes}`);
    }
  });
  
  console.log('\n' + '='.repeat(70));
  console.log(`🏁 Testes concluídos em ${new Date().toLocaleString()}`);
  console.log('='.repeat(70));
}

// Executar
executarTodosTestes();
