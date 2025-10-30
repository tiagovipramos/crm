const { Client } = require('ssh2');
const fs = require('fs');

// Configurações SSH
const sshConfig = {
    host: '185.217.125.72',
    port: 22,
    username: 'root',
    password: 'UA3485Z43hqvZ@4r'
};

const relatorio = {
    timestamp: new Date().toISOString(),
    etapas: [],
    problemas: [],
    solucoes: []
};

function log(mensagem) {
    console.log(`[${new Date().toLocaleTimeString()}] ${mensagem}`);
    relatorio.etapas.push({
        timestamp: new Date().toISOString(),
        mensagem
    });
}

function executarComando(conn, comando) {
    return new Promise((resolve, reject) => {
        log(`Executando: ${comando}`);
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
            log('✅ Conectado ao servidor VPS');

            try {
                // 1. Verificar se os containers estão rodando
                log('\n=== 1. VERIFICANDO CONTAINERS ===');
                const containers = await executarComando(conn, 'docker ps --format "{{.Names}} - {{.Status}}"');
                log(`Containers ativos:\n${containers.stdout}`);

                // 2. Verificar logs do backend
                log('\n=== 2. ANALISANDO LOGS DO BACKEND ===');
                const logsBackend = await executarComando(conn, 'docker logs crm-backend --tail 100');
                log(`Logs recentes do backend:\n${logsBackend.stdout.substring(0, 2000)}`);

                // 3. Verificar usuário carlos@protecar.com no banco de dados
                log('\n=== 3. VERIFICANDO USUÁRIO NO BANCO ===');
                const checkUser = await executarComando(conn, `
                    docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                    SELECT id, email, nome, tipo_usuario, ativo, created_at 
                    FROM usuarios 
                    WHERE email = 'carlos@protecar.com'
                    "
                `);
                log(`Dados do usuário Carlos:\n${checkUser.stdout}`);

                if (!checkUser.stdout.includes('carlos@protecar.com')) {
                    relatorio.problemas.push('❌ PROBLEMA: Usuário carlos@protecar.com não existe no banco de dados');
                    
                    // Verificar todos os usuários tipo 'consultor'
                    log('\n=== 4. VERIFICANDO TODOS OS CONSULTORES ===');
                    const allConsultores = await executarComando(conn, `
                        docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                        SELECT id, email, nome, tipo_usuario, ativo 
                        FROM usuarios 
                        WHERE tipo_usuario = 'consultor'
                        "
                    `);
                    log(`Consultores no sistema:\n${allConsultores.stdout}`);

                    // Criar usuário carlos@protecar.com
                    log('\n=== 5. CRIANDO USUÁRIO CARLOS ===');
                    const bcrypt = require('bcrypt');
                    const senhaHash = await bcrypt.hash('123456', 10);
                    
                    const createUser = await executarComando(conn, `
                        docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                        INSERT INTO usuarios (email, senha, nome, tipo_usuario, ativo, created_at)
                        VALUES ('carlos@protecar.com', '${senhaHash}', 'Carlos Silva', 'consultor', 1, NOW())
                        "
                    `);
                    
                    if (createUser.code === 0) {
                        log('✅ Usuário carlos@protecar.com criado com sucesso');
                        relatorio.solucoes.push('Usuário carlos@protecar.com criado no banco de dados');
                    } else {
                        log(`❌ Erro ao criar usuário: ${createUser.stderr}`);
                    }

                    // Verificar se foi criado
                    const verifyUser = await executarComando(conn, `
                        docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                        SELECT id, email, nome, tipo_usuario, ativo 
                        FROM usuarios 
                        WHERE email = 'carlos@protecar.com'
                        "
                    `);
                    log(`Verificação após criação:\n${verifyUser.stdout}`);

                } else {
                    log('✅ Usuário carlos@protecar.com existe no banco');
                    
                    // Verificar se está ativo
                    if (!checkUser.stdout.includes('\t1\t')) {
                        relatorio.problemas.push('❌ PROBLEMA: Usuário carlos@protecar.com está inativo');
                        
                        log('\n=== 4. ATIVANDO USUÁRIO ===');
                        const activateUser = await executarComando(conn, `
                            docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                            UPDATE usuarios SET ativo = 1 WHERE email = 'carlos@protecar.com'
                            "
                        `);
                        
                        if (activateUser.code === 0) {
                            log('✅ Usuário ativado com sucesso');
                            relatorio.solucoes.push('Usuário carlos@protecar.com ativado');
                        }
                    } else {
                        log('✅ Usuário está ativo');
                    }

                    // Resetar senha para garantir
                    log('\n=== 5. RESETANDO SENHA ===');
                    const bcrypt = require('bcrypt');
                    const senhaHash = await bcrypt.hash('123456', 10);
                    
                    const resetPassword = await executarComando(conn, `
                        docker exec crm-db mysql -uroot -pUA3485Z43hqvZ@4r crm_protecar -e "
                        UPDATE usuarios SET senha = '${senhaHash}' WHERE email = 'carlos@protecar.com'
                        "
                    `);
                    
                    if (resetPassword.code === 0) {
                        log('✅ Senha resetada para 123456');
                        relatorio.solucoes.push('Senha do usuário resetada');
                    }
                }

                // 6. Verificar rota de login no backend
                log('\n=== 6. VERIFICANDO ROTA DE LOGIN ===');
                const checkRoute = await executarComando(conn, 'docker exec crm-backend cat /app/src/routes/authRoutes.ts | grep -A 5 "login"');
                log(`Rota de login:\n${checkRoute.stdout}`);

                // 7. Testar login via API
                log('\n=== 7. TESTANDO LOGIN VIA API ===');
                const testLogin = await executarComando(conn, `
                    curl -X POST http://localhost:4000/api/auth/login \\
                    -H "Content-Type: application/json" \\
                    -d '{"email":"carlos@protecar.com","senha":"123456"}' \\
                    -w "\\nHTTP Status: %{http_code}\\n"
                `);
                log(`Resposta da API:\n${testLogin.stdout}`);

                // 8. Verificar logs após teste de login
                log('\n=== 8. LOGS APÓS TESTE DE LOGIN ===');
                const logsAposTeste = await executarComando(conn, 'docker logs crm-backend --tail 20');
                log(`Logs recentes:\n${logsAposTeste.stdout}`);

                // 9. Verificar variáveis de ambiente
                log('\n=== 9. VERIFICANDO VARIÁVEIS DE AMBIENTE ===');
                const checkEnv = await executarComando(conn, 'docker exec crm-backend env | grep -E "(JWT_SECRET|NODE_ENV|PORT)"');
                log(`Variáveis de ambiente:\n${checkEnv.stdout}`);

                // Salvar relatório
                fs.writeFileSync('RELATORIO-LOGIN-CARLOS.json', JSON.stringify(relatorio, null, 2));
                log('\n✅ Relatório salvo em RELATORIO-LOGIN-CARLOS.json');

                conn.end();
                resolve(relatorio);

            } catch (error) {
                log(`❌ Erro: ${error.message}`);
                relatorio.problemas.push(`Erro na investigação: ${error.message}`);
                conn.end();
                reject(error);
            }
        }).on('error', (err) => {
            log(`❌ Erro de conexão SSH: ${err.message}`);
            reject(err);
        }).connect(sshConfig);
    });
}

// Executar investigação
investigar()
    .then(() => {
        console.log('\n✅ Investigação concluída com sucesso!');
        console.log(`\n📊 Relatório:`);
        console.log(`- Etapas executadas: ${relatorio.etapas.length}`);
        console.log(`- Problemas encontrados: ${relatorio.problemas.length}`);
        console.log(`- Soluções aplicadas: ${relatorio.solucoes.length}`);
        
        if (relatorio.problemas.length > 0) {
            console.log('\n❌ PROBLEMAS ENCONTRADOS:');
            relatorio.problemas.forEach(p => console.log(`  ${p}`));
        }
        
        if (relatorio.solucoes.length > 0) {
            console.log('\n✅ SOLUÇÕES APLICADAS:');
            relatorio.solucoes.forEach(s => console.log(`  ${s}`));
        }
        
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro na investigação:', error.message);
        process.exit(1);
    });
