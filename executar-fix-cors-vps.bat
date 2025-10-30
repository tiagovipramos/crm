@echo off
echo ==========================================
echo CORRIGIR ERRO CORS - COMANDO UNICO
echo ==========================================
echo.
echo Executando correcao automatica no VPS...
echo.

ssh root@185.217.125.72 "cd /root/crm && git pull origin main && chmod +x fix-cors-indicador-vps.sh && ./fix-cors-indicador-vps.sh"

echo.
echo ==========================================
echo PROCESSO CONCLUIDO!
echo ==========================================
echo.
echo Agora teste o login em:
echo http://185.217.125.72:3000/indicador
echo.
pause
