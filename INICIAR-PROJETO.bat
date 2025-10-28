@echo off
echo ============================================
echo    PROTECAR CRM - INICIANDO PROJETO
echo ============================================
echo.

REM Verificar se o MySQL está rodando
echo [1/5] Verificando MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    MySQL ja esta rodando
) else (
    echo    Iniciando MySQL...
    start "" "C:\xampp3\mysql_start.bat"
    timeout /t 3 /nobreak >nul
)

echo.
echo [2/5] Verificando banco de dados...
cd /d %~dp0backend
node dev-scripts/adicionar-coluna-whatsapp-id.js >nul 2>&1
node dev-scripts/preencher-ids-mensagens-antigas.js >nul 2>&1
node dev-scripts/limpar-mensagens-duplicadas.js >nul 2>&1
echo    Banco otimizado
cd /d %~dp0

echo.
echo [3/5] Iniciando Backend na porta 3001...
start "Backend - Protecar CRM" cmd /k "cd /d %~dp0backend && npm run dev"

REM Aguardar o backend iniciar
timeout /t 5 /nobreak >nul

echo.
echo [4/5] Iniciando Frontend na porta 3000...
start "Frontend - Protecar CRM" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo [5/5] Finalizando...
timeout /t 2 /nobreak >nul

echo.
echo ============================================
echo    PROJETO INICIADO COM SUCESSO!
echo ============================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo === MODULOS DISPONIVEIS ===
echo CRM Vendedores:  http://localhost:3000/crm
echo Painel Indicador: http://localhost:3000/indicador/login
echo Painel Admin:     http://localhost:3000/admin/login
echo.
echo Aguarde alguns segundos para tudo iniciar...
echo Pressione qualquer tecla para fechar esta janela.
echo.
pause >nul
