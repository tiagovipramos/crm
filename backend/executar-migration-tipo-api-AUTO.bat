@echo off
echo ========================================
echo Executando Migration: Tipo API WhatsApp
echo ========================================
echo.

cd /d "%~dp0"

:: Tentar encontrar MySQL do XAMPP
set "MYSQL_PATH="

if exist "C:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe"
)
if exist "C:\xampp3\mysql\bin\mysql.exe" (
    set "MYSQL_PATH=C:\xampp3\mysql\bin\mysql.exe"
)
if exist "C:\xampp2\mysql\bin\mysql.exe" (
    set "MYSQL_PATH=C:\xampp2\mysql\bin\mysql.exe"
)

if "%MYSQL_PATH%"=="" (
    echo ERRO: MySQL nao encontrado!
    echo.
    echo Tentei nos seguintes locais:
    echo - C:\xampp\mysql\bin\mysql.exe
    echo - C:\xampp3\mysql\bin\mysql.exe
    echo - C:\xampp2\mysql\bin\mysql.exe
    echo.
    echo Por favor, execute as migrations manualmente via phpMyAdmin
    echo Consulte: executar-migration-tipo-api-MANUAL.md
    pause
    exit /b 1
)

echo MySQL encontrado em: %MYSQL_PATH%
echo.

:: Executar migration 1
echo [1/2] Adicionando coluna tipo_api_whatsapp...
"%MYSQL_PATH%" -u root crm_vipseg < migrations\adicionar-tipo-api-whatsapp.sql
if %errorlevel% neq 0 (
    echo ERRO ao executar migration 1
    pause
    exit /b 1
)
echo OK - Coluna adicionada!
echo.

:: Executar migration 2
echo [2/2] Criando tabela whatsapp_oficial_config...
"%MYSQL_PATH%" -u root crm_vipseg < migrations\criar-tabela-whatsapp-oficial-config.sql
if %errorlevel% neq 0 (
    echo ERRO ao executar migration 2
    pause
    exit /b 1
)
echo OK - Tabela criada!
echo.

echo ========================================
echo Migration concluida com sucesso!
echo ========================================
echo.
echo Agora reinicie o backend e recarregue a pagina
echo.
pause
