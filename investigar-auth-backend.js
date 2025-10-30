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

async function investigar() {
    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            console.log('✅ Conectado ao servidor VPS\n');

            try {
                // 1. Baixar arquivo de rotas de autenticação
                console.log('=== 1. BAIXANDO ARQUIVO authRoutes.ts ===');
                const authRoutes = await executarComando(conn, `
                    docker exec crm-backend cat /app/src/routes/authRoutes.ts 2>&1
                `);
                
                if (!authRoutes.stderr.includes('ERROR')) {
                    fs.writeFileSync('backend-authRoutes.ts', authRoutes.stdout);
                    console.log('✅ Arquivo salvo em backend-authRoutes.ts');
                    console.log('\nTrecho relevante do código:');
                    const loginSection = authRoutes.stdout.split('\n')
                        .filter(line => line.includes('login') || line.includes('compare') || line.includes('bcrypt'))
                        .slice(0, 20);
                    console.log(loginSection.join('\n'));
                } else {
                    console.log('❌ Erro:', authRoutes.stderr);
                }

                // 2. Ver como bcrypt é usado
                console.log('\n=== 2. VERIFICANDO USO DO BCRYPT ===');
                const bcryptUsage = await executarComando(conn, `
                    docker exec crm-backend grep -r "bcrypt" /app/src --include="*.ts" -A 3 -B 3 2>&1 | head -100
                `);
                console.log(bcryptUsage.stdout.substring(0, 1500));

                // 3. Testar com a senha ORIGINAL do Carlos
                console.log('\n=== 3. TESTANDO COM SENHA ORIGINAL ===');
                
                // Recuperar senha original
                const senhaOriginal = '$2a$10$rOzJqKZXHjKGzK5fY.pGYO0/dZqN3E5mCpqj5ZCXy9J5QKLKBz1Wm';
                
                // Restaurar senha original
                const restore = await executarComando(conn, `
                    docker exec crm-mysql mysql -uroot -proot123 protecar_crm -e "
                    UPDATE consultores 
                    SET senha = '${senhaOriginal}' 
                    WHERE email = 'carlos@protecar.com';
                    " 2>&1
                `);
                console.log('Senha original restaurada');

                // Testar login
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:3001/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -s 2>&1
                `);
                console.log('Resultado do teste:');
                console.log(testLogin.stdout);
                
                const loginOK = testLogin.stdout.includes('token') || testLogin.stdout.includes('"user"');

                // 4. Verificar logs do backend durante o login
                console.log('\n=== 4. LOGS DO BACKEND ===');
                const logs = await executarComando(conn, `
                    docker logs crm-backend --tail 30 2>&1
                `);
                console.log(logs.stdout);

                // 5. Verificar se há algum middleware ou validação adicional
                console.log('\n=== 5. VERIFICANDO MIDDLEWARES ===');
                const middlewares = await executarComando(conn, `
                    docker exec crm-backend find /app/src -name "*middleware*" -o -name "*auth*" 2>&1 | head -20
                `);
                console.log('Arquivos relacionados à autenticação:');
                console.log(middlewares.stdout);

                const relatorio = {
                    timestamp: new Date().toISOString(),
                    login_com_senha_original: loginOK,
                    arquivos_baixados: ['backend-authRoutes.ts'],
                    proximo_passo: loginOK ? 
                        'Login funcionou com senha original. Descobrir qual é a senha correta.' :
                        'Login não funcionou mesmo com senha original. Verificar código de autenticação.'
                };

                fs.writeFileSync('RELATORIO-INVESTIGACAO-AUTH.json', JSON.stringify(relatorio, null, 2));
                console.log('\n✅ Relatório salvo');

                conn.end();
                resolve({ loginOK });

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

console.log('🔍 INVESTIGANDO AUTENTICAÇÃO DO BACKEND\n');
console.log('='.repeat(70));

investigar()
    .then(({ loginOK }) => {
        console.log('\n' + '='.repeat(70));
        console.log('✅ INVESTIGAÇÃO CONCLUÍDA');
        console.log('='.repeat(70));
        console.log('\nLogin funcionou:', loginOK ? '✅ SIM' : '❌ NÃO');
        
        if (!loginOK) {
            console.log('\n📝 PRÓXIMA AÇÃO: Analisar o código baixado para entender o problema.');
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    });
