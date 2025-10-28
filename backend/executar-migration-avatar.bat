@echo off
echo Executando migration: Adicionar coluna avatar em indicadores...
c:\xampp3\mysql\bin\mysql.exe -u root protecar_crm < migrations/adicionar-coluna-avatar-indicadores.sql
if %errorlevel% equ 0 (
    echo Migration executada com sucesso!
) else (
    echo Erro ao executar migration.
)
pause
