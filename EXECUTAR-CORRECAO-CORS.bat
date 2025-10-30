@echo off
echo ==========================================
echo EXECUTAR CORRECAO CORS NO VPS
echo ==========================================
echo.
echo Este script vai:
echo 1. Copiar o script de correcao para o VPS
echo 2. Dar permissao de execucao
echo 3. Executar a correcao automatica
echo.
pause

echo.
echo [1/3] Copiando script para o VPS...
scp fix-cors-indicador-vps.sh root@185.217.125.72:/root/crm/

echo.
echo [2/3] Dando permissao de execucao...
ssh root@185.217.125.72 "cd /root/crm && chmod +x fix-cors-indicador-vps.sh"

echo.
echo [3/3] Executando correcao automatica...
ssh root@185.217.125.72 "cd /root/crm && ./fix-cors-indicador-vps.sh"

echo.
echo ==========================================
echo CORRECAO CONCLUIDA!
echo ==========================================
echo.
echo Teste o login do indicador em:
echo http://185.217.125.72:3000/indicador
echo.
pause
