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

async function verificarETestar() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✅ Conectado ao servidor VPS\n');

            try {
                // 1. Listar containers para confirmar nomes corretos
                console.log('=== 1. LISTANDO CONTAINERS ===');
                const containers = await executarComando(conn, 'docker ps --format "{{.Names}}"');
                console.log('Containers ativos:');
                console.log(containers.stdout);
                
                // 2. Verificar usuário no banco (com nome correto do container)
                console.log('\n=== 2. VERIFICANDO USUÁRIO NO BANCO ===');
                const checkUser = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                    SELECT id, email, nome, tipo_usuario, ativo 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log('Resultado:');
                console.log(checkUser.stdout);
                
                const usuarioExiste = checkUser.stdout.includes('carlos@protecar.com');
                
                if (!usuarioExiste) {
                    console.log('❌ Usuário não encontrado! Criando...');
                    
                    const SENHA_HASH = '$2b$10$rKhYKvD7rrUjZq8cFy8I2.fK1sC8xKFYHFqBGJmJYqkQqCqZqh5WS';
                    
                    await executarComando(conn, `
                        docker exec crm-mysql mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                        INSERT INTO usuarios (id, email, senha, nome, tipo_usuario, ativo, created_at, updated_at) 
                        VALUES (UUID(), 'carlos@protecar.com', '${SENHA_HASH}', 'Carlos Silva', 'consultor', 1, NOW(), NOW());
                        " 2>&1
                    `);
                    
                    console.log('✅ Usuário criado!');
                } else {
                    console.log('✅ Usuário existe no banco!');
                }

                // 3. Testar login via API
                console.log('\n=== 3. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s -w "\\n\\nHTTP_CODE: %{http_code}\\n" 2>&1
                `);
                
                console.log('Resposta completa:');
                console.log(testLogin.stdout);
                
                const loginOK = testLogin.stdout.includes('token') || 
                               testLogin.stdout.includes('"user"') ||
                               testLogin.stdout.includes('HTTP_CODE: 200');

                // 4. Se login falhou, verificar logs em tempo real
                if (!loginOK) {
                    console.log('\n=== 4. ANALISANDO LOGS DO BACKEND ===');
                    const logs = await executarComando(conn, 'docker logs crm-backend --tail 30 2>&1');
                    console.log(logs.stdout);
                    
                    // Verificar se há erro de bcrypt ou comparação de senha
                    if (logs.stdout.includes('bcrypt') || logs.stdout.includes('compare')) {
                        console.log('\n⚠️ Possível problema com bcrypt. Verificando...');
                    }
                }

                // 5. Verificar estrutura da tabela usuarios
                console.log('\n=== 5. VERIFICANDO ESTRUTURA DA TABELA ===');
                const tableStruct = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                    DESCRIBE usuarios;
                    " 2>&1 | grep -v "Warning"
                `);
                console.log('Estrutura da tabela usuarios:');
                console.log(tableStruct.stdout);

                // 6. Salvar relatório
                const relatorio = {
                    timestamp: new Date().toISOString(),
                    containers: containers.stdout,
                    usuario_existe: usuarioExiste,
                    login_funcionando: loginOK,
                    teste_api: testLogin.stdout,
                    verificacao_banco: checkUser.stdout,
                    estrutura_tabela: tableStruct.stdout
                };

                fs.writeFileSync('RELATORIO-VERIFICACAO-CARLOS.json', JSON.stringify(relatorio, null, 2));
                console.log('\n✅ Relatório salvo em RELATORIO-VERIFICACAO-CARLOS.json');

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
console.log('🔍 VERIFICANDO USUÁRIO CARLOS E TESTANDO LOGIN\n');
console.log('='.repeat(60));

verificarETestar()
    .then(({ loginOK, usuarioExiste }) => {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESULTADO DA VERIFICAÇÃO');
        console.log('='.repeat(60));
        console.log('Usuário no banco:', usuarioExiste ? '✅ SIM' : '❌ NÃO');
        console.log('Login funcionando:', loginOK ? '✅ SIM' : '❌ NÃO');
        console.log('\n📋 Credenciais:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm/login');
        console.log('='.repeat(60));
        
        if (!loginOK) {
            console.log('\n⚠️ O login ainda não está funcionando.');
            console.log('Próximos passos: testar no navegador e verificar logs detalhados.');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
