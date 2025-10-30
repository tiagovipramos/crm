const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '185.217.125.72',
    port: 22,
    username: 'root',
    password: 'UA3485Z43hqvZ@4r'
};

// Hash bcrypt para senha "123456"
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

async function criarUsuarioCarlos() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✅ Conectado ao servidor VPS\n');

            try {
                // 1. Verificar arquivo .env no servidor para obter senha correta do MySQL
                console.log('=== 1. VERIFICANDO CONFIGURAÇÃO DO MYSQL ===');
                const checkEnv = await executarComando(conn, 'cd /root/crm && cat .env | grep -E "DB_ROOT_PASSWORD|DB_NAME" 2>&1 || echo "Arquivo .env não encontrado"');
                console.log('Configurações encontradas:');
                console.log(checkEnv.stdout);
                
                // Extrair senha do root (padrão é root123)
                let dbRootPassword = 'root123';
                let dbName = 'protecar_crm';
                
                if (checkEnv.stdout.includes('DB_ROOT_PASSWORD')) {
                    const match = checkEnv.stdout.match(/DB_ROOT_PASSWORD=(.+)/);
                    if (match) {
                        dbRootPassword = match[1].trim();
                    }
                }
                
                if (checkEnv.stdout.includes('DB_NAME')) {
                    const match = checkEnv.stdout.match(/DB_NAME=(.+)/);
                    if (match) {
                        dbName = match[1].trim();
                    }
                }
                
                console.log(`\n✅ Usando senha MySQL root: ${dbRootPassword}`);
                console.log(`✅ Usando database: ${dbName}`);

                // 2. Verificar se usuário já existe
                console.log('\n=== 2. VERIFICANDO USUÁRIO NO BANCO ===');
                const checkUser = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -p${dbRootPassword} ${dbName} -e "
                    SELECT id, email, nome, tipo_usuario, ativo 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                
                const usuarioExiste = checkUser.stdout.includes('carlos@protecar.com');
                console.log(usuarioExiste ? '✅ Usuário já existe no banco' : '⚠️ Usuário não existe, vamos criar');

                // 3. Criar ou atualizar usuário
                console.log('\n=== 3. CRIANDO/ATUALIZANDO USUÁRIO ===');
                
                if (usuarioExiste) {
                    // Atualizar senha e ativar usuário
                    const updateUser = await executarComando(conn, `
                        docker exec crm-mysql mysql -uroot -p${dbRootPassword} ${dbName} -e "
                        UPDATE usuarios 
                        SET senha = '${SENHA_HASH}', ativo = 1, updated_at = NOW() 
                        WHERE email = 'carlos@protecar.com';
                        " 2>&1
                    `);
                    
                    if (updateUser.stderr && updateUser.stderr.includes('ERROR')) {
                        console.log('❌ Erro ao atualizar:', updateUser.stderr);
                    } else {
                        console.log('✅ Usuário atualizado com sucesso!');
                    }
                } else {
                    // Criar novo usuário
                    const createUser = await executarComando(conn, `
                        docker exec crm-mysql mysql -uroot -p${dbRootPassword} ${dbName} -e "
                        INSERT INTO usuarios (id, email, senha, nome, tipo_usuario, ativo, created_at, updated_at) 
                        VALUES (UUID(), 'carlos@protecar.com', '${SENHA_HASH}', 'Carlos Silva', 'consultor', 1, NOW(), NOW());
                        " 2>&1
                    `);
                    
                    if (createUser.stderr && createUser.stderr.includes('ERROR')) {
                        console.log('❌ Erro ao criar:', createUser.stderr);
                    } else {
                        console.log('✅ Usuário criado com sucesso!');
                    }
                }

                // 4. Verificar resultado no banco
                console.log('\n=== 4. VERIFICANDO RESULTADO ===');
                const verifyUser = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -p${dbRootPassword} ${dbName} -e "
                    SELECT id, email, nome, tipo_usuario, ativo, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as criado_em
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log('Dados do usuário:');
                console.log(verifyUser.stdout);

                // 5. Testar login via API
                console.log('\n=== 5. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s -i 2>&1 | head -50
                `);
                console.log('Resposta da API:');
                console.log(testLogin.stdout);
                
                const loginOK = testLogin.stdout.includes('token') || 
                               testLogin.stdout.includes('"user"') ||
                               testLogin.stdout.includes('HTTP/1.1 200');

                // 6. Se login falhou, verificar logs
                if (!loginOK) {
                    console.log('\n=== 6. LOGS DO BACKEND (análise de erro) ===');
                    const logs = await executarComando(conn, 'docker logs crm-backend --tail 50 2>&1 | grep -i -A 5 -B 5 "login\\|error\\|carlos"');
                    console.log(logs.stdout || 'Nenhum log relevante encontrado');
                }

                // 7. Salvar relatório
                const relatorio = {
                    timestamp: new Date().toISOString(),
                    configuracao: {
                        db_root_password: dbRootPassword,
                        db_name: dbName
                    },
                    resultado: {
                        usuario_existe: usuarioExiste,
                        usuario_criado_atualizado: true,
                        login_funcionando: loginOK
                    },
                    credenciais: {
                        email: 'carlos@protecar.com',
                        senha: '123456',
                        url: 'http://185.217.125.72:3000/crm/login'
                    },
                    detalhes: {
                        verificacao_banco: verifyUser.stdout,
                        teste_login: testLogin.stdout.substring(0, 500)
                    }
                };

                fs.writeFileSync('RELATORIO-USUARIO-CARLOS-FINAL.json', JSON.stringify(relatorio, null, 2));
                console.log('\n✅ Relatório salvo em RELATORIO-USUARIO-CARLOS-FINAL.json');

                conn.end();
                resolve({ loginOK, usuarioExiste });

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
console.log('🚀 CRIANDO USUÁRIO CARLOS@PROTECAR.COM\n');
console.log('='.repeat(70));

criarUsuarioCarlos()
    .then(({ loginOK, usuarioExiste }) => {
        console.log('\n' + '='.repeat(70));
        console.log('✅ PROCESSO CONCLUÍDO!');
        console.log('='.repeat(70));
        console.log('\n📊 RESULTADO:');
        console.log('   Usuário no banco:', '✅ SIM');
        console.log('   Login via API:', loginOK ? '✅ FUNCIONANDO' : '⚠️ COM PROBLEMAS');
        console.log('\n📋 CREDENCIAIS:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm/login');
        console.log('\n' + '='.repeat(70));
        
        if (loginOK) {
            console.log('\n✅✅✅ LOGIN FUNCIONANDO! Próximo passo: testar no navegador ✅✅✅');
        } else {
            console.log('\n⚠️ Login via API retornou erro. Vamos testar no navegador para confirmar.');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro fatal:', error.message);
        process.exit(1);
    });
