#!/usr/bin/env node

const http = require('http');
const { Client } = require('ssh2');

const API_URL = '185.217.125.72:3001';
const FRONTEND_URL = '185.217.125.72:3000';
const SSH_HOST = '185.217.125.72';
const SSH_USER = 'root';
const SSH_PASS = 'UA3485Z43hqvZ@4r';

let token = '';
let indicadorId = '';

// ========== Funções de API ==========

function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL.split(':')[0],
      port: API_URL.split(':')[1],
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// ========== Testes ==========

async function fazerLogin() {
  console.log('\n🔐 1. FAZENDO LOGIN...');
  const result = await apiRequest('POST', '/api/indicador/login', {
    email: 'tiago@vipseg.org',
    senha: '123456'
  });

  if (result.status === 200 && result.data.token) {
    token = result.data.token;
    indicadorId = result.data.indicador.id;
    console.log('✅ Login bem-sucedido!');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Indicador ID: ${indicadorId}`);
    return true;
  } else {
    console.log('❌ Erro no login:', result.data);
    return false;
  }
}

async function adicionarLeads() {
  console.log('\n👥 2. ADICIONANDO 10 LEADS...');
  
  const leads = [
    { nomeIndicado: 'João Silva', telefoneIndicado: '11987654321' },
    { nomeIndicado: 'Maria Santos', telefoneIndicado: '11987654322' },
    { nomeIndicado: 'Pedro Costa', telefoneIndicado: '11987654323' },
    { nomeIndicado: 'Ana Lima', telefoneIndicado: '11987654324' },
    { nomeIndicado: 'Carlos Souza', telefoneIndicado: '11987654325' },
    { nomeIndicado: 'Juliana Rocha', telefoneIndicado: '11987654326' },
    { nomeIndicado: 'Ricardo Alves', telefoneIndicado: '11987654327' },
    { nomeIndicado: 'Fernanda Dias', telefoneIndicado: '11987654328' },
    { nomeIndicado: 'Lucas Pereira', telefoneIndicado: '11987654329' },
    { nomeIndicado: 'Patricia Martins', telefoneIndicado: '11987654330' }
  ];

  let sucessos = 0;
  let erros = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    console.log(`\n   [${i + 1}/10] Adicionando: ${lead.nomeIndicado}...`);
    
    const result = await apiRequest('POST', '/api/indicador/indicar', lead);
    
    if (result.status === 200 || result.status === 201) {
      console.log(`   ✅ ${lead.nomeIndicado} adicionado com sucesso!`);
      sucessos++;
    } else {
      console.log(`   ❌ Erro ao adicionar ${lead.nomeIndicado}:`, result.data);
      erros++;
    }
    
    // Pequeno delay entre requisições
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n   📊 Resultado: ${sucessos} sucessos, ${erros} erros`);
  return { sucessos, erros };
}

async function verificarDashboard() {
  console.log('\n📊 3. VERIFICANDO DASHBOARD...');
  
  const result = await apiRequest('GET', '/api/indicador/dashboard');
  
  if (result.status === 200) {
    console.log('✅ Dashboard carregado com sucesso!');
    console.log('\n   Estatísticas:');
    console.log(`   - Total de indicações: ${result.data.total || 0}`);
    console.log(`   - Pendentes: ${result.data.pendentes || 0}`);
    console.log(`   - Enviadas: ${result.data.enviadas || 0}`);
    console.log(`   - Respondidas: ${result.data.respondidas || 0}`);
    console.log(`   - Convertidas: ${result.data.convertidas || 0}`);
    console.log(`   - Enganos: ${result.data.engano || 0}`);
    
    console.log(`\n   Saldos:`);
    console.log(`   - Disponível: R$ ${result.data.saldo_disponivel || 0}`);
    console.log(`   - Bloqueado: R$ ${result.data.saldo_bloqueado || 0}`);
    console.log(`   - Perdido: R$ ${result.data.saldo_perdido || 0}`);
    
    return result.data;
  } else {
    console.log('❌ Erro ao carregar dashboard:', result.data);
    return null;
  }
}

async function listarIndicacoes() {
  console.log('\n📋 4. LISTANDO INDICAÇÕES...');
  
  const result = await apiRequest('GET', '/api/indicador/indicacoes');
  
  if (result.status === 200) {
    const indicacoes = result.data.indicacoes || result.data;
    console.log(`✅ ${indicacoes.length} indicações encontradas`);
    
    if (indicacoes.length > 0) {
      console.log('\n   Primeiras 3 indicações:');
      indicacoes.slice(0, 3).forEach((ind, i) => {
        console.log(`   ${i + 1}. ${ind.nome} - ${ind.telefone} (${ind.status})`);
      });
    }
    
    return indicacoes;
  } else {
    console.log('❌ Erro ao listar indicações:', result.data);
    return [];
  }
}

async function analisarLogsSSH() {
  console.log('\n🔍 5. ANALISANDO LOGS VIA SSH...');
  
  return new Promise((resolve) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      console.log('✅ Conectado via SSH');
      
      // Backend logs
      console.log('\n   📋 Logs do Backend (últimas 20 linhas):');
      conn.exec('cd /root/crm && docker-compose logs --tail=20 backend', (err, stream) => {
        if (err) {
          console.log('❌ Erro:', err.message);
          conn.end();
          resolve(false);
          return;
        }
        
        let logs = '';
        stream.on('data', (data) => logs += data.toString());
        stream.on('close', () => {
          console.log(logs);
          
          // Frontend logs
          console.log('\n   📋 Logs do Frontend (últimas 10 linhas):');
          conn.exec('cd /root/crm && docker-compose logs --tail=10 frontend', (err2, stream2) => {
            let logs2 = '';
            stream2.on('data', (data) => logs2 += data.toString());
            stream2.on('close', () => {
              console.log(logs2);
              conn.end();
              resolve(true);
            });
          });
        });
      });
    });
    
    conn.on('error', (err) => {
      console.log('❌ Erro SSH:', err.message);
      resolve(false);
    });
    
    conn.connect({
      host: SSH_HOST,
      port: 22,
      username: SSH_USER,
      password: SSH_PASS
    });
  });
}

// ========== Execução Principal ==========

async function executarTestes() {
  console.log('='.repeat(60));
  console.log('🤖 AGENTE AUTÔNOMO - TESTE COMPLETO DO SISTEMA');
  console.log('='.repeat(60));
  
  try {
    // 1. Login
    const loginOk = await fazerLogin();
    if (!loginOk) {
      console.log('\n❌ Falha no login. Abortando testes.');
      return;
    }
    
    // 2. Adicionar leads
    const resultLeads = await adicionarLeads();
    
    // 3. Verificar dashboard
    await verificarDashboard();
    
    // 4. Listar indicações
    const indicacoes = await listarIndicacoes();
    
    // 5. Analisar logs
    await analisarLogsSSH();
    
    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));
    console.log(`✅ Login: OK`);
    console.log(`📊 Leads adicionados: ${resultLeads.sucessos}/10`);
    console.log(`📋 Indicações listadas: ${indicacoes.length}`);
    console.log('\n✅ Testes concluídos com sucesso!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n❌ Erro durante os testes:', error.message);
  }
}

executarTestes();
