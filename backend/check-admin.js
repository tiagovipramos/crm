const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAndFixAdmin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'protecar_crm'
  });

  try {
    console.log('🔍 Verificando usuário admin...');
    
    // Verificar se existe
    const [admins] = await connection.query(
      'SELECT id, nome, email, role FROM consultores WHERE email = ?',
      ['diretor@protecar.com']
    );

    if (admins.length === 0) {
      console.log('❌ Usuário admin não encontrado!');
      console.log('✨ Criando usuário admin...');
      
      const senhaHash = await bcrypt.hash('123456', 10);
      
      await connection.query(
        `INSERT INTO consultores (nome, email, senha, telefone, status_conexao, role) 
         VALUES (?, ?, ?, ?, 'offline', ?)`,
        ['Admin Protecar', 'diretor@protecar.com', senhaHash, '11999999999', 'diretor']
      );
      
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('📧 Email: diretor@protecar.com');
      console.log('🔑 Senha: 123456');
    } else {
      console.log('✅ Usuário admin encontrado!');
      console.log('📧 Email:', admins[0].email);
      console.log('👤 Nome:', admins[0].nome);
      console.log('🎭 Role:', admins[0].role || 'SEM ROLE');
      
      // Atualizar senha e role
      console.log('🔄 Atualizando senha e role...');
      const senhaHash = await bcrypt.hash('123456', 10);
      
      await connection.query(
        'UPDATE consultores SET senha = ?, role = ? WHERE email = ?',
        [senhaHash, 'diretor', 'diretor@protecar.com']
      );
      
      console.log('✅ Senha atualizada para: 123456');
      console.log('✅ Role atualizada para: diretor');
    }
    
    // Verificar resultado final
    const [result] = await connection.query(
      'SELECT id, nome, email, role FROM consultores WHERE email = ?',
      ['diretor@protecar.com']
    );
    
    console.log('\n📋 Resultado final:');
    console.log(result[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

checkAndFixAdmin();
