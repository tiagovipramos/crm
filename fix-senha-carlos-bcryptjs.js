const { Client } = require('ssh2');
const bcryptjs = require('bcryptjs');

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
                // 1. Gerar hash usando bcryptjs (mesmo do backend)
                console.log('=== 1. GERANDO HASH COM BCRYPTJS ===');
                const senhaHash = await bcryptjs.hash('123456', 10);
                console.log('Hash gerado:', senhaHash);
                console.log('Tipo de hash:', senhaHash.substring(0, 4)); // Deve ser $2a$

                // 2. Atualizar senha no banco
                console.log('\n=== 2. ATUALIZANDO SENHA NO BANCO ===');
                const update = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "
                    UPDATE consultores 
                    SET senha = '${senhaHash}', updated_at = NOW() 
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
                    SELECT id, email, nome, SUBSTRING(senha, 1, 20) as senha_inicio
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

                // 5. Se ainda não funcionar, adicionar mais debug
                if (!loginOK) {
                    console.log('\n=== 5. DEBUG ADICIONAL ===');
                    
                    // Testar localmente se o hash funciona
                    const testeLocal = await bcryptjs.compare('123456', senhaHash);
                    console.log('Teste local do hash:', testeLocal ? '✅ FUNCIONA' : '❌ FALHOU');
                    
                    // Verificar logs
                    const logs = await executarComando(conn, `
                        docker logs crm-backend --tail 20 2>&1 | grep -i "login\\|erro\\|error"
                    `);
                    console.log('Logs relevantes:', logs.stdout || 'Nenhum');
                }

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

console.log('🔧 CORRIGINDO SENHA DO CARLOS COM BCRYPTJS\n');
console.log('='.repeat(70));

corrigirSenha()
    .then(({ loginOK, senhaHash }) => {
        console.log('\n' + '='.repeat(70));
        console.log('✅ CORREÇÃO CONCLUÍDA!');
        console.log('='.repeat(70));
        console.log('\n📊 RESULTADO:');
        console.log('   Hash gerado:', senhaHash.substring(0, 30) + '...');
        console.log('   Login funcionando:', loginOK ? '✅ SIM' : '❌ NÃO');
        console.log('\n📋 CREDENCIAIS:');
        console.log('   Email: carlos@protecar.com');
        console.log('   Senha: 123456');
        console.log('   URL: http://185.217.125.72:3000/crm');
        console.log('='.repeat(70));
        
        if (loginOK) {
            console.log('\n🎉🎉🎉 SUCESSO! AGORA VAMOS TESTAR NO NAVEGADOR! 🎉🎉🎉');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
