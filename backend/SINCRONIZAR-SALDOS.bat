@echo off
echo ================================================
echo SINCRONIZACAO FORCADA DE SALDOS
echo ================================================
echo.
echo ATENCAO: Este script ira FORCAR a atualizacao
echo de TODOS os saldos dos indicadores baseado no
echo status atual das indicacoes.
echo.
echo Isso pode CORRIGIR saldos desatualizados.
echo.
pause
echo.
echo Executando sincronizacao...
echo.

node sincronizar-saldos-indicador.js

echo.
echo ================================================
echo Pressione qualquer tecla para sair...
pause >nul
