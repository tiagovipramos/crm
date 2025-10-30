const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '185.217.125.72',
    port: 22,
    username: 'root',
    password: 'UA3485Z43hqvZ@4r'
};

function executarComando(conn, comando) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔧 Executando: ${comando.substring(0, 100)}...`);
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
            console.log('✅ Conectado ao servidor VPS');

            try {
                // 1. Criar script para gerar hash bcrypt no container do backend
                console.log('\n=== 1. GERANDO HASH BCRYPT ===');
                const createHashScript = await executarComando(conn, `
                    docker exec crm-backend node -e "
                    const bcrypt = require('bcrypt');
                    bcrypt.hash('123456', 10).then(hash => {
                        console.log('HASH:', hash);
                    });
                    "
                `);
                console.log('Resultado:', createHashScript.stdout);

                // Extrair o hash
                const hashMatch = createHashScript.stdout.match(/HASH: (\$2[ab]\$\d+\$.+)/);
                if (!hashMatch) {
                    throw new Error('Não foi possível gerar o hash');
                }
                const senhaHash = hashMatch[1].trim();
                console.log('✅ Hash gerado:', senhaHash);

                // 2. Inserir usuário no banco
                console.log('\n=== 2. CRIANDO USUÁRIO NO BANCO ===');
                const createUser = await executarComando(conn, `
                    docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                    INSERT INTO usuarios (
                        id,
                        email, 
                        senha, 
                        nome, 
                        tipo_usuario, 
                        ativo, 
                        created_at,
                        updated_at
                    ) VALUES (
                        UUID(),
                        'carlos@protecar.com',
                        '${senhaHash}',
                        'Carlos Silva',
                        'consultor',
                        1,
                        NOW(),
                        NOW()
                    );
                    "
                `);

                if (createUser.stderr.includes('ERROR')) {
                    console.log('❌ Erro ao criar usuário:', createUser.stderr);
                    throw new Error(createUser.stderr);
                } else {
                    console.log('✅ Usuário criado com sucesso!');
                }

                // 3. Verificar se foi criado
                console.log('\n=== 3. VERIFICANDO USUÁRIO CRIADO ===');
                const verifyUser = await executarComando(conn, `
                    docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                    SELECT id, email, nome, tipo_usuario, ativo, created_at 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    "
                `);
                console.log('Dados do usuário:\n', verifyUser.stdout);

                // 4. Testar login via API
                console.log('\n=== 4. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s -w "\\nHTTP_CODE:%{http_code}\\n"
                `);
                console.log('Resposta da API:', testLogin.stdout);

                if (testLogin.stdout.includes('token')) {
                    console.log('\n✅ LOGIN FUNCIONANDO! Token JWT gerado com sucesso!');
                } else if (testLogin.stdout.includes('HTTP_CODE:200')) {
                    console.log('\n✅ LOGIN FUNCIONANDO! API retornou 200');
                } else {
                    console.log('\n⚠️ Login pode ter problemas. Verificar logs...');
                }

                // 5. Verificar logs do backend
                console.log('\n=== 5. LOGS DO BACKEND ===');
                const logs = await executarComando(conn, 'docker logs crm-backend --tail 30');
                console.log('Logs recentes:\n', logs.stdout.substring(logs.stdout.length - 1000));

                // 6. Salvar relatório
                const relatorio = {
                    timestamp: new Date().toISOString(),
                    usuario_criado: true,
                    email: 'carlos@protecar.com',
                    senha: '123456',
                    hash_bcrypt: senhaHash,
                    teste_login_stdout: testLogin.stdout,
                    verificacao_banco: verifyUser.stdout
                };

                fs.writeFileSync('RELATORIO-USUARIO-CARLOS.json', JSON.stringify(relatorio, null, 2));
                console.log('\n✅ Relatório salvo em RELATORIO-USUARIO-CARLOS.json');

                conn.end();
                resolve(relatorio);

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
console.log('🚀 Iniciando criação do usuário carlos@protecar.com...\n');
criarUsuario()
    .then(() => {
        console.log('\n✅✅✅ CONCLUÍDO COM SUCESSO! ✅✅✅');
        console.log('\n📋 Credenciais:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm/login');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
