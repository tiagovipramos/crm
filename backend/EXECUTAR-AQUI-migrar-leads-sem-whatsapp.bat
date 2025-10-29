@echo off
chcp 65001 > nul
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║  MIGRAÇÃO SIMPLES - LEADS SEM WHATSAPP                            ║
echo ║  Busca apenas no banco de dados (sem validar WhatsApp)            ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.
echo ℹ️  Este script irá:
echo.
echo    1. Buscar leads com origem "Indicação" 
echo    2. Verificar no banco quais NÃO têm WhatsApp validado
echo    3. Mover esses leads para coluna "Sem WhatsApp"
echo.
echo ✅ NÃO PRECISA do WhatsApp conectado!
echo ✅ Consulta APENAS o banco de dados!
echo.

pause

echo.
echo 🚀 Iniciando migração...
echo.

cd /d "%~dp0"

node migrar-leads-sem-whatsapp-simples.js

echo.
echo ═══════════════════════════════════════════════════════════════════
echo.

if %ERRORLEVEL% EQU 0 (
    echo ✅ Migração concluída com SUCESSO!
    echo.
    echo 📋 Próximos passos:
    echo    1. Atualize o navegador (F5)
    echo    2. Vá para o Funil de Vendas
    echo    3. Verifique a coluna "Sem WhatsApp" (laranja)
) else (
    echo ❌ Erro durante a migração. Verifique as mensagens acima.
)

echo.
pause
