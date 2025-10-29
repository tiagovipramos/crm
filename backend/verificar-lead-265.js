require('dotenv').config();
const { Pool } = require('pg');

async function verificar() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'protecar_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    const result = await pool.query(
      "SELECT id, nome, indicador_id, indicacao_id, status FROM leads WHERE nome LIKE '%Carga 265%'"
    );
    
    const rows = result.rows;
    
    console.log('📊 Resultado da busca:');
    console.log(JSON.stringify(rows, null, 2));
    
    if (rows.length > 0) {
      const lead = rows[0];
      console.log('\n✅ Lead encontrado:');
      console.log('- ID:', lead.id);
      console.log('- Nome:', lead.nome);
      console.log('- Indicador ID:', lead.indicador_id);
      console.log('- Indicação ID:', lead.indicacao_id);
      console.log('- Status:', lead.status);
      
      if (!lead.indicador_id) {
        console.log('\n⚠️ PROBLEMA: Este lead NÃO tem indicador_id!');
        console.log('Por isso o evento Socket.IO não está sendo emitido.');
      } else {
        console.log('\n✅ Lead tem indicador associado. Evento deveria ser emitido.');
      }
    } else {
      console.log('\n❌ Nenhum lead encontrado com esse nome.');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
    process.exit();
  }
}

verificar();
