@echo off
echo ==========================================
echo EXPORTAR BANCO DE DADOS LOCAL PARA VPS
echo ==========================================
echo.

REM Configurações
set MYSQL_PATH=C:\xampp3\mysql\bin
set DB_NAME=protecar_crm
set DB_USER=root
set DB_PASS=
set OUTPUT_FILE=banco-local-completo.sql

echo [1/3] Verificando conexão com MySQL...
"%MYSQL_PATH%\mysql.exe" -u%DB_USER% -p%DB_PASS% -e "SELECT 'Conexão OK' as Status;" 2>nul
if errorlevel 1 (
    echo ERRO: Não foi possível conectar ao MySQL local
    echo Verifique se o XAMPP está rodando
    pause
    exit /b 1
)
echo     ✓ Conectado ao MySQL

echo.
echo [2/3] Exportando banco de dados completo...
echo     Database: %DB_NAME%
echo     Arquivo: %OUTPUT_FILE%
echo.

REM Exportar banco completo com estrutura e dados
"%MYSQL_PATH%\mysqldump.exe" -u%DB_USER% -p%DB_PASS% ^
    --databases %DB_NAME% ^
    --single-transaction ^
    --routines ^
    --triggers ^
    --events ^
    --default-character-set=utf8mb4 ^
    --add-drop-database ^
    --result-file="%OUTPUT_FILE%"

if errorlevel 1 (
    echo ERRO ao exportar banco de dados
    pause
    exit /b 1
)

echo     ✓ Banco exportado com sucesso!

echo.
echo [3/3] Criando script de importação para VPS...

REM Criar script shell para importação na VPS com backup automático
(
echo #!/bin/bash
echo.
echo # Script para importar banco local na VPS com backup automático
echo # Gerado automaticamente
echo.
echo echo "=========================================="
echo echo "IMPORTAR BANCO LOCAL PARA VPS"
echo echo "=========================================="
echo echo ""
echo echo "⚠️  ATENÇÃO: Este script irá:"
echo echo "   1. Fazer BACKUP automático do banco atual da VPS"
echo echo "   2. APAGAR completamente o banco da VPS"
echo echo "   3. SUBSTITUIR pelo banco local exportado"
echo echo ""
echo echo "💾 Backup será salvo em: backup-vps-antes-importacao.sql"
echo echo ""
echo read -p "Tem certeza que deseja continuar? (digite 'sim'^): " confirmacao
echo if [ "$confirmacao" != "sim" ]; then
echo     echo "❌ Operação cancelada pelo usuário"
echo     echo "   (É necessário digitar 'sim' para continuar^)"
echo     exit 0
echo fi
echo echo ""
echo.
echo echo "[1/7] Verificando arquivo banco-local-completo.sql..."
echo if [ ! -f "banco-local-completo.sql" ]; then
echo     echo "❌ ERRO: Arquivo banco-local-completo.sql não encontrado"
echo     echo "Faça upload do arquivo primeiro!"
echo     exit 1
echo fi
echo FILE_SIZE=$(du -h banco-local-completo.sql ^| cut -f1^)
echo echo "    ✓ Arquivo encontrado: $FILE_SIZE"
echo echo ""
echo.
echo echo "[2/7] Fazendo BACKUP do banco atual da VPS..."
echo docker-compose up -d mysql ^>^/dev^/null 2^>^&1
echo sleep 10
echo docker exec crm-mysql mysqldump -u root -proot123 --databases protecar_crm ^> backup-vps-antes-importacao.sql 2^>^/dev^/null
echo.
echo if [ -f "backup-vps-antes-importacao.sql" ] ^&^& [ -s "backup-vps-antes-importacao.sql" ]; then
echo     BACKUP_SIZE=$(du -h backup-vps-antes-importacao.sql ^| cut -f1^)
echo     echo "    ✓ Backup criado com sucesso: $BACKUP_SIZE"
echo     echo "    📁 Arquivo: backup-vps-antes-importacao.sql"
echo     echo "    🔒 Backup seguro salvo!"
echo else
echo     echo "    ⚠️  Aviso: Não foi possível criar backup"
echo     echo "    (O banco pode não existir ou estar vazio^)"
echo     echo ""
echo     read -p "    Deseja continuar mesmo assim? (digite 'sim'^): " continuar
echo     if [ "$continuar" != "sim" ]; then
echo         echo "❌ Operação cancelada"
echo         exit 0
echo     fi
echo fi
echo echo ""
echo.
echo echo "[3/7] Parando containers..."
echo docker-compose down
echo echo "    ✓ Containers parados"
echo echo ""
echo.
echo echo "[4/7] Iniciando MySQL..."
echo docker-compose up -d mysql
echo echo "    ⏳ Aguardando MySQL inicializar..."
echo sleep 15
echo echo "    ✓ MySQL pronto"
echo echo ""
echo.
echo echo "[5/7] Importando banco de dados local..."
echo echo "    ⏳ Isso pode levar alguns minutos dependendo do tamanho..."
echo echo "    ⚠️  O banco atual será APAGADO e SUBSTITUÍDO"
echo echo ""
echo docker exec -i crm-mysql mysql -u root -proot123 ^< banco-local-completo.sql
echo.
echo if [ $? -eq 0 ]; then
echo     echo "    ✓ Banco importado com sucesso!"
echo else
echo     echo "    ❌ Erro ao importar banco"
echo     echo ""
echo     echo "⚠️  Para restaurar o backup:"
echo     echo "    docker-compose down"
echo     echo "    docker-compose up -d mysql"
echo     echo "    sleep 15"
echo     echo "    docker exec -i crm-mysql mysql -u root -proot123 ^< backup-vps-antes-importacao.sql"
echo     echo "    docker-compose up -d"
echo     exit 1
echo fi
echo echo ""
echo.
echo echo "[6/7] Verificando importação..."
echo TOTAL_TABLES=$(docker exec -i crm-mysql mysql -u root -proot123 protecar_crm -e "SHOW TABLES;" 2^>^/dev^/null ^| wc -l^)
echo TOTAL_LEADS=$(docker exec -i crm-mysql mysql -u root -proot123 protecar_crm -e "SELECT COUNT(*^) as total FROM leads;" 2^>^/dev^/null ^| tail -n 1^)
echo TOTAL_INDICADORES=$(docker exec -i crm-mysql mysql -u root -proot123 protecar_crm -e "SELECT COUNT(*^) as total FROM indicadores;" 2^>^/dev^/null ^| tail -n 1^)
echo echo "    ✓ Tabelas importadas: $TOTAL_TABLES"
echo echo "    ✓ Leads: $TOTAL_LEADS"
echo echo "    ✓ Indicadores: $TOTAL_INDICADORES"
echo echo ""
echo.
echo echo "[7/7] Iniciando todos os serviços..."
echo docker-compose up -d
echo echo "    ⏳ Aguardando serviços iniciarem..."
echo sleep 10
echo echo "    ✓ Todos os serviços iniciados"
echo echo ""
echo.
echo echo "=========================================="
echo echo "✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!"
echo echo "=========================================="
echo echo ""
echo echo "📊 Banco VPS agora é IDÊNTICO ao banco local"
echo echo ""
echo echo "💾 BACKUP DO BANCO ANTERIOR:"
echo echo "   📁 backup-vps-antes-importacao.sql"
echo if [ -f "backup-vps-antes-importacao.sql" ]; then
echo     BACKUP_SIZE=$(du -h backup-vps-antes-importacao.sql ^| cut -f1^)
echo     echo "   📊 Tamanho: $BACKUP_SIZE"
echo fi
echo echo ""
echo echo "🔄 PARA RESTAURAR O BACKUP (se necessário^):"
echo echo "   docker-compose down"
echo echo "   docker-compose up -d mysql"
echo echo "   sleep 15"
echo echo "   docker exec -i crm-mysql mysql -u root -proot123 ^< backup-vps-antes-importacao.sql"
echo echo "   docker-compose up -d"
echo echo ""
echo echo "🌐 URLs de acesso:"
echo echo "   🔐 Admin:     http://185.217.125.72:3000/admin/login"
echo echo "   🎯 Indicador: http://185.217.125.72:3000/indicador/login"
echo echo "   👤 CRM:       http://185.217.125.72:3000/crm"
echo echo ""
echo echo "🔑 IMPORTANTE: Use as MESMAS credenciais do banco local"
echo echo ""
echo echo "📋 Para verificar logs:"
echo echo "   docker logs crm-backend --tail 30"
echo echo "   docker logs crm-frontend --tail 30"
echo echo ""
echo echo "🔍 Para diagnóstico completo:"
echo echo "   ./diagnostico-vps.sh"
echo echo ""
) > importar-banco-na-vps.sh

echo     ✓ Script criado: importar-banco-na-vps.sh

echo.
echo ==========================================
echo ✅ EXPORTAÇÃO CONCLUÍDA!
echo ==========================================
echo.
echo 📦 Arquivos criados:
echo    1. %OUTPUT_FILE% - Dump completo do banco
echo    2. importar-banco-na-vps.sh - Script para VPS
echo.
echo ⚠️  IMPORTANTE: O script de importação irá:
echo    ✓ Fazer backup AUTOMÁTICO do banco VPS atual
echo    ✓ APAGAR completamente o banco da VPS
echo    ✓ SUBSTITUIR pelo banco local exportado
echo    ✓ Salvar backup em: backup-vps-antes-importacao.sql
echo.
echo 💡 Você poderá restaurar o backup se necessário!
echo.
echo ==========================================
echo 📤 PRÓXIMOS PASSOS:
echo ==========================================
echo.
echo 1️⃣  Envie os 2 arquivos para a VPS:
echo    scp %OUTPUT_FILE% root@185.217.125.72:~/crm/
echo    scp importar-banco-na-vps.sh root@185.217.125.72:~/crm/
echo.
echo 2️⃣  No VPS, execute:
echo    ssh root@185.217.125.72
echo    cd ~/crm
echo    chmod +x importar-banco-na-vps.sh
echo    ./importar-banco-na-vps.sh
echo.
echo 3️⃣  O script pedirá confirmação (digite 'sim'^)
echo.
echo 4️⃣  Pronto! Sistema VPS = Sistema Local
echo.
echo 📊 Tamanho do arquivo exportado:
dir "%OUTPUT_FILE%" | find "%OUTPUT_FILE%"
echo.
pause
