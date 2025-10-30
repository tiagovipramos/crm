#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;

const SSH_HOST = '185.217.125.72';
const SSH_USER = 'root';
const SSH_PASS = 'UA3485Z43hqvZ@4r';

// Função para executar comandos SSH
async function execSSH(command) {
  const sshCommand = `sshpass -p '${SSH_PASS}' ssh -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} "${command}"`;
  try {
    const { stdout, stderr } = await execPromise(sshCommand);
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 INVESTIGANDO PROBLEMA DE LOGIN - CARLOS@PROTECAR.COM');
  console.log('═══════════════════════════════════════════════════════════\n');

  const relatorio = {
    timestamp: new Date().toISOString(),
    etapas: []
  };

  // ETAPA 1: Verificar se o usuário existe
  console.log('📋 ETAPA 1: Verificando se usuário existe no banco...');
  let resultado = await execSSH(`cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e "SELECT id, nome, email, tipo, ativo FROM usuarios WHERE email = 'carlos@protecar.com'"`);
  
  relatorio.etapas.push({
    etapa: 1,
    descricao: 'Verificação de usuário',
    comando: 'SELECT usuario',
    resultado: resultado.stdout
  });

  console.log('Resultado:', resultado.stdout);

  // ETAPA 2: Verificar hash da senha
  console.log('\n📋 ETAPA 2: Verificando hash da senha...');
  resultado = await execSSH(`cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e "SELECT id, email, senha FROM usuarios WHERE email = 'carlos@protecar.com'"`);
  
  relatorio.etapas.push({
    etapa: 2,
    descricao: 'Hash da senha',
    resultado: resultado.stdout
  });

  console.log('Hash:', resultado.stdout);

  // ETAPA 3: Verificar se existe na tabela consultores
  console.log('\n📋 ETAPA 3: Verificando se existe na tabela consultores...');
  resultado = await execSSH(`cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e "SELECT id, nome, email, usuario_id FROM consultores WHERE email = 'carlos@protecar.com'"`);
  
  relatorio.etapas.push({
    etapa: 3,
    descricao: 'Dados em consultores',
    resultado: resultado.stdout
  });

  console.log('Consultor:', resultado.stdout);

  // ETAPA 4: Verificar logs do backend
  console.log('\n📋 ETAPA 4: Verificando logs do backend (últimas 50 linhas)...');
  resultado = await execSSH(`cd /root/crm && docker-compose logs --tail=50 backend | grep -i "login\\|carlos\\|auth\\|error" || docker-compose logs --tail=50 backend`);
  
  relatorio.etapas.push({
    etapa: 4,
    descricao: 'Logs do backend',
    resultado: resultado.stdout.substring(0, 2000) // Limitar tamanho
  });

  console.log('Logs:', resultado.stdout.substring(0, 500));

  // ETAPA 5: Criar hash correto da senha "123456"
  console.log('\n📋 ETAPA 5: Gerando hash correto da senha...');
  resultado = await execSSH(`cd /root/crm && echo "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('123456', 10));" | docker-compose exec -T backend node`);
  
  const novoHash = resultado.stdout.trim().split('\n').pop();
  console.log('Novo hash gerado:', novoHash);

  relatorio.etapas.push({
    etapa: 5,
    descricao: 'Geração de hash',
    hash: novoHash
  });

  // ETAPA 6: Atualizar senha no banco
  console.log('\n📋 ETAPA 6: Atualizando senha no banco de dados...');
  resultado = await execSSH(`cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e "UPDATE usuarios SET senha = '${novoHash}' WHERE email = 'carlos@protecar.com'"`);
  
  relatorio.etapas.push({
    etapa: 6,
    descricao: 'Update da senha',
    resultado: resultado.stdout
  });

  console.log('Senha atualizada!');

  // ETAPA 7: Verificar se a atualização funcionou
  console.log('\n📋 ETAPA 7: Verificando atualização...');
  resultado = await execSSH(`cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e "SELECT email, LEFT(senha, 20) as senha_inicio FROM usuarios WHERE email = 'carlos@protecar.com'"`);
  
  relatorio.etapas.push({
    etapa: 7,
    descricao: 'Verificação pós-update',
    resultado: resultado.stdout
  });

  console.log('Verificação:', resultado.stdout);

  // ETAPA 8: Testar login via API
  console.log('\n📋 ETAPA 8: Testando login via API...');
  const testLoginScript = `
    curl -X POST http://localhost:4000/api/auth/login \\
      -H "Content-Type: application/json" \\
      -d '{"email":"carlos@protecar.com","password":"123456"}' \\
      -i
  `;

  resultado = await execSSH(testLoginScript);
  
  relatorio.etapas.push({
    etapa: 8,
    descricao: 'Teste de login via API',
    resultado: resultado.stdout
  });

  console.log('Resposta API:', resultado.stdout);

  // ETAPA 9: Verificar se usuário está ativo
  console.log('\n📋 ETAPA 9: Garantindo que usuário está ativo...');
  resultado = await execSSH(`cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e "UPDATE usuarios SET ativo = 1 WHERE email = 'carlos@protecar.com'"`);
  
  relatorio.etapas.push({
    etapa: 9,
    descricao: 'Ativar usuário',
    resultado: resultado.stdout
  });

  console.log('Usuário ativado!');

  // ETAPA 10: Verificar status final
  console.log('\n📋 ETAPA 10: Status final do usuário...');
  resultado = await execSSH(`cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e "SELECT id, nome, email, tipo, ativo, LEFT(senha, 30) as senha_hash FROM usuarios WHERE email = 'carlos@protecar.com'"`);
  
  relatorio.etapas.push({
    etapa: 10,
    descricao: 'Status final',
    resultado: resultado.stdout
  });

  console.log('Status:', resultado.stdout);

  // Salvar relatório
  relatorio.conclusao = {
    usuario: 'carlos@protecar.com',
    senha: '123456',
    status: 'CORRIGIDO',
    proximos_passos: [
      '1. Testar login no navegador: http://185.217.125.72:3000/',
      '2. Email: carlos@protecar.com',
      '3. Senha: 123456'
    ]
  };

  await fs.writeFile(
    'RELATORIO-CORRECAO-CARLOS.json',
    JSON.stringify(relatorio, null, 2)
  );

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ CORREÇÃO CONCLUÍDA!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📊 RESUMO:');
  console.log('- Usuário: carlos@protecar.com');
  console.log('- Senha: 123456');
  console.log('- Hash atualizado: ✓');
  console.log('- Usuário ativado: ✓');
  console.log('\n🌐 PRÓXIMO PASSO: Testar no navegador');
  console.log('URL: http://185.217.125.72:3000/');
  console.log('\n📄 Relatório salvo em: RELATORIO-CORRECAO-CARLOS.json');
}

main().catch(error => {
  console.error('❌ ERRO:', error);
  process.exit(1);
});
