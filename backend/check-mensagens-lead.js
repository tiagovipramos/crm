const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'protecar_crm'
    });

    const leadId = '086bafe7-b4c6-11f0-95f3-8cb0e93127ca';
    
    console.log('🔍 Buscando mensagens para o lead:', leadId);
    console.log('');
    
    const [rows] = await conn.execute(
      `SELECT id, conteudo, tipo, remetente, status, whatsapp_message_id, timestamp, media_url
       FROM mensagens 
       WHERE lead_id = ? 
       ORDER BY timestamp ASC`,
      [leadId]
    );

    console.log('📋 Total de mensagens encontradas:', rows.length);
    console.log('');
    
    if (rows.length > 0) {
      rows.forEach((msg, index) => {
        console.log(`━━━━━━━━━━━━━━━ MENSAGEM ${index + 1} ━━━━━━━━━━━━━━━`);
        console.log(`ID: ${msg.id}`);
        console.log(`Conteúdo: ${msg.conteudo.substring(0, 100)}${msg.conteudo.length > 100 ? '...' : ''}`);
        console.log(`Tipo: ${msg.tipo}`);
        console.log(`Remetente: ${msg.remetente}`);
        console.log(`Status: ${msg.status}`);
        console.log(`WhatsApp ID: ${msg.whatsapp_message_id || 'NULL'}`);
        console.log(`Timestamp: ${msg.timestamp}`);
        console.log(`Media URL: ${msg.media_url || 'NULL'}`);
        console.log('');
      });
      
      const enviadas = rows.filter(m => m.remetente === 'consultor').length;
      const recebidas = rows.filter(m => m.remetente === 'lead').length;
      
      console.log('📊 Resumo:');
      console.log(`   • Mensagens enviadas (consultor): ${enviadas}`);
      console.log(`   • Mensagens recebidas (lead): ${recebidas}`);
      console.log(`   • Total: ${rows.length}`);
    }
    
    await conn.end();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
})();
