@echo off
setlocal enabledelayedexpansion

:: ============================================
:: EXECUTOR DO AGENTE DEVOPS AUTÔNOMO
:: ============================================

echo.
echo ========================================
echo   AGENTE DEVOPS AUTONOMO - CRM SYSTEM
echo ========================================
echo.

:: Verificar se Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale Node.js de: https://nodejs.org
    pause
    exit /b 1
)

:: Verificar se o script existe
if not exist "agente-autonomo-devops.js" (
    echo [ERRO] Script agente-autonomo-devops.js nao encontrado!
    pause
    exit /b 1
)

echo [INFO] Verificando dependencias...

:: Verificar se plink está disponível (para SSH no Windows)
where plink >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] PLINK nao encontrado!
    echo O agente usara alternativas para conexao SSH.
    echo.
    echo Para melhor funcionamento, baixe PuTTY/Plink de:
    echo https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html
    echo.
    timeout /t 3 >nul
)

echo.
echo [INFO] Iniciando Agente Autonomo...
echo.

:: Executar o agente
node agente-autonomo-devops.js

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   AGENTE FINALIZADO COM SUCESSO!
    echo ========================================
    echo.
) else (
    echo.
    echo ========================================
    echo   AGENTE FINALIZADO COM ERROS
    echo ========================================
    echo.
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
