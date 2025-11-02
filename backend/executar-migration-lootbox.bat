@echo off
echo ===================================
echo Executando Migration - Loot Box
echo ===================================
echo.

cd backend

echo Executando schema-lootbox.sql...
C:\xampp3\mysql\bin\mysql.exe -u root protecar_crm < migrations/schema-lootbox.sql

if %errorlevel% equ 0 (
    echo.
    echo ===================================
    echo Migration executada com sucesso!
    echo ===================================
    echo.
    echo Sistema de Loot Box criado:
    echo - Tabela lootbox_historico
    echo - Tabela lootbox_premios
    echo - Colunas adicionadas em indicadores
    echo - Premios padrao configurados
    echo ===================================
) else (
    echo.
    echo ===================================
    echo ERRO ao executar migration!
    echo ===================================
)

pause
