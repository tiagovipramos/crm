@echo off
chcp 65001 >nul
echo ========================================
echo EXECUTAR MIGRATION - TRIGGERS DE COMISSÃO INSTANTÂNEA
echo ========================================
echo.
echo Esta migration atualiza os triggers para:
echo 1. Quando o vendedor mover para "Cotação Enviada" (proposta_enviada)
echo    - Saldo sai de BLOQUEADO para DISPONÍVEL instantaneamente
echo.
echo 2. Quando o vendedor mover para "Não Solicitado" (nao_solicitado)
echo    - Saldo vai direto para PERDIDO
echo.
echo 3. Quando o vendedor mover para "Convertido" (convertido)
echo    - Adiciona comissão de venda (R$ 20,00) ao saldo disponível
echo ========================================
echo.

REM Carregar variáveis de ambiente
if exist .env (
    echo [INFO] Carregando configurações do .env...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="DB_HOST" set DB_HOST=%%b
        if "%%a"=="DB_USER" set DB_USER=%%b
        if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
        if "%%a"=="DB_NAME" set DB_NAME=%%b
        if "%%a"=="DB_PORT" set DB_PORT=%%b
    )
) else (
    echo [ERRO] Arquivo .env não encontrado!
    pause
    exit /b 1
)

echo [INFO] Configurações carregadas:
echo   - Host: %DB_HOST%
echo   - Database: %DB_NAME%
echo   - User: %DB_USER%
echo   - Port: %DB_PORT%
echo.

REM Verificar se o MySQL está disponível
echo [INFO] Verificando conexão com o banco de dados...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% -e "SELECT 1;" 2>nul
if errorlevel 1 (
    echo [ERRO] Não foi possível conectar ao banco de dados!
    echo [ERRO] Verifique se o MySQL está rodando e as credenciais estão corretas.
    pause
    exit /b 1
)
echo [OK] Conexão estabelecida com sucesso!
echo.

echo ========================================
echo EXECUTANDO MIGRATION...
echo ========================================
echo.

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < migrations/atualizar-triggers-indicacao-instantaneo.sql

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao executar a migration!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ MIGRATION EXECUTADA COM SUCESSO!
echo ========================================
echo.
echo Os triggers foram atualizados:
echo   ✓ trigger_comissao_proposta_enviada
echo   ✓ trigger_comissao_conversao
echo   ✓ trigger_lead_nao_solicitado
echo   ✓ trigger_lead_perdido
echo   ✓ trigger_lead_engano
echo.
echo Agora quando o vendedor mover um lead:
echo   → Para "Cotação Enviada": Saldo fica disponível instantaneamente
echo   → Para "Não Solicitado": Saldo vai para perdido
echo   → Para "Convertido": Adiciona R$ 20,00 de comissão de venda
echo.
pause
