@echo off
echo ============================================
echo    PROTECAR CRM - PARANDO PROJETO
echo ============================================
echo.

echo [1/3] Parando processos Node.js (Frontend e Backend)...
taskkill /F /IM node.exe >nul 2>&1
if "%ERRORLEVEL%"=="0" (
    echo    Processos Node.js finalizados
) else (
    echo    Nenhum processo Node.js rodando
)

echo.
echo [2/3] Verificando MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo    MySQL ainda esta rodando
    echo    Deseja parar o MySQL? (S/N)
    choice /C SN /N
    if errorlevel 2 (
        echo    MySQL mantido em execucao
    ) else (
        echo    Parando MySQL...
        taskkill /F /IM mysqld.exe >nul 2>&1
        echo    MySQL finalizado
    )
) else (
    echo    MySQL nao esta rodando
)

echo.
echo ============================================
echo    PROJETO PARADO!
echo ============================================
echo.
pause
