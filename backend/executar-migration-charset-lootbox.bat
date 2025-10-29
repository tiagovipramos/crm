@echo off
chcp 65001 > nul
echo ========================================
echo CORRIGINDO CHARSET DA TABELA LOOTBOX
echo ========================================
echo.

REM Carregar variáveis de ambiente
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        set %%a=%%b
    )
)

REM Usar valores padrão se não estiverem no .env
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=3306
if "%DB_USER%"=="" set DB_USER=root
if "%DB_PASSWORD%"=="" set DB_PASSWORD=
if "%DB_NAME%"=="" set DB_NAME=crm

echo Configuração:
echo - Host: %DB_HOST%
echo - Porta: %DB_PORT%
echo - Usuário: %DB_USER%
echo - Database: %DB_NAME%
echo.

echo Executando migration para corrigir charset...
echo.

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < migrations/corrigir-charset-lootbox.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✓ CHARSET CORRIGIDO COM SUCESSO!
    echo ========================================
    echo.
    echo Os emojis agora serão exibidos corretamente!
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ ERRO AO EXECUTAR MIGRATION
    echo ========================================
    echo.
    echo Verifique os logs acima para mais detalhes.
    echo.
)

pause
