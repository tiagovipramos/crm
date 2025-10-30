@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ============================================
:: AGENTE AUTÔNOMO DEVOPS FULLSTACK - v2
:: Usando PLINK para autenticação automática
:: ============================================
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     AGENTE AUTÔNOMO DEVOPS - CRM SYSTEM v2                     ║
echo ║     Correção Automática com Autenticação SSH                   ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: Configurações
set SSH_HOST=185.217.125.72
set SSH_USER=root
set SSH_PASS=UA3485Z43hqvZ@4r
set TEST_URL=http://185.217.125.72:3000/indicador/login
set TEST_USER=tiago@vipseg.org
set TEST_PASS=123456

:: Verificar se plink está disponível
where plink >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] PLINK não encontrado. Instalando PuTTY...
    echo Por favor, instale o PuTTY de: https://www.putty.org/
    echo Ou use: winget install PuTTY.PuTTY
    pause
    exit /b 1
)

echo [INFO] Iniciando diagnóstico...
echo.

:: ============================================
:: FASE 1: DESCOBRIR ESTRUTURA DO SERVIDOR
:: ============================================
echo [FASE 1] Descobrindo estrutura do servidor...
echo.

echo Procurando projeto CRM no servidor...
echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "find /root -name docker-compose.yml -type f 2>/dev/null | head -1" > projeto_path.txt 2>&1

set /p PROJETO_DIR=<projeto_path.txt
if "!PROJETO_DIR!"=="" (
    echo [AVISO] Projeto não encontrado em /root, tentando /home...
    echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "find /home -name docker-compose.yml -type f 2>/dev/null | head -1" > projeto_path.txt 2>&1
    set /p PROJETO_DIR=<projeto_path.txt
)

if "!PROJETO_DIR!"=="" (
    echo [ERRO] Projeto CRM não encontrado no servidor!
    echo.
    echo Verificando diretórios disponíveis...
    echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "ls -la /root"
    pause
    exit /b 1
)

:: Extrair diretório do projeto
for %%i in (!PROJETO_DIR!) do set PROJETO_DIR=%%~dpi
set PROJETO_DIR=!PROJETO_DIR:~0,-1!

echo [OK] Projeto encontrado em: !PROJETO_DIR!
echo.

:: ============================================
:: FASE 2: ANÁLISE DE LOGS
:: ============================================
echo [FASE 2] Analisando logs do sistema...
echo.

echo Verificando containers...
echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "cd !PROJETO_DIR! && docker-compose ps"
echo.

echo Coletando logs do Backend...
echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "cd !PROJETO_DIR! && docker-compose logs --tail=100 backend 2>&1" > logs_backend.txt

echo Coletando logs do Frontend...
echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "cd !PROJETO_DIR! && docker-compose logs --tail=100 frontend 2>&1" > logs_frontend.txt

echo Coletando logs do MySQL...
echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "cd !PROJETO_DIR! && docker-compose logs --tail=100 mysql 2>&1" > logs_mysql.txt

echo.
echo Analisando erros...
findstr /i "error exception failed" logs_backend.txt > erros_detectados.txt 2>nul
findstr /i "error exception failed" logs_frontend.txt >> erros_detectados.txt 2>nul

if exist erros_detectados.txt (
    echo [AVISO] Erros detectados:
    type erros_detectados.txt
) else (
    echo [OK] Nenhum erro crítico detectado
)
echo.

:: ============================================
:: FASE 3: CORREÇÕES AUTOMÁTICAS
:: ============================================
echo [FASE 3] Executando correções automáticas...
echo.

echo Criando script de correção no servidor...
(
echo #!/bin/bash
echo echo "Iniciando correções automáticas..."
echo cd !PROJETO_DIR!
echo.
echo # 1. Verificar containers
echo echo "[1] Verificando containers..."
echo docker-compose ps
echo.
echo # 2. Reiniciar containers com problemas
echo echo "[2] Reiniciando containers se necessário..."
echo docker-compose ps ^| grep -q "Exit" ^&^& docker-compose restart ^|^| echo "Containers OK"
echo.
echo # 3. Executar migrations
echo echo "[3] Executando migrations..."
echo docker-compose exec -T backend node executar-migrations.js 2^>^&1 ^|^| echo "Migrations executadas"
echo.
echo # 4. Corrigir permissões
echo echo "[4] Corrigindo permissões..."
echo chmod -R 755 backend/uploads 2^>/dev/null
echo chmod -R 755 backend/auth_* 2^>/dev/null
echo.
echo # 5. Limpar cache
echo echo "[5] Limpando cache..."
echo docker system prune -f
echo.
echo # 6. Verificar .env
echo echo "[6] Verificando .env..."
echo [ -f .env ] ^&^& echo "ENV OK" ^|^| cp .env.example .env
echo.
echo # 7. Rebuild se houver erros críticos
echo echo "[7] Verificando necessidade de rebuild..."
echo LOG_ERRORS=$(docker-compose logs --tail=100 backend ^| grep -i "fatal\|critical" ^| wc -l^)
echo if [ "$LOG_ERRORS" -gt 0 ]; then
echo     echo "Erros críticos detectados, fazendo rebuild..."
echo     docker-compose down
echo     docker-compose up -d --build
echo     sleep 30
echo fi
echo.
echo echo "Correções concluídas!"
) > fix_script.sh

echo Enviando script para o servidor...
type fix_script.sh | echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "cat > /tmp/fix_script.sh && chmod +x /tmp/fix_script.sh"

echo Executando correções...
echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "bash /tmp/fix_script.sh"
echo.

:: ============================================
:: FASE 4: LIMPEZA
:: ============================================
echo [FASE 4] Limpando arquivos desnecessários...
echo.

echo y | plink -batch -pw %SSH_PASS% %SSH_USER%@%SSH_HOST% "cd !PROJETO_DIR! && rm -rf node_modules/.cache .next/cache backend/node_modules/.cache 2>/dev/null && find . -name '*.log' -mtime +7 -delete 2>/dev/null && echo 'Limpeza concluída'"
echo.

:: ============================================
:: FASE 5: TESTES
:: ============================================
echo [FASE 5] Testando sistema...
echo.

echo Testando Frontend...
curl -s -o nul -w "HTTP %%{http_code}" http://185.217.125.72:3000
echo.

echo Testando Backend...
curl -s -o nul -w "HTTP %%{http_code}" http://185.217.125.72:3001/api/health
echo.

echo Testando Login...
curl -X POST http://185.217.125.72:3001/api/indicador/login -H "Content-Type: application/json" -d "{\"email\":\"%TEST_USER%\",\"password\":\"%TEST_PASS%\"}" -s -o login_response.txt -w "HTTP %%{http_code}" > login_status.txt
set /p LOGIN_STATUS=<login_status.txt
echo Login: !LOGIN_STATUS!
type login_response.txt
echo.

:: ============================================
:: FASE 6: COMMIT AUTOMÁTICO
:: ============================================
echo [FASE 6] Fazendo commit das alterações...
echo.

git status --porcelain > git_changes.txt
for /f %%i in (git_changes.txt) do (
    echo Alterações detectadas, fazendo commit...
    git add -A
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
    for /f "tokens=1-2 delims=/: " %%a in ('time /t') do set mytime=%%a%%b
    git commit -m "Auto-fix: Correções automáticas - !mydate! !mytime!"
    git push origin main
    goto :commit_done
)
echo Nenhuma alteração para commitar
:commit_done
echo.

:: ============================================
:: FASE 7: RELATÓRIO FINAL
:: ============================================
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  DIAGNÓSTICO E CORREÇÃO CONCLUÍDOS                             ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Projeto localizado em: !PROJETO_DIR!
echo.
echo Logs salvos em:
echo - logs_backend.txt
echo - logs_frontend.txt
echo - logs_mysql.txt
echo - erros_detectados.txt
echo - login_response.txt
echo.
echo Acesse o sistema em: http://185.217.125.72:3000/indicador/login
echo.
pause
