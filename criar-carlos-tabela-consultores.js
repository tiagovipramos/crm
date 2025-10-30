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

async function criarConsultorCarlos() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✅ Conectado ao servidor VPS\n');

            try {
                // 1. Verificar estrutura da tabela consultores
                console.log('=== 1. ESTRUTURA DA TABELA CONSULTORES ===');
                const descTable = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "DESCRIBE consultores;" 2>&1 | grep -v "Warning"
                `);
                console.log(descTable.stdout);

                // 2. Verificar se carlos já existe
                console.log('\n=== 2. VERIFICANDO SE CARLOS JÁ EXISTE ===');
                const checkUser = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "
                    SELECT * FROM consultores WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log(checkUser.stdout || 'Consultor não encontrado');
                
                const consultorExiste = checkUser.stdout.includes('carlos@protecar.com');

                // 3. Criar ou atualizar consultor
                console.log('\n=== 3. CRIANDO/ATUALIZANDO CONSULTOR ===');
                
                if (consultorExiste) {
                    console.log('Atualizando consultor existente...');
                    const update = await executarComando(conn, `
                        docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "
                        UPDATE consultores 
                        SET senha = '${SENHA_HASH}', ativo = 1, updated_at = NOW() 
                        WHERE email = 'carlos@protecar.com';
                        " 2>&1
                    `);
                    console.log(update.stderr || '✅ Atualizado!');
                } else {
                    console.log('Criando novo consultor...');
                    const create = await executarComando(conn, `
                        docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "
                        INSERT INTO consultores (id, email, senha, nome, ativo, created_at, updated_at) 
                        VALUES (UUID(), 'carlos@protecar.com', '${SENHA_HASH}', 'Carlos Silva', 1, NOW(), NOW());
                        " 2>&1
                    `);
                    if (create.stderr && create.stderr.includes('ERROR')) {
                        console.log('❌ Erro:', create.stderr);
                    } else {
                        console.log('✅ Criado!');
                    }
                }

                // 4. Verificar resultado
                console.log('\n=== 4. VERIFICANDO CONSULTOR CRIADO ===');
                const verify = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "
                    SELECT id, email, nome, ativo, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as criado 
                    FROM consultores 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log('Dados:');
                console.log(verify.stdout);
                
                const consultorCriado = verify.stdout.includes('carlos@protecar.com');

                // 5. Testar login via API
                console.log('\n=== 5. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s 2>&1
                `);
                console.log('Resposta:');
                console.log(testLogin.stdout);
                
                const loginOK = testLogin.stdout.includes('token') || 
                               testLogin.stdout.includes('"user"') ||
                               testLogin.stdout.includes('"id"');

                // 6. Salvar relatório
                const relatorio = {
                    timestamp: new Date().toISOString(),
                    resultado: {
                        tabela_usada: 'consultores',
                        consultor_criado: consultorCriado,
                        login_funcionando: loginOK
                    },
                    credenciais: {
                        email: 'carlos@protecar.com',
                        senha: '123456',
                        tipo: 'consultor',
                        url: 'http://185.217.125.72:3000/crm/login'
                    },
                    detalhes: {
                        verificacao: verify.stdout,
                        teste_api: testLogin.stdout
                    }
                };

                fs.writeFileSync('RELATORIO-CONSULTOR-CARLOS-FINAL.json', JSON.stringify(relatorio, null, 2));
                console.log('\n✅ Relatório salvo em RELATORIO-CONSULTOR-CARLOS-FINAL.json');

                conn.end();
                resolve({ loginOK, consultorCriado });

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

console.log('🚀 CRIANDO CONSULTOR CARLOS NA TABELA CORRETA\n');
console.log('='.repeat(70));

criarConsultorCarlos()
    .then(({ loginOK, consultorCriado }) => {
        console.log('\n' + '='.repeat(70));
        console.log('✅ PROCESSO CONCLUÍDO!');
        console.log('='.repeat(70));
        console.log('\n📊 RESULTADO:');
        console.log('   Tabela: consultores');
        console.log('   Consultor criado:', consultorCriado ? '✅ SIM' : '❌ NÃO');
        console.log('   Login via API:', loginOK ? '✅ FUNCIONANDO' : '❌ FALHOU');
        console.log('\n📋 CREDENCIAIS:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm/login');
        console.log('='.repeat(70));
        
        if (consultorCriado && loginOK) {
            console.log('\n🎉🎉🎉 SUCESSO TOTAL! LOGIN FUNCIONANDO! 🎉🎉🎉');
            console.log('\nPróximo passo: testar no navegador para validar tudo!');
        } else if (consultorCriado) {
            console.log('\n✅ Consultor criado! Vamos testar no navegador.');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
