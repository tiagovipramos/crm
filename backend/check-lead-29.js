const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'protecar_crm'
    });

    console.log('🔍 Buscando lead com número 29 ou 558188000029...\n');
    
    const [rows] = await conn.execute(
      "SELECT id, telefone, nome FROM leads WHERE telefone LIKE '%29%' OR telefone LIKE '%8188000029%'"
    );

    console.log('📋 Resultados encontrados:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
    
    if (rows.length > 0) {
      console.log('\n📱 Formato do telefone no banco:');
      rows.forEach(row => {
        console.log(`  - ID: ${row.id}`);
        console.log(`  - Nome: ${row.nome}`);
        console.log(`  - Telefone: "${row.telefone}"`);
        console.log(`  - Comprimento: ${row.telefone.length} caracteres`);
        console.log(`  - Contém @: ${row.telefone.includes('@') ? 'SIM' : 'NÃO'}`);
        if (row.telefone.includes('@')) {
          console.log(`  - Sufixo: ${row.telefone.split('@')[1]}`);
        }
        console.log('');
      });
    }
    
    await conn.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
})();
