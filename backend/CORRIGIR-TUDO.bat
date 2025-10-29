@echo off
chcp 65001 >nul
echo ================================================
echo CORREÇÃO COMPLETA - SALDOS E STATUS
echo ================================================
echo.
echo Este script vai:
echo 1. Corrigir vendas fantasma (converteu mas não está convertido)
echo 2. Corrigir cotações fantasma (respondeu mas não está em proposta_enviada)
echo 3. Recalcular todos os saldos
echo 4. Atualizar o banco de dados
echo.
pause
echo.

node corrigir-tudo.js

echo.
pause
