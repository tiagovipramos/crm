@echo off
echo =========================================
echo EXECUTANDO TRIGGERS DE REVERSAO
echo =========================================
echo.
echo Esta migration adiciona triggers que permitem
echo corrigir quando um lead foi marcado incorretamente.
echo.
echo Exemplos de correcao:
echo - "Nao Solicitado" -^> "Cotacao Enviada"
echo - "Engano" -^> "Convertido"
echo.
pause

cd backend

echo Executando migration de triggers de reversao...
mysql -u root crm_desenvolvimento < migrations/adicionar-triggers-reversao.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================
    echo SUCESSO! Triggers de reversao criados!
    echo =========================================
    echo.
    echo Agora voce pode corrigir leads marcados
    echo incorretamente no kanban!
    echo.
) else (
    echo.
    echo =========================================
    echo ERRO ao executar migration!
    echo =========================================
    echo.
)

pause
