const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'protecar_crm'
};

async function checkAllUsers() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado!\n');
    
    console.log('='.repeat(80));
    console.log('📋 VERIFICANDO USUÁRIOS NOS 3 SISTEMAS');
    console.log('='.repeat(80));
    console.log();

    // ============================================
    // 1. SISTEMA ADMIN (Diretor, Gerente, Supervisor)
    // ============================================
    console.log('🛡️  SISTEMA ADMIN (Painel Administrativo)');
    console.log('-'.repeat(80));
    
    const [admins] = await connection.query(`
      SELECT 
        id, 
        nome, 
        email, 
        role,
        data_criacao,
        ultimo_acesso
      FROM consultores 
      WHERE role IN ('diretor', 'gerente', 'supervisor')
      ORDER BY 
        CASE role 
          WHEN 'diretor' THEN 1
          WHEN 'gerente' THEN 2
          WHEN 'supervisor' THEN 3
        END,
        nome
    `);

    if (admins.length > 0) {
      console.log(`✅ Encontrados ${admins.length} usuário(s) admin:\n`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.nome}`);
        console.log(`      📧 Email: ${admin.email}`);
        console.log(`      🎭 Role: ${admin.role}`);
        console.log(`      📅 Cadastro: ${admin.data_criacao}`);
        console.log(`      🔄 Último acesso: ${admin.ultimo_acesso || 'Nunca'}`);
        console.log(`      🔗 Acesso: http://localhost:3000/admin/login`);
        console.log();
      });
    } else {
      console.log('❌ Nenhum usuário admin encontrado!\n');
      console.log('   Para criar um admin, execute: node backend/check-admin.js\n');
    }

    // ============================================
    // 2. SISTEMA CRM (Vendedores/Consultores)
    // ============================================
    console.log('📊 SISTEMA CRM (Vendedores/Consultores)');
    console.log('-'.repeat(80));
    
    const [vendedores] = await connection.query(`
      SELECT 
        id, 
        nome, 
        email, 
        telefone,
        role,
        status_conexao,
        data_criacao,
        ultimo_acesso
      FROM consultores 
      WHERE role IS NULL OR role = '' OR role = 'vendedor'
      ORDER BY nome
    `);

    if (vendedores.length > 0) {
      console.log(`✅ Encontrados ${vendedores.length} vendedor(es):\n`);
      vendedores.forEach((vendedor, index) => {
        console.log(`   ${index + 1}. ${vendedor.nome}`);
        console.log(`      📧 Email: ${vendedor.email}`);
        console.log(`      📱 Telefone: ${vendedor.telefone || 'Não informado'}`);
        console.log(`      🎭 Role: ${vendedor.role || 'vendedor (padrão)'}`);
        console.log(`      📡 Status: ${vendedor.status_conexao}`);
        console.log(`      📅 Cadastro: ${vendedor.data_criacao}`);
        console.log(`      🔄 Último acesso: ${vendedor.ultimo_acesso || 'Nunca'}`);
        console.log(`      🔗 Acesso: http://localhost:3000/crm`);
        console.log();
      });
    } else {
      console.log('❌ Nenhum vendedor encontrado!\n');
      console.log('   Os vendedores podem ser criados pelo painel admin.\n');
    }

    // ============================================
    // 3. SISTEMA INDICADOR
    // ============================================
    console.log('💰 SISTEMA INDICADOR (Parceiros)');
    console.log('-'.repeat(80));
    
    const [indicadores] = await connection.query(`
      SELECT 
        id, 
        nome, 
        email, 
        telefone,
        cpf,
        ativo,
        saldo_disponivel,
        saldo_bloqueado,
        total_indicacoes,
        indicacoes_convertidas,
        data_criacao,
        ultimo_acesso
      FROM indicadores 
      ORDER BY nome
    `);

    if (indicadores.length > 0) {
      console.log(`✅ Encontrados ${indicadores.length} indicador(es):\n`);
      indicadores.forEach((indicador, index) => {
        console.log(`   ${index + 1}. ${indicador.nome}`);
        console.log(`      📧 Email: ${indicador.email}`);
        console.log(`      📱 Telefone: ${indicador.telefone || 'Não informado'}`);
        console.log(`      🆔 CPF: ${indicador.cpf}`);
        console.log(`      ✅ Ativo: ${indicador.ativo ? 'Sim' : 'Não'}`);
        console.log(`      💵 Saldo disponível: R$ ${parseFloat(indicador.saldo_disponivel).toFixed(2)}`);
        console.log(`      🔒 Saldo bloqueado: R$ ${parseFloat(indicador.saldo_bloqueado).toFixed(2)}`);
        console.log(`      📊 Indicações: ${indicador.total_indicacoes} (${indicador.indicacoes_convertidas} convertidas)`);
        console.log(`      📅 Cadastro: ${indicador.data_criacao}`);
        console.log(`      🔄 Último acesso: ${indicador.ultimo_acesso || 'Nunca'}`);
        console.log(`      🔗 Acesso: http://localhost:3000/indicador/login`);
        console.log();
      });
    } else {
      console.log('❌ Nenhum indicador encontrado!\n');
      console.log('   Os indicadores podem ser criados pelo painel admin.\n');
    }

    // ============================================
    // RESUMO
    // ============================================
    console.log('='.repeat(80));
    console.log('📊 RESUMO GERAL');
    console.log('='.repeat(80));
    console.log(`   🛡️  Admins: ${admins.length}`);
    console.log(`   📊 Vendedores: ${vendedores.length}`);
    console.log(`   💰 Indicadores: ${indicadores.length}`);
    console.log(`   📝 Total: ${admins.length + vendedores.length + indicadores.length} usuários`);
    console.log('='.repeat(80));
    console.log();

    // ============================================
    // INFORMAÇÕES IMPORTANTES
    // ============================================
    console.log('📝 INFORMAÇÕES IMPORTANTES:');
    console.log('-'.repeat(80));
    console.log('   ⚠️  As senhas estão criptografadas no banco de dados (bcrypt)');
    console.log('   ⚠️  A senha padrão inicial é: 123456');
    console.log('   ⚠️  Para resetar senha do admin: node backend/check-admin.js');
    console.log();
    console.log('🔗 ACESSOS:');
    console.log('-'.repeat(80));
    console.log('   🛡️  Admin: http://localhost:3000/admin/login');
    console.log('   📊 CRM: http://localhost:3000/crm (após fazer login)');
    console.log('   💰 Indicador: http://localhost:3000/indicador/login');
    console.log();
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAllUsers();
