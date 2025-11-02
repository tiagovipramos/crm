import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Validação de variáveis de ambiente obrigatórias
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Erro: Variáveis de ambiente obrigatórias não encontradas:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nConfigure o arquivo .env com base no .env.example');
  process.exit(1);
}

// Configuração do pool de conexões MySQL
const poolConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'protecar_crm',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Charset para suporte completo a emojis e caracteres especiais
  charset: 'utf8mb4',
  timezone: 'Z', // UTC
  // Configurações de timeout
  connectTimeout: 10000, // 10 segundos
  // Configurações de segurança
  multipleStatements: false, // Prevenir SQL injection
};

// Criar pool de conexões
export const pool = mysql.createPool(poolConfig);

// Teste de conexão inicial
pool.getConnection()
  .then((connection) => {
    console.log('✅ Conectado ao MySQL com sucesso');
    console.log(`📊 Database: ${poolConfig.database}`);
    console.log(`🌐 Host: ${poolConfig.host}:${poolConfig.port}`);
    console.log(`👤 User: ${poolConfig.user}`);
    console.log(`🔌 Pool Size: ${poolConfig.connectionLimit} conexões`);
    connection.release();
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar no MySQL:');
    console.error(`   Mensagem: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    console.error('\n🔧 Verifique:');
    console.error('   1. Se o MySQL está rodando');
    console.error('   2. Se as credenciais no .env estão corretas');
    console.error('   3. Se o banco de dados existe');
    console.error('   4. Se o usuário tem permissões adequadas');
    
    // Em desenvolvimento, dar mais detalhes
    if (process.env.NODE_ENV === 'development') {
      console.error('\n📋 Configuração atual:');
      console.error(`   DB_HOST: ${process.env.DB_HOST}`);
      console.error(`   DB_PORT: ${process.env.DB_PORT}`);
      console.error(`   DB_NAME: ${process.env.DB_NAME}`);
      console.error(`   DB_USER: ${process.env.DB_USER}`);
      console.error(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '(vazio)'}`);
    }
  });

// Event listeners para monitoramento do pool
pool.on('connection', (connection) => {
  if (process.env.DEBUG === 'true') {
    console.log('🔄 Nova conexão MySQL estabelecida');
  }
});

pool.on('acquire', (connection) => {
  if (process.env.DEBUG === 'true') {
    console.log('📤 Conexão MySQL adquirida do pool');
  }
});

pool.on('release', (connection) => {
  if (process.env.DEBUG === 'true') {
    console.log('📥 Conexão MySQL liberada para o pool');
  }
});

// Função auxiliar para executar queries com error handling
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error: any) {
    console.error('❌ Erro ao executar query MySQL:');
    console.error(`   SQL: ${sql}`);
    console.error(`   Erro: ${error.message}`);
    throw error;
  }
}

// Função para verificar saúde da conexão
export async function healthCheck(): Promise<boolean> {
  try {
    await pool.execute('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando conexões MySQL...');
  await pool.end();
  console.log('✅ Pool MySQL encerrado');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando conexões MySQL...');
  await pool.end();
  console.log('✅ Pool MySQL encerrado');
  process.exit(0);
});

export default pool;
