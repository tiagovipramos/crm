@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ============================================
:: SCRIPT PARA EXECUTAR CORREÇÃO COMPLETA
:: ============================================
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     CORREÇÃO COMPLETA DO SISTEMA CRM                           ║
echo ║     Envia correções e executa no servidor                      ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set SSH_HOST=185.217.125.72
set SSH_USER=root

echo [FASE 1] Fazendo commit das alterações locais...
git add -A
git commit -m "Fix: Correção completa - Socket.IO + Database + Migrations"
git push origin main

echo.
echo [FASE 2] As alterações foram enviadas para o GitHub!
echo.
echo Agora você precisa executar no servidor:
echo.
echo   1. Conecte via SSH: ssh root@185.217.125.72
echo   2. Entre no diretório do projeto: cd /root/crm (ou onde está o projeto)
echo   3. Baixe as alterações: git pull origin main
echo   4. Execute o script: bash fix-everything-vps.sh
echo.
echo OU execute este comando único:
echo.
echo ssh root@185.217.125.72 "cd /root/crm ^&^& git pull origin main ^&^& bash fix-everything-vps.sh"
echo.
echo.
echo Pressione qualquer tecla para tentar executar automaticamente via SSH...
pause >nul

echo.
echo [FASE 3] Tentando executar via SSH...
echo.

ssh %SSH_USER%@%SSH_HOST% "cd /root/crm && git pull origin main && bash fix-everything-vps.sh"

if !ERRORLEVEL! EQU 0 (
    echo.
    echo ✅ Correções executadas com sucesso!
    echo.
    echo [FASE 4] Testando o sistema...
    echo.
    
    timeout /t 5 >nul
    
    echo Testando Frontend...
    curl -s -o nul -w "HTTP %%{http_code}" http://185.217.125.72:3000
    echo.
    
    echo Testando Backend...
    curl -s -o nul -w "HTTP %%{http_code}" http://185.217.125.72:3001/api/health
    echo.
    
    echo.
    echo Abrindo sistema no browser para teste final...
    start "" "http://185.217.125.72:3000/indicador/login"
    
) else (
    echo.
    echo ⚠️ Erro ao executar correções via SSH.
    echo Por favor, execute manualmente no servidor.
)

echo.
pause
