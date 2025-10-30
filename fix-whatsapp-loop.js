const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo loop infinito do WhatsApp...\n');

// Caminho do arquivo
const filePath = path.join(__dirname, 'backend', 'src', 'services', 'whatsappService.ts');

// Ler conteúdo
let content = fs.readFileSync(filePath, 'utf8');

// Padrão a ser substituído
const oldPattern = `            if (shouldReconnect) {
              // Reconectar automaticamente se não foi logout
              console.log('🔄 Tentando reconectar WhatsApp em 3 segundos...');
              
              // Atualizar status no banco
              await query(
                'UPDATE consultores SET status_conexao = ? WHERE id = ?',
                ['reconnecting', consultorId]
              );
              
              // Emitir evento de reconexão
              if (this.io) {
                this.io.to(\`consultor_\${consultorId}\`).emit('whatsapp_reconnecting', {
                  consultorId,
                  reason: errorMsg
                });
              }
              
              setTimeout(() => {
                this.conectar(consultorId).catch(err => {
                  console.error('Erro ao reconectar:', err);
                });
              }, 3000);`;

const newPattern = `            if (shouldReconnect) {
              // Verificar se existe sessão salva antes de tentar reconectar
              const fs = require('fs');
              const authPath = \`./auth_\${consultorId}\`;
              
              if (!fs.existsSync(authPath)) {
                console.log('⚠️ Sem sessão salva, não tentará reconectar');
                await query(
                  'UPDATE consultores SET status_conexao = ? WHERE id = ?',
                  ['offline', consultorId]
                );
                return;
              }
              
              console.log('🔄 Tentando reconectar WhatsApp em 5 segundos...');
              
              // Atualizar status no banco
              await query(
                'UPDATE consultores SET status_conexao = ? WHERE id = ?',
                ['reconnecting', consultorId]
              );
              
              // Emitir evento de reconexão
              if (this.io) {
                this.io.to(\`consultor_\${consultorId}\`).emit('whatsapp_reconnecting', {
                  consultorId,
                  reason: errorMsg
                });
              }
              
              setTimeout(() => {
                this.conectar(consultorId).catch(err => {
                  console.error('Erro ao reconectar:', err);
                });
              }, 5000);`;

// Substituir
if (content.includes(oldPattern)) {
  content = content.replace(oldPattern, newPattern);
  
  // Salvar
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('✅ Correção aplicada com sucesso!');
  console.log('📝 Mudanças:');
  console.log('  - Verifica se existe sessão salva antes de reconectar');
  console.log('  - Se não houver sessão, marca como offline e não tenta reconectar');
  console.log('  - Aumentou delay de 3s para 5s');
} else {
  console.log('⚠️ Padrão não encontrado. O arquivo pode já estar corrigido ou foi modificado.');
}
