@echo off
echo Executando migration...
cd /d %~dp0
C:\xampp3\mysql\bin\mysql.exe -u root protecar_crm < migrations\adicionar-coluna-sistema-online.sql
if %errorlevel% equ 0 (
    echo Migration executada com sucesso!
) else (
    echo Erro ao executar migration!
)
pause
