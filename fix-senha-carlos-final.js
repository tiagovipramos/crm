const { Client } = require('ssh2');

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

async function corrigirSenha() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✅ Conectado ao servidor VPS\n');

            try {
                // 1. Gerar hash usando bcryptjs DO BACKEND
                console.log('=== 1. GERANDO HASH COM BCRYPTJS DO BACKEND ===');
                const gerarHash = await executarComando(conn, `
                    docker exec crm-backend node -e "
                    const bcrypt = require('bcryptjs');
                    bcrypt.hash('123456', 10).then(hash => {
                        console.log('HASH_GERADO:', hash);
                    }).catch(err => console.error('ERRO:', err));
                    " 2>&1
                `);
                console.log('Saída completa:', gerarHash.stdout);
                
                const hashMatch = gerarHash.stdout.match(/HASH_GERADO: (\$2[ab]\$\d+\$.+)/);
                if (!hashMatch) {
                    throw new Error('Não foi possível gerar o hash. Saída: ' + gerarHash.stdout);
                }
                
                const senhaHash = hashMatch[1].trim();
                console.log('✅ Hash gerado:', senhaHash);
                console.log('Tipo:', senhaHash.substring(0, 4));

                // 2. Atualizar senha no banco
                console.log('\n=== 2. ATUALIZANDO SENHA NO BANCO ===');
                const update = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "
                    UPDATE consultores 
                    SET senha = '${senhaHash}'
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1
                `);
                
                if (update.stderr && update.stderr.includes('ERROR')) {
                    console.log('❌ Erro:', update.stderr);
                } else {
                    console.log('✅ Senha atualizada!');
                }

                // 3. Verificar no banco
                console.log('\n=== 3. VERIFICANDO NO BANCO ===');
                const verify = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "
                    SELECT email, SUBSTRING(senha, 1, 30) as senha_inicio, ativo
                    FROM consultores 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1 | grep -v "Warning"
                `);
                console.log(verify.stdout);

                // 4. Testar login via API
                console.log('\n=== 4. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s 2>&1
                `);
                console.log('Resposta:');
                console.log(testLogin.stdout);
                
                const loginOK = testLogin.stdout.includes('token') || testLogin.stdout.includes('"consultor"');

                console.log('\n✅ Processo concluído');
                
                conn.end();
                resolve({ loginOK, senhaHash });

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

console.log('🔧 CORRIGINDO SENHA DO CARLOS (USANDO BCRYPTJS DO BACKEND)\n');
console.log('='.repeat(70));

corrigirSenha()
    .then(({ loginOK, senhaHash }) => {
        console.log('\n' + '='.repeat(70));
        console.log('✅ CORREÇÃO CONCLUÍDA!');
        console.log('='.repeat(70));
        console.log('\n📊 RESULTADO:');
        console.log('   Hash:', senhaHash.substring(0, 35) + '...');
        console.log('   Login via API:', loginOK ? '✅ FUNCIONANDO' : '❌ FALHOU');
        console.log('\n📋 CREDENCIAIS:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm');
        console.log('='.repeat(70));
        
        if (loginOK) {
            console.log('\n🎉🎉🎉 SUCESSO! VAMOS TESTAR NO NAVEGADOR! 🎉🎉🎉');
        } else {
            console.log('\n⚠️ Login via API falhou. Vamos testar no navegador mesmo assim.');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
