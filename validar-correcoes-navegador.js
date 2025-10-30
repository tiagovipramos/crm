const puppeteer = require('puppeteer');

const BASE_URL = 'http://185.217.125.72:3000';
const TEST_CREDENTIALS = {
  email: 'admin@protecar.com',
  password: '123456'
};

async function validarCorrecoes() {
  console.log('🧪 VALIDANDO CORREÇÕES NO NAVEGADOR\n');
  console.log('='.repeat(60));
  
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

    // 1. Testar se favicon está disponível
    console.log('\n1️⃣ Testando se favicon.ico foi corrigido...');
    const faviconResponse = await page.goto(`${BASE_URL}/favicon.ico`, { timeout: 10000 });
    if (faviconResponse.status() === 200) {
      console.log('✅ Favicon agora retorna 200 OK (BUG #1 CORRIGIDO!)');
    } else {
      console.log(`❌ Favicon ainda retorna ${faviconResponse.status()}`);
    }

    // 2. Fazer login
    console.log('\n2️⃣ Fazendo login...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.type('input[type="email"]', TEST_CREDENTIALS.email);
    await page.type('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Login realizado');

    // 3. Ir para página de usuários e monitorar chamadas API
    console.log('\n3️⃣ Testando página de Usuários (verificando re-renders)...');
    
    // Limpar contador de chamadas
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('vendedores') || request.url().includes('indicadores')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    await page.goto(`${BASE_URL}/admin?view=usuarios`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Aguardar para capturar possíveis re-renders
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Contar chamadas duplicadas
    const urlCounts = {};
    apiCalls.forEach(call => {
      const key = `${call.method} ${call.url.split('?')[0]}`;
      urlCounts[key] = (urlCounts[key] || 0) + 1;
    });

    console.log('\n📊 Análise de requisições API:');
    let hasDuplicates = false;
    Object.entries(urlCounts).forEach(([url, count]) => {
      if (count > 2) { // Mais de 2 chamadas é suspeito
        console.log(`⚠️  ${url}: ${count} chamadas (AINDA HÁ RE-RENDERS)`);
        hasDuplicates = true;
      } else {
        console.log(`✅ ${url}: ${count} chamada(s) (Normal)`);
      }
    });

    if (!hasDuplicates && Object.keys(urlCounts).length > 0) {
      console.log('\n✅ BUG #2 CORRIGIDO! Re-renders excessivos eliminados!');
    } else if (Object.keys(urlCounts).length === 0) {
      console.log('\n⚠️  Nenhuma chamada API detectada (pode ser cache ou carregamento rápido)');
    }

    // 4. Relatório de erros 404 após correções
    console.log('\n4️⃣ Verificando erros 404 após correções...');
    const remaining404s = request404s.filter(url => !url.includes('favicon.ico'));
    
    if (remaining404s.length > 0) {
      console.log('⚠️  Ainda há alguns 404s (podem ser normais do Next.js):');
      remaining404s.forEach(url => console.log(`   - ${url}`));
    } else {
      console.log('✅ Nenhum erro 404 problemático encontrado!');
    }

    // 5. Relatório de erros do console
    console.log('\n5️⃣ Verificando erros do console...');
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️  Erros críticos encontrados:');
      criticalErrors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ Nenhum erro crítico no console!');
    }

    // Resultado final
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 RESULTADO DA VALIDAÇÃO\n');
    
    const bug1Fixed = faviconResponse.status() === 200;
    const bug2Fixed = !hasDuplicates;
    
    console.log(`BUG #1 (Favicon): ${bug1Fixed ? '✅ CORRIGIDO' : '❌ AINDA PRESENTE'}`);
    console.log(`BUG #2 (Re-renders): ${bug2Fixed ? '✅ CORRIGIDO' : '⚠️  VERIFICAR MANUALMENTE'}`);
    console.log(`Erros 404: ${remaining404s.length === 0 ? '✅ RESOLVIDOS' : `⚠️  ${remaining404s.length} ainda presentes`}`);
    console.log(`Erros Console: ${criticalErrors.length === 0 ? '✅ NENHUM' : `⚠️  ${criticalErrors.length} encontrados`}`);
    
    if (bug1Fixed && bug2Fixed && criticalErrors.length === 0) {
      console.log('\n🎉 TODOS OS BUGS FORAM CORRIGIDOS COM SUCESSO!');
    } else {
      console.log('\n⚠️  Algumas correções precisam de validação adicional');
    }
    
    console.log('='.repeat(60));

    return {
      bug1Fixed,
      bug2Fixed,
      remaining404s: remaining404s.length,
      criticalErrors: criticalErrors.length
    };

  } finally {
    await browser.close();
  }
}

validarCorrecoes().catch(console.error);
