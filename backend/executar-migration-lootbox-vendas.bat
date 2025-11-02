@echo off
echo ===================================
echo Executando Migration - Loot Box Vendas
echo ===================================
echo.

cd backend

echo Executando adicionar-lootbox-vendas.sql...
C:\xampp3\mysql\bin\mysql.exe -u root protecar_crm < migrations/adicionar-lootbox-vendas.sql

if %errorlevel% equ 0 (
    echo.
    echo ===================================
    echo Migration executada com sucesso!
    echo ===================================
    echo.
    echo Colunas adicionadas em indicadores:
    echo - vendas_para_proxima_caixa
    echo - total_caixas_vendas_abertas
    echo - total_ganho_caixas_vendas
    echo ===================================
) else (
    echo.
    echo ===================================
    echo ERRO ao executar migration!
    echo ===================================
)

pause
