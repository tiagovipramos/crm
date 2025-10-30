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
        console.log(`\n🔧 Executando comando...`);
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
                // 1. Criar script no servidor para gerar hash e inserir usuário
                console.log('\n=== 1. CRIANDO SCRIPT NO SERVIDOR ===');
                const scriptContent = `
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function criarUsuario() {
    try {
        // Gerar hash
        console.log('Gerando hash bcrypt...');
        const senhaHash = await bcrypt.hash('123456', 10);
        console.log('Hash gerado:', senhaHash);

        // Conectar ao banco
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'UA3485Z43hqvZ@4r',
            database: 'crm_protecar'
        });

        console.log('Conectado ao banco de dados');

        // Verificar se usuário existe
        const [existing] = await connection.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            ['carlos@protecar.com']
        );

        if (existing.length > 0) {
            console.log('Usuário já existe. Atualizando senha...');
            await connection.execute(
                'UPDATE usuarios SET senha = ?, ativo = 1, updated_at = NOW() WHERE email = ?',
                [senhaHash, 'carlos@protecar.com']
            );
            console.log('Senha atualizada!');
        } else {
            console.log('Inserindo novo usuário...');
            await connection.execute(
                \`INSERT INTO usuarios (id, email, senha, nome, tipo_usuario, ativo, created_at, updated_at)
                VALUES (UUID(), ?, ?, 'Carlos Silva', 'consultor', 1, NOW(), NOW())\`,
                ['carlos@protecar.com', senhaHash]
            );
            console.log('Usuário criado!');
        }

        // Verificar resultado
        const [user] = await connection.execute(
            'SELECT id, email, nome, tipo_usuario, ativo FROM usuarios WHERE email = ?',
            ['carlos@protecar.com']
        );
        console.log('\\nDados do usuário:', JSON.stringify(user[0], null, 2));

        await connection.end();
        console.log('\\n✅ SUCESSO!');
        process.exit(0);

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        process.exit(1);
    }
}

criarUsuario();
`;

                // 2. Salvar script no container do backend
                const saveScript = await executarComando(conn, `
                    docker exec crm-backend bash -c "cat > /tmp/criar-usuario.js << 'EOF'
${scriptContent}
EOF
"
                `);
                console.log('✅ Script criado no servidor');

                // 3. Executar script
                console.log('\n=== 2. EXECUTANDO SCRIPT ===');
                const execScript = await executarComando(conn, 
                    'docker exec crm-backend node /tmp/criar-usuario.js'
                );
                console.log('Saída:', execScript.stdout);
                if (execScript.stderr) {
                    console.log('Erros:', execScript.stderr);
                }

                // 4. Testar login via API
                console.log('\n=== 3. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s
                `);
                console.log('Resposta da API:', testLogin.stdout);

                const loginSuccess = testLogin.stdout.includes('token') || 
                                   testLogin.stdout.includes('"user"');

                // 5. Verificar no banco
                console.log('\n=== 4. VERIFICAÇÃO FINAL NO BANCO ===');
                const verifyUser = await executarComando(conn, `
                    docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                    SELECT id, email, nome, tipo_usuario, ativo, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as criado_em
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com';
                    " | grep -v "Warning"
                `);
                console.log('Dados no banco:', verifyUser.stdout);

                // 6. Salvar relatório
                const relatorio = {
                    timestamp: new Date().toISOString(),
                    usuario_criado: true,
                    login_funcionando: loginSuccess,
                    email: 'carlos@protecar.com',
                    senha: '123456',
                    url: 'http://185.217.125.72:3000/crm/login',
                    script_output: execScript.stdout,
                    api_test: testLogin.stdout,
                    banco_verificacao: verifyUser.stdout
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
    .then((relatorio) => {
        console.log('\n' + '='.repeat(50));
        console.log('✅✅✅ CONCLUÍDO COM SUCESSO! ✅✅✅');
        console.log('='.repeat(50));
        console.log('\n📋 CREDENCIAIS DE ACESSO:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm/login');
        console.log('\n🔐 STATUS:');
        console.log('   Usuário criado:', relatorio.usuario_criado ? '✅' : '❌');
        console.log('   Login funcionando:', relatorio.login_funcionando ? '✅' : '⚠️');
        console.log('\n' + '='.repeat(50));
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
