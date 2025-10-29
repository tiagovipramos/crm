const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'protecar_crm'
    });

    console.log('🔍 Buscando leads com telefone contendo 988000168 ou 9572303253737...\n');
    
    const [rows] = await conn.execute(
      "SELECT id, telefone, nome FROM leads WHERE telefone LIKE '%988000168%' OR telefone LIKE '%9572303253737%'"
    );

    console.log('📋 Resultados encontrados:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
    
    await conn.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
})();
