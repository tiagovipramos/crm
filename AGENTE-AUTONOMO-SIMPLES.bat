@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ============================================
:: AGENTE AUTÔNOMO DEVOPS - VERSÃO SIMPLIFICADA
:: Sem necessidade de SSH - usa apenas HTTP/CURL
:: ============================================
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     AGENTE AUTÔNOMO DEVOPS - CRM SYSTEM (SIMPLES)              ║
echo ║     Diagnóstico e Teste via HTTP                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: Configurações
set FRONTEND_URL=http://185.217.125.72:3000
set BACKEND_URL=http://185.217.125.72:3001
set TEST_USER=tiago@vipseg.org
set TEST_PASS=123456

:: ============================================
:: FASE 1: DIAGNÓSTICO REMOTO
:: ============================================
echo [FASE 1] Diagnosticando sistema via HTTP...
echo.

echo [1.1] Testando Frontend...
curl -s -o frontend_test.html -w "HTTP %%{http_code} - Tempo: %%{time_total}s" %FRONTEND_URL% > frontend_status.txt 2>&1
set /p FRONTEND_STATUS=<frontend_status.txt
echo Frontend: !FRONTEND_STATUS!
echo.

echo [1.2] Testando Backend API Health...
curl -s -o backend_health.json -w "HTTP %%{http_code} - Tempo: %%{time_total}s" %BACKEND_URL%/api/health > backend_status.txt 2>&1
set /p BACKEND_STATUS=<backend_status.txt
echo Backend: !BACKEND_STATUS!
echo.

echo [1.3] Testando endpoint de login indicador...
curl -s -o indicador_page.html -w "HTTP %%{http_code}" %FRONTEND_URL%/indicador > indicador_status.txt 2>&1
set /p INDICADOR_STATUS=<indicador_status.txt
echo Indicador Page: !INDICADOR_STATUS!
echo.

echo [1.4] Testando endpoint de login (POST)...
curl -X POST %BACKEND_URL%/api/indicador/login ^
    -H "Content-Type: application/json" ^
    -d "{\"email\":\"%TEST_USER%\",\"password\":\"%TEST_PASS%\"}" ^
    -s -o login_test.json -w "%%{http_code}" > login_status.txt 2>&1

set /p LOGIN_STATUS=<login_status.txt
echo Login API: HTTP !LOGIN_STATUS!
if exist login_test.json (
    echo Resposta:
    type login_test.json
    echo.
)
echo.

:: ============================================
:: FASE 2: ANÁLISE DE RESULTADOS
:: ============================================
echo [FASE 2] Analisando resultados...
echo.

set ERRORS_FOUND=0

if not "!FRONTEND_STATUS:200=!"=="!FRONTEND_STATUS!" (
    echo [OK] Frontend respondendo corretamente
) else (
    echo [ERRO] Frontend não está respondendo
    set /a ERRORS_FOUND+=1
)

if not "!BACKEND_STATUS:200=!"=="!BACKEND_STATUS!" (
    echo [OK] Backend respondendo corretamente
) else (
    echo [ERRO] Backend não está respondendo
    set /a ERRORS_FOUND+=1
)

if not "!LOGIN_STATUS:200=!"=="!LOGIN_STATUS!" (
    if not "!LOGIN_STATUS:401=!"=="!LOGIN_STATUS!" (
        echo [AVISO] Login falhou (HTTP !LOGIN_STATUS!) - pode ser credenciais ou erro no backend
        set /a ERRORS_FOUND+=1
    ) else (
        echo [INFO] Login retornou 401 - credenciais inválidas ou usuário não existe
    )
) else (
    echo [OK] Login funcionando corretamente!
)

echo.
echo Total de erros detectados: !ERRORS_FOUND!
echo.

:: ============================================
:: FASE 3: TESTE INTERATIVO COM BROWSER
:: ============================================
echo [FASE 3] Iniciando teste com browser real...
echo.
echo Vou abrir o browser para testar o login interativamente...
timeout /t 3 >nul

:: Abrir browser
start "" "%FRONTEND_URL%/indicador/login"

echo.
echo Browser aberto em: %FRONTEND_URL%/indicador/login
echo.
echo Por favor teste o login manualmente com:
echo   Email: %TEST_USER%
echo   Senha: %TEST_PASS%
echo.
pause

:: ============================================
:: FASE 4: VERIFICAR ERROS COMUNS
:: ============================================
echo.
echo [FASE 4] Verificando erros comuns...
echo.

echo [4.1] Testando CORS...
curl -X OPTIONS %BACKEND_URL%/api/indicador/login ^
    -H "Origin: %FRONTEND_URL%" ^
    -H "Access-Control-Request-Method: POST" ^
    -H "Access-Control-Request-Headers: Content-Type" ^
    -v > cors_test.txt 2>&1

findstr /i "access-control-allow-origin" cors_test.txt >nul
if !ERRORLEVEL! EQU 0 (
    echo [OK] CORS configurado
) else (
    echo [AVISO] CORS pode não estar configurado corretamente
    type cors_test.txt | findstr /i "access-control"
)
echo.

echo [4.2] Testando conectividade do banco de dados...
curl -s %BACKEND_URL%/api/health -H "Accept: application/json" > db_health.json
type db_health.json | findstr /i "database\|db\|mysql\|status" >nul
if !ERRORLEVEL! EQU 0 (
    echo [OK] Backend reportou status do banco
    type db_health.json
) else (
    echo [AVISO] Não foi possível verificar status do banco
)
echo.

:: ============================================
:: FASE 5: CORREÇÕES LOCAIS
:: ============================================
echo [FASE 5] Verificando se há correções necessárias no código local...
echo.

:: Verificar arquivos que podem estar com problemas
echo Analisando arquivos locais...

:: Verificar se há arquivos TypeScript/JavaScript com erros
if exist "backend\src\index.ts" (
    echo Verificando backend\src\index.ts...
    findstr /i "cors" backend\src\index.ts >nul
    if !ERRORLEVEL! NEQ 0 (
        echo [AVISO] CORS pode não estar configurado no index.ts
    )
)

echo.

:: ============================================
:: FASE 6: COMMIT AUTOMÁTICO
:: ============================================
echo [FASE 6] Verificando alterações para commit...
echo.

git status --porcelain > git_changes.txt
for /f %%i in ('type git_changes.txt 2^>nul ^| find /c /v ""') do set CHANGE_COUNT=%%i

if !CHANGE_COUNT! GTR 0 (
    echo Encontradas !CHANGE_COUNT! alterações
    echo.
    git status
    echo.
    echo Fazer commit automático? (S/N)
    choice /c SN /n
    if !ERRORLEVEL! EQU 1 (
        git add -A
        for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
        for /f "tokens=1-2 delims=/: " %%a in ('time /t') do set mytime=%%a%%b
        git commit -m "Auto-fix: Verificação e correções automáticas - !mydate! !mytime!"
        git push origin main
        echo [OK] Commit realizado
    )
) else (
    echo [INFO] Nenhuma alteração local para commitar
)
echo.

:: ============================================
:: FASE 7: RELATÓRIO FINAL
:: ============================================
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  RELATÓRIO DE DIAGNÓSTICO                                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Status dos Serviços:
echo   Frontend: !FRONTEND_STATUS!
echo   Backend:  !BACKEND_STATUS!
echo   Login:    HTTP !LOGIN_STATUS!
echo.
echo Arquivos gerados:
echo   - frontend_test.html
echo   - backend_health.json
echo   - login_test.json
echo   - cors_test.txt
echo   - git_changes.txt
echo.
echo Sistema: %FRONTEND_URL%/indicador/login
echo.
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  PRÓXIMOS PASSOS                                               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
if !ERRORS_FOUND! GTR 0 (
    echo [!] Foram detectados !ERRORS_FOUND! erros
    echo.
    echo Recomendações:
    echo 1. Verificar logs do Docker no servidor VPS
    echo 2. Reiniciar containers se necessário
    echo 3. Verificar configurações de CORS no backend
    echo 4. Validar credenciais do banco de dados
    echo.
    echo Para acessar o servidor SSH:
    echo   ssh root@185.217.125.72
    echo   Senha: UA3485Z43hqvZ@4r
    echo.
    echo Comandos úteis no servidor:
    echo   cd /root  (ou onde está o projeto)
    echo   docker-compose ps
    echo   docker-compose logs backend
    echo   docker-compose restart
) else (
    echo [✓] Sistema aparenta estar funcionando corretamente!
    echo.
    echo Teste o login manualmente para confirmar.
)
echo.
pause
