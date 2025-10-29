@echo off
echo ========================================
echo Executando Migration: Tipo API WhatsApp
echo ========================================
echo.

cd /d "%~dp0"

:: Executar migration adicionar-tipo-api-whatsapp.sql
echo [1/2] Adicionando coluna tipo_api_whatsapp...
mysql -u root crm_vipseg < migrations/adicionar-tipo-api-whatsapp.sql
if %errorlevel% neq 0 (
    echo ERRO ao executar adicionar-tipo-api-whatsapp.sql
    pause
    exit /b 1
)
echo OK - Coluna tipo_api_whatsapp adicionada!
echo.

:: Executar migration criar-tabela-whatsapp-oficial-config.sql
echo [2/2] Criando tabela whatsapp_oficial_config...
mysql -u root crm_vipseg < migrations/criar-tabela-whatsapp-oficial-config.sql
if %errorlevel% neq 0 (
    echo ERRO ao executar criar-tabela-whatsapp-oficial-config.sql
    pause
    exit /b 1
)
echo OK - Tabela whatsapp_oficial_config criada!
echo.

echo ========================================
echo Migration concluida com sucesso!
echo ========================================
echo.
echo Agora você pode escolher entre:
echo - API Oficial (WhatsApp Business API)
echo - API Não Oficial (Gratuita via QR Code)
echo.
pause
