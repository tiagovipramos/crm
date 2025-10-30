const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '185.217.125.72',
  port: 22,
  username: 'root',
  password: 'UA3485Z43hqvZ@4r'
};

class SSHManager {
  constructor() {
    this.conn = new Client();
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Conectando ao servidor SSH...');
      this.conn.on('ready', () => {
        console.log('✅ Conectado!\n');
        this.isConnected = true;
        resolve();
      });
      this.conn.on('error', reject);
      this.conn.connect(SSH_CONFIG);
    });
  }

  executeCommand(command) {
    return new Promise((resolve, reject) => {
      this.conn.exec(command, (err, stream) => {
        if (err) return reject(err);
        let stdout = '', stderr = '';
        stream.on('close', () => resolve({ stdout, stderr }));
        stream.on('data', (data) => stdout += data.toString());
        stream.stderr.on('data', (data) => stderr += data.toString());
      });
    });
  }

  disconnect() {
    if (this.isConnected) {
      this.conn.end();
      this.isConnected = false;
      console.log('🔌 Desconectado');
    }
  }
}

async function main() {
  console.log('🔧 CORRIGINDO FAVICON COM REBUILD COMPLETO\n');
  console.log('='.repeat(60));
  
  const ssh = new SSHManager();
  
  try {
    await ssh.connect();

    // 1. Parar o frontend
    console.log('\n1️⃣ Parando container frontend...');
    await ssh.executeCommand('cd /root/crm && docker-compose stop frontend');
    console.log('✅ Frontend parado');

    // 2. Remover container e imagem
    console.log('\n2️⃣ Removendo container e imagem antiga...');
    await ssh.executeCommand('cd /root/crm && docker-compose rm -f frontend');
    await ssh.executeCommand('docker rmi crm-frontend 2>/dev/null || true');
    console.log('✅ Container e imagem removidos');

    // 3. Rebuild completo
    console.log('\n3️⃣ Fazendo rebuild completo do frontend (isso vai demorar ~2 minutos)...');
    const buildResult = await ssh.executeCommand('cd /root/crm && docker-compose build --no-cache frontend');
    console.log('✅ Build concluído');

    // 4. Iniciar o frontend
    console.log('\n4️⃣ Iniciando frontend...');
    await ssh.executeCommand('cd /root/crm && docker-compose up -d frontend');
    console.log('✅ Frontend iniciado');

    // 5. Aguardar inicialização
    console.log('\n⏳ Aguardando frontend inicializar (30s)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // 6. Verificar logs
    console.log('\n5️⃣ Verificando logs...');
    const logs = await ssh.executeCommand('cd /root/crm && docker-compose logs --tail=15 frontend');
    console.log(logs.stdout);

    // 7. Verificar se favicon está no container
    console.log('\n6️⃣ Verificando se favicon está disponível no container...');
    const faviconCheck = await ssh.executeCommand('docker exec crm-frontend ls -lh /app/public/favicon.ico');
    console.log(faviconCheck.stdout);

    console.log('\n\n✅ REBUILD COMPLETO FINALIZADO!\n');
    console.log('='.repeat(60));
    console.log('\n🌐 Teste o favicon em: http://185.217.125.72:3000/favicon.ico');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    ssh.disconnect();
  }
}

main();
