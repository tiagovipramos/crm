const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '185.217.125.72',
    port: 22,
    username: 'root',
    password: 'UA3485Z43hqvZ@4r'
};

// Hash bcrypt para senha "123456" (gerado com bcrypt rounds=10)
const SENHA_HASH = '$2b$10$rKhYKvD7rrUjZq8cFy8I2.fK1sC8xKFYHFqBGJmJYqkQqCqZqh5WS';

function executarComando(conn, comando) {
    return new Promise((resolve, reject) => {
        conn.exec(comando, (err, stream) => {
            if (err) {
                reject(err);
                return;
            }

            let stdout = '';
            let stderr = '';

            stream.on('close', (code) => {
                resolve({ stdout, stderr, code });
            }).on('data', (data) => {
                stdout += data.toString();
            }).stderr.on('data', (data) => {
                stderr += data.toString();
            });
        });
    });
}

async function criarUsuario() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✅ Conectado ao servidor VPS\n');

            try {
                // 1. Verificar se usuário já existe
                console.log('=== 1. VERIFICANDO SE USUÁRIO EXISTE ===');
                const checkUser = await executarComando(conn, `
                    docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                    SELECT id, email, nome, tipo_usuario, ativo 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                
                const usuarioExiste = checkUser.stdout.includes('carlos@protecar.com');
                console.log(usuarioExiste ? '⚠️ Usuário já existe' : '✅ Usuário não existe, vamos criar');

                // 2. Criar ou atualizar usuário
                console.log('\n=== 2. CRIANDO/ATUALIZANDO USUÁRIO ===');
                
                let sqlCommand;
                if (usuarioExiste) {
                    sqlCommand = `UPDATE usuarios SET senha = '${SENHA_HASH}', ativo = 1, updated_at = NOW() WHERE email = 'carlos@protecar.com'`;
                } else {
                    sqlCommand = `INSERT INTO usuarios (id, email, senha, nome, tipo_usuario, ativo, created_at, updated_at) VALUES (UUID(), 'carlos@protecar.com', '${SENHA_HASH}', 'Carlos Silva', 'consultor', 1, NOW(), NOW())`;
                }
                
                const createUpdate = await executarComando(conn, `
                    docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "${sqlCommand}" 2>&1
                `);
                
                if (createUpdate.stderr && createUpdate.stderr.includes('ERROR')) {
                    console.log('❌ Erro ao criar/atualizar usuário:', createUpdate.stderr);
                } else {
                    console.log(usuarioExiste ? '✅ Usuário atualizado!' : '✅ Usuário criado!');
                }

                // 3. Verificar no banco
                console.log('\n=== 3. VERIFICANDO NO BANCO ===');
                const verify = await executarComando(conn, `
                    docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                    SELECT id, email, nome, tipo_usuario, ativo 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log('Dados do usuário:');
                console.log(verify.stdout);

                // 4. Testar login via API
                console.log('=== 4. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s 2>&1
                `);
                
                console.log('Resposta da API:');
                console.log(testLogin.stdout);
                
                const loginFunciona = testLogin.stdout.includes('token') || 
                                     testLogin.stdout.includes('"user"') ||
                                     testLogin.stdout.includes('"id"');

                // 5. Verificar logs do backend
                console.log('\n=== 5. LOGS DO BACKEND (últimas 20 linhas) ===');
                const logs = await executarComando(conn, 'docker logs crm-backend --tail 20 2>&1');
                console.log(logs.stdout);

                // 6. Salvar relatório detalhado
                const relatorio = {
                    timestamp: new Date().toISOString(),
                    status: {
                        usuario_criado: true,
                        login_funcionando: loginFunciona
                    },
                    credenciais: {
                        email: 'carlos@protecar.com',
                        senha: '123456',
                        url_login: 'http://185.217.125.72:3000/crm/login'
                    },
                    verificacao_banco: verify.stdout,
                    teste_api: testLogin.stdout,
                    logs_backend: logs.stdout
                };

                fs.writeFileSync('RELATORIO-USUARIO-CARLOS.json', JSON.stringify(relatorio, null, 2));
                console.log('\n✅ Relatório completo salvo em RELATORIO-USUARIO-CARLOS.json');

                conn.end();
                resolve({ loginFunciona, relatorio });

            } catch (error) {
                console.error('❌ Erro:', error.message);
                conn.end();
                reject(error);
            }
        }).on('error', (err) => {
            console.error('❌ Erro de conexão SSH:', err.message);
            reject(err);
        }).connect(sshConfig);
    });
}

// Executar
console.log('🚀 CRIANDO USUÁRIO CARLOS NO CRM\n');
console.log('='.repeat(60));

criarUsuario()
    .then(({ loginFunciona }) => {
        console.log('\n' + '='.repeat(60));
        console.log('✅ PROCESSO CONCLUÍDO!');
        console.log('='.repeat(60));
        console.log('\n📋 CREDENCIAIS DE ACESSO:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm/login');
        console.log('\n🔐 STATUS DO LOGIN:');
        console.log('   ', loginFunciona ? '✅ FUNCIONANDO' : '⚠️ PODE ESTAR COM PROBLEMAS');
        console.log('\n' + '='.repeat(60));
        
        if (!loginFunciona) {
            console.log('\n⚠️ ATENÇÃO: O login pode não estar funcionando corretamente.');
            console.log('   Verifique o relatório RELATORIO-USUARIO-CARLOS.json para mais detalhes.');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro fatal:', error.message);
        process.exit(1);
    });
