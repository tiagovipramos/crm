@echo off
echo ================================================
echo CORRIGIR VENDAS FANTASMA
echo ================================================
echo.
echo Este script vai:
echo 1. Encontrar indicacoes marcadas como "converteu"
echo 2. Verificar se os leads realmente estao convertidos
echo 3. Corrigir o status das indicacoes
echo 4. Recalcular os saldos
echo.
pause
echo.

node corrigir-vendas-fantasma.js

echo.
echo ================================================
echo Pressione qualquer tecla para sair...
pause >nul
