@echo off
chcp 65001 > nul
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║  MIGRAÇÃO DE LEADS SEM WHATSAPP                                   ║
echo ║  Este script vai mover leads sem WhatsApp para a coluna correta  ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo ⚠️  ATENÇÃO: Este script irá:
echo.
echo    1. Buscar TODOS os leads com origem "Indicação"
echo    2. Validar se cada lead TEM WhatsApp ativo
echo    3. Mover os leads SEM WhatsApp para coluna "Sem WhatsApp"
echo    4. Manter os leads COM WhatsApp na coluna "Indicação"
echo.
echo 📋 Requisitos:
echo    - WhatsApp deve estar CONECTADO no CRM
echo    - Banco de dados deve estar acessível
echo.

pause

echo.
echo 🚀 Iniciando migração...
echo.

cd /d "%~dp0"

node migrar-leads-sem-whatsapp.js

echo.
echo ═══════════════════════════════════════════════════════════════════
echo.

if %ERRORLEVEL% EQU 0 (
    echo ✅ Migração concluída com SUCESSO!
) else (
    echo ❌ Erro durante a migração. Verifique as mensagens acima.
)

echo.
pause
