@echo off
chcp 65001 >nul
echo ========================================
echo VERIFICAR TRIGGERS DE COMISSÃO
echo ========================================
echo.
echo Este script verifica se os triggers estão instalados
echo.

node verificar-triggers-comissao.js

echo.
pause
