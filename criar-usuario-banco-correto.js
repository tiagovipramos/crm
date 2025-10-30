const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '185.217.125.72',
    port: 22,
    username: 'root',
    password: 'UA3485Z43hqvZ@4r'
};

const SENHA_HASH = '$2b$10$rKhYKvD7rrUjZq8cFy8I2.fK1sC8xKFYHFqBGJmJYqkQqCqZqh5WS';
const DB_NAME = 'protecar_crm'; // Banco correto identificado
const DB_PASSWORD = 'root123';

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
                // 1. Verificar tabelas no banco correto
                console.log('=== 1. VERIFICANDO TABELAS EM protecar_crm ===');
                const showTables = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -p${DB_PASSWORD} ${DB_NAME} -e "SHOW TABLES;" 2>&1 | grep -v "Warning"
                `);
                console.log('Tabelas disponíveis:');
                console.log(showTables.stdout);

                // 2. Verificar estrutura da tabela usuarios
                console.log('\n=== 2. ESTRUTURA DA TABELA USUARIOS ===');
                const descTable = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -p${DB_PASSWORD} ${DB_NAME} -e "DESCRIBE usuarios;" 2>&1 | grep -v "Warning"
                `);
                console.log(descTable.stdout);

                // 3. Verificar se usuário já existe
                console.log('\n=== 3. VERIFICANDO SE USUÁRIO JÁ EXISTE ===');
                const checkUser = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -p${DB_PASSWORD} ${DB_NAME} -e "
                    SELECT id, email, nome, tipo_usuario, ativo 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log(checkUser.stdout || 'Usuário não encontrado');
                
                const usuarioExiste = checkUser.stdout.includes('carlos@protecar.com');

                // 4. Criar ou atualizar usuário
                console.log('\n=== 4. CRIANDO/ATUALIZANDO USUÁRIO ===');
                
                let sqlCommand;
                if (usuarioExiste) {
                    sqlCommand = `UPDATE usuarios SET senha = '${SENHA_HASH}', ativo = 1, updated_at = NOW() WHERE email = 'carlos@protecar.com';`;
                    console.log('Atualizando usuário existente...');
                } else {
                    sqlCommand = `INSERT INTO usuarios (id, email, senha, nome, tipo_usuario, ativo, created_at, updated_at) VALUES (UUID(), 'carlos@protecar.com', '${SENHA_HASH}', 'Carlos Silva', 'consultor', 1, NOW(), NOW());`;
                    console.log('Criando novo usuário...');
                }
                
                const createUpdate = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -p${DB_PASSWORD} ${DB_NAME} -e "${sqlCommand}" 2>&1
                `);
                
                if (createUpdate.stderr && createUpdate.stderr.includes('ERROR')) {
                    console.log('❌ Erro:', createUpdate.stderr);
                } else {
                    console.log('✅ Operação concluída!');
                }

                // 5. Verificar resultado
                console.log('\n=== 5. VERIFICANDO USUÁRIO CRIADO ===');
                const verify = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -p${DB_PASSWORD} ${DB_NAME} -e "
                    SELECT id, email, nome, tipo_usuario, ativo, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as criado 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log('Dados do usuário:');
                console.log(verify.stdout);
                
                const usuarioCriado = verify.stdout.includes('carlos@protecar.com');

                // 6. Testar login via API
                console.log('\n=== 6. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s 2>&1
                `);
                console.log('Resposta da API:');
                console.log(testLogin.stdout);
                
                const loginOK = testLogin.stdout.includes('token') || 
                               testLogin.stdout.includes('"user"') ||
                               testLogin.stdout.includes('"id"');

                // 7. Se login falhou, verificar logs do backend
                if (!loginOK) {
                    console.log('\n=== 7. LOGS DO BACKEND (ultimas 30 linhas) ===');
                    const logs = await executarComando(conn, 'docker logs crm-backend --tail 30 2>&1');
                    const relevantLogs = logs.stdout.split('\n').filter(line => 
                        line.includes('login') || 
                        line.includes('carlos') || 
                        line.includes('error') ||
                        line.includes('ERROR')
                    ).join('\n');
                    console.log(relevantLogs || 'Nenhum log relevante');
                }

                // 8. Salvar relatório
                const relatorio = {
                    timestamp: new Date().toISOString(),
                    resultado: {
                        banco_usado: DB_NAME,
                        usuario_criado: usuarioCriado,
                        login_funcionando: loginOK
                    },
                    credenciais: {
                        email: 'carlos@protecar.com',
                        senha: '123456',
                        url: 'http://185.217.125.72:3000/crm/login'
                    },
                    detalhes: {
                        tabelas: showTables.stdout,
                        verificacao: verify.stdout,
                        teste_api: testLogin.stdout
                    }
                };

                fs.writeFileSync('RELATORIO-USUARIO-CRIADO.json', JSON.stringify(relatorio, null, 2));
                console.log('\n✅ Relatório salvo em RELATORIO-USUARIO-CRIADO.json');

                conn.end();
                resolve({ loginOK, usuarioCriado });

            } catch (error) {
                console.error('❌ Erro:', error.message);
                conn.end();
                reject(error);
            }
        }).on('error', (err) => {
            console.error('❌ Erro SSH:', err.message);
            reject(err);
        }).connect(sshConfig);
    });
}

console.log('🚀 CRIANDO USUÁRIO CARLOS NO BANCO CORRETO (protecar_crm)\n');
console.log('='.repeat(70));

criarUsuario()
    .then(({ loginOK, usuarioCriado }) => {
        console.log('\n' + '='.repeat(70));
        console.log('✅ PROCESSO CONCLUÍDO!');
        console.log('='.repeat(70));
        console.log('\n📊 RESULTADO:');
        console.log('   Banco de dados: protecar_crm');
        console.log('   Usuário criado:', usuarioCriado ? '✅ SIM' : '❌ NÃO');
        console.log('   Login via API:', loginOK ? '✅ FUNCIONANDO' : '❌ FALHOU');
        console.log('\n📋 CREDENCIAIS:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm/login');
        console.log('='.repeat(70));
        
        if (usuarioCriado && loginOK) {
            console.log('\n✅✅✅ SUCESSO TOTAL! Agora vamos testar no navegador! ✅✅✅');
        } else if (usuarioCriado && !loginOK) {
            console.log('\n✅ Usuário criado, mas login via API falhou.');
            console.log('⚠️ Vamos testar no navegador para confirmar se funciona.');
        } else {
            console.log('\n❌ Houve um problema. Verifique o relatório para mais detalhes.');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
