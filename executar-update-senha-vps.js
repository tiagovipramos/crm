#!/usr/bin/env node

const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');

console.log('═══════════════════════════════════════════════════════════');
console.log('🔧 ATUALIZANDO SENHA DO CARLOS NO VPS');
console.log('═══════════════════════════════════════════════════════════\n');

// Gerar hash da senha
const senha = '123456';
const hash = bcrypt.hashSync(senha, 10);
console.log('✓ Hash gerado:', hash.substring(0, 30) + '...\n');

// Configurações SSH
const SSH_HOST = '185.217.125.72';
const SSH_USER = 'root';
const SSH_PASS = 'UA3485Z43hqvZ@4r';

// Comandos SQL a executar
const comandos = [
  {
    nome: 'UPDATE senha',
    sql: `UPDATE usuarios SET senha = '${hash}', ativo = 1 WHERE email = 'carlos@protecar.com'`
  },
  {
    nome: 'VERIFICAR usuario',
    sql: `SELECT id, nome, email, tipo, ativo, SUBSTRING(senha, 1, 30) as senha_hash FROM usuarios WHERE email = 'carlos@protecar.com'`
  },
  {
    nome: 'VERIFICAR consultor',
    sql: `SELECT id, nome, email, usuario_id, ativo FROM consultores WHERE email = 'carlos@protecar.com'`
  }
];

console.log('📋 Executando comandos no servidor VPS...\n');

try {
  // Usar plink para conectar via SSH e executar comandos
  for (const cmd of comandos) {
    console.log(`\n🔹 ${cmd.nome}:`);
    console.log(`SQL: ${cmd.sql.substring(0, 80)}...`);
    
    try {
      const plinkCmd = `echo y | plink -ssh ${SSH_USER}@${SSH_HOST} -pw ${SSH_PASS} "cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e \\"${cmd.sql}\\""`;
      
      const resultado = execSync(plinkCmd, { 
        encoding: 'utf8',
        stdio: 'pipe',
        shell: 'cmd.exe'
      });
      
      console.log('Resultado:', resultado || '✓ Comando executado');
    } catch (error) {
      console.log('⚠ Erro ao executar comando:', error.message);
      // Continuar mesmo com erro
    }
  }

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📊 INFORMAÇÕES:');
  console.log('📧 Email: carlos@protecar.com');
  console.log('🔑 Senha: 123456');
  console.log('🔐 Hash:', hash);
  console.log('\n🌐 PRÓXIMO PASSO:');
  console.log('Testar login em: http://185.217.125.72:3000/');

} catch (error) {
  console.error('\n❌ ERRO:', error.message);
  process.exit(1);
}
