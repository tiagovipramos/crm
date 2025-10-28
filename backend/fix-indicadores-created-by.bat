@echo off
echo ==========================================
echo Adicionando coluna created_by em indicadores
echo ==========================================
echo.

cd /d "%~dp0"

echo Executando migration...
C:\xampp3\mysql\bin\mysql.exe -u root protecar_crm < migrations/adicionar-coluna-created-by-indicadores.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo Migration executada com sucesso!
    echo ==========================================
) else (
    echo.
    echo ==========================================
    echo ERRO ao executar migration!
    echo ==========================================
)

echo.
pause
