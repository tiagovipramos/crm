const { Client } = require('ssh2');
const fs = require('fs');

const sshConfig = {
    host: '185.217.125.72',
    port: 22,
    username: 'root',
    password: 'UA3485Z43hqvZ@4r'
};

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

async function diagnosticarECorrigir() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✅ Conectado ao servidor VPS\n');

            try {
                // 1. Listar todos os bancos de dados
                console.log('=== 1. LISTANDO BANCOS DE DADOS ===');
                const showDatabases = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 -e "SHOW DATABASES;" 2>&1 | grep -v "Warning"
                `);
                console.log('Bancos disponíveis:');
                console.log(showDatabases.stdout);

                // 2. Tentar conectar com 'crm_protecar' (nome alternativo)
                console.log('\n=== 2. VERIFICANDO BANCO CRM_PROTECAR ===');
                const showTablesCrm = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 crm_protecar -e "SHOW TABLES;" 2>&1 | grep -v "Warning"
                `);
                console.log('Tabelas em crm_protecar:');
                console.log(showTablesCrm.stdout);
                
                const bancoCrmExiste = !showTablesCrm.stderr.includes('ERROR');
                const tabelaUsuariosExiste = showTablesCrm.stdout.includes('usuarios');

                let dbCorreto = 'crm_protecar';
                
                if (!bancoCrmExiste) {
                    console.log('\n⚠️ Banco crm_protecar não existe. Verificando protecar_crm...');
                    const showTablesProtecar = await executarComando(conn, `
                        docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "SHOW TABLES;" 2>&1 | grep -v "Warning"
                    `);
                    console.log('Tabelas em protecar_crm:');
                    console.log(showTablesProtecar.stdout);
                    
                    if (!showTablesProtecar.stderr.includes('ERROR')) {
                        dbCorreto = 'protecar_crm';
                    }
                }

                console.log(`\n✅ Banco de dados correto: ${dbCorreto}`);

                // 3. Verificar se tabela usuarios existe
                if (!tabelaUsuariosExiste) {
                    console.log('\n=== 3. TABELA USUARIOS NÃO EXISTE - EXECUTANDO MIGRATIONS ===');
                    
                    // Executar migrations do backend
                    const runMigrations = await executarComando(conn, `
                        cd /root/crm && docker exec crm-backend npm run migrate 2>&1
                    `);
                    console.log('Resultado das migrations:');
                    console.log(runMigrations.stdout);
                    
                    // Verificar novamente
                    const checkAgain = await executarComando(conn, `
                        docker exec crm-mysql mysql -uroot -proot123 ${dbCorreto} -e "SHOW TABLES;" 2>&1 | grep -v "Warning"
                    `);
                    console.log('\nTabelas após migrations:');
                    console.log(checkAgain.stdout);
                }

                // 4. Criar usuário Carlos
                console.log('\n=== 4. CRIANDO USUÁRIO CARLOS ===');
                const createUser = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 ${dbCorreto} -e "
                    INSERT INTO usuarios (id, email, senha, nome, tipo_usuario, ativo, created_at, updated_at) 
                    VALUES (UUID(), 'carlos@protecar.com', '${SENHA_HASH}', 'Carlos Silva', 'consultor', 1, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE senha = '${SENHA_HASH}', ativo = 1, updated_at = NOW();
                    " 2>&1
                `);
                
                if (createUser.stderr && createUser.stderr.includes('ERROR')) {
                    console.log('❌ Erro:', createUser.stderr);
                } else {
                    console.log('✅ Usuário criado/atualizado!');
                }

                // 5. Verificar usuário
                console.log('\n=== 5. VERIFICANDO USUÁRIO CRIADO ===');
                const verifyUser = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 ${dbCorreto} -e "
                    SELECT id, email, nome, tipo_usuario, ativo 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log('Dados:');
                console.log(verifyUser.stdout);
                
                const usuarioCriado = verifyUser.stdout.includes('carlos@protecar.com');

                // 6. Testar login
                console.log('\n=== 6. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s 2>&1
                `);
                console.log('Resposta:');
                console.log(testLogin.stdout);
                
                const loginOK = testLogin.stdout.includes('token') || testLogin.stdout.includes('"user"');

                // 7. Relatório
                const relatorio = {
                    timestamp: new Date().toISOString(),
                    diagnostico: {
                        banco_correto: dbCorreto,
                        tabela_usuarios_existe: tabelaUsuariosExiste,
                        usuario_criado: usuarioCriado,
                        login_funcionando: loginOK
                    },
                    credenciais: {
                        email: 'carlos@protecar.com',
                        senha: '123456',
                        url: 'http://185.217.125.72:3000/crm/login'
                    }
                };

                fs.writeFileSync('RELATORIO-DIAGNOSTICO-BANCO.json', JSON.stringify(relatorio, null, 2));
                console.log('\n✅ Relatório salvo');

                conn.end();
                resolve({ loginOK, usuarioCriado, dbCorreto });

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

console.log('🔍 DIAGNOSTICANDO E CORRIGINDO BANCO DE DADOS\n');
console.log('='.repeat(70));

diagnosticarECorrigir()
    .then(({ loginOK, usuarioCriado, dbCorreto }) => {
        console.log('\n' + '='.repeat(70));
        console.log('✅ DIAGNÓSTICO CONCLUÍDO!');
        console.log('='.repeat(70));
        console.log('\n📊 RESULTADO:');
        console.log('   Banco de dados:', dbCorreto);
        console.log('   Usuário criado:', usuarioCriado ? '✅ SIM' : '❌ NÃO');
        console.log('   Login funcionando:', loginOK ? '✅ SIM' : '❌ NÃO');
        console.log('\n📋 CREDENCIAIS:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm/login');
        console.log('='.repeat(70));
        
        if (loginOK) {
            console.log('\n✅✅✅ SUCESSO! Agora vamos testar no navegador! ✅✅✅');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
