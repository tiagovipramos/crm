@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ============================================
:: AGENTE AUTÔNOMO DEVOPS FULLSTACK
:: ============================================
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     AGENTE AUTÔNOMO DEVOPS - CRM SYSTEM                        ║
echo ║     Correção Automática e Monitoramento Contínuo               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

:: Configurações SSH
set SSH_HOST=185.217.125.72
set SSH_USER=root
set SSH_PASS=UA3485Z43hqvZ@4r
set SSH_CMD=ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null

:: Configurações de teste
set TEST_URL=http://185.217.125.72:3000/indicador/login
set TEST_USER=tiago@vipseg.org
set TEST_PASS=123456

:: Diretório remoto
set REMOTE_DIR=/crm

:: ============================================
:: FASE 1: DIAGNÓSTICO INICIAL
:: ============================================
echo [FASE 1] Iniciando diagnóstico completo do sistema...
echo.

call :log_info "Conectando ao servidor VPS..."
call :check_ssh_connection
if !ERRORLEVEL! NEQ 0 (
    call :log_error "Falha na conexão SSH"
    goto :error_exit
)

call :log_success "Conexão SSH estabelecida"

:: ============================================
:: FASE 2: ANÁLISE DE LOGS
:: ============================================
echo.
echo [FASE 2] Analisando logs do sistema...
echo.

call :analyze_logs

:: ============================================
:: FASE 3: CORREÇÕES AUTOMÁTICAS
:: ============================================
echo.
echo [FASE 3] Executando correções automáticas...
echo.

call :execute_fixes

:: ============================================
:: FASE 4: LIMPEZA DE ARQUIVOS
:: ============================================
echo.
echo [FASE 4] Limpando arquivos desnecessários...
echo.

call :cleanup_files

:: ============================================
:: FASE 5: TESTE DO SISTEMA
:: ============================================
echo.
echo [FASE 5] Testando sistema...
echo.

call :test_system

:: ============================================
:: FASE 6: COMMIT AUTOMÁTICO
:: ============================================
echo.
echo [FASE 6] Fazendo commit das alterações...
echo.

call :git_commit

:: ============================================
:: FASE 7: MONITORAMENTO CONTÍNUO
:: ============================================
echo.
echo [FASE 7] Iniciando monitoramento contínuo...
echo.

call :continuous_monitoring

goto :end

:: ============================================
:: FUNÇÕES
:: ============================================

:check_ssh_connection
call :log_info "Testando conexão SSH..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "echo 'SSH OK'" 2>nul
exit /b %ERRORLEVEL%

:analyze_logs
call :log_info "Verificando logs do Docker..."

:: Verificar se os containers estão rodando
call :log_info "Verificando containers..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose ps"

:: Logs do Backend
call :log_info "Analisando logs do Backend..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose logs --tail=100 backend" > logs_backend.txt 2>&1

:: Logs do Frontend
call :log_info "Analisando logs do Frontend..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose logs --tail=100 frontend" > logs_frontend.txt 2>&1

:: Logs do MySQL
call :log_info "Analisando logs do MySQL..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose logs --tail=100 mysql" > logs_mysql.txt 2>&1

:: Analisar erros
call :log_info "Procurando erros nos logs..."
findstr /i "error exception failed" logs_backend.txt > erros_detectados.txt 2>nul
findstr /i "error exception failed" logs_frontend.txt >> erros_detectados.txt 2>nul
findstr /i "error exception failed" logs_mysql.txt >> erros_detectados.txt 2>nul

if exist erros_detectados.txt (
    call :log_warning "Erros detectados nos logs"
    type erros_detectados.txt
) else (
    call :log_success "Nenhum erro crítico detectado"
)

exit /b 0

:execute_fixes
call :log_info "Aplicando correções automáticas..."

:: 1. Verificar e reiniciar containers se necessário
call :log_info "Verificando status dos containers..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose ps | grep -q 'Exit' && docker-compose restart || echo 'Containers OK'"

:: 2. Executar migrations pendentes
call :log_info "Executando migrations do banco de dados..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose exec -T backend node executar-migrations.js" 2>nul

:: 3. Corrigir permissões
call :log_info "Corrigindo permissões de arquivos..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && chmod -R 755 backend/uploads 2>/dev/null; chmod -R 755 backend/auth_* 2>/dev/null; echo 'Permissões corrigidas'"

:: 4. Limpar cache do Docker
call :log_info "Limpando cache do Docker..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "docker system prune -f" >nul 2>&1

:: 5. Verificar e corrigir CORS
call :log_info "Verificando configurações de CORS..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && grep -r 'cors' backend/src/index.ts 2>/dev/null | grep -q 'origin' && echo 'CORS OK' || echo 'CORS precisa ser configurado'"

:: 6. Verificar variáveis de ambiente
call :log_info "Verificando variáveis de ambiente..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && [ -f .env ] && echo 'ENV OK' || cp .env.example .env"

:: 7. Rebuild se necessário
for /f %%i in ('findstr /i "fatal critical" erros_detectados.txt 2^>nul') do (
    call :log_warning "Erros críticos detectados, fazendo rebuild..."
    %SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose down && docker-compose up -d --build"
    timeout /t 30 >nul
)

call :log_success "Correções aplicadas"
exit /b 0

:cleanup_files
call :log_info "Iniciando limpeza de arquivos desnecessários..."

:: Lista de arquivos/diretórios para limpar
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && rm -rf node_modules/.cache 2>/dev/null"
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && rm -rf .next/cache 2>/dev/null"
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && rm -rf backend/node_modules/.cache 2>/dev/null"
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && find . -name '*.log' -type f -mtime +7 -delete 2>/dev/null"
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && find . -name '.DS_Store' -delete 2>/dev/null"
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker system prune -f --volumes 2>/dev/null"

call :log_success "Limpeza concluída"
exit /b 0

:test_system
call :log_info "Testando sistema de login..."

:: Testar se o frontend está respondendo
curl -s -o nul -w "%%{http_code}" http://185.217.125.72:3000 > http_status.txt
set /p HTTP_STATUS=<http_status.txt

if "!HTTP_STATUS!"=="200" (
    call :log_success "Frontend está respondendo (HTTP !HTTP_STATUS!)"
) else (
    call :log_error "Frontend não está respondendo (HTTP !HTTP_STATUS!)"
)

:: Testar se o backend está respondendo
curl -s -o nul -w "%%{http_code}" http://185.217.125.72:3001/api/health > http_status_backend.txt
set /p HTTP_STATUS_BACKEND=<http_status_backend.txt

if "!HTTP_STATUS_BACKEND!"=="200" (
    call :log_success "Backend está respondendo (HTTP !HTTP_STATUS_BACKEND!)"
) else (
    call :log_warning "Backend pode estar com problemas (HTTP !HTTP_STATUS_BACKEND!)"
)

:: Testar login via API
call :log_info "Testando login na API..."
curl -X POST http://185.217.125.72:3001/api/indicador/login ^
    -H "Content-Type: application/json" ^
    -d "{\"email\":\"%TEST_USER%\",\"password\":\"%TEST_PASS%\"}" ^
    -s -o login_response.txt -w "%%{http_code}" > login_status.txt

set /p LOGIN_STATUS=<login_status.txt

if "!LOGIN_STATUS!"=="200" (
    call :log_success "Login funcionando corretamente!"
    type login_response.txt
) else (
    call :log_error "Falha no login (HTTP !LOGIN_STATUS!)"
    type login_response.txt
)

:: Verificar logs em tempo real após teste
call :log_info "Verificando logs após teste..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose logs --tail=50 backend | grep -i 'login\|error\|auth'"

exit /b 0

:git_commit
call :log_info "Preparando commit das alterações..."

:: Verificar se há alterações
git status --porcelain > git_changes.txt
set /p GIT_CHANGES=<git_changes.txt

if "!GIT_CHANGES!"=="" (
    call :log_info "Nenhuma alteração para commitar"
    exit /b 0
)

:: Adicionar todas as alterações
call :log_info "Adicionando alterações..."
git add -A

:: Criar mensagem de commit automática com timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (set mytime=%%a%%b)
set COMMIT_MSG=Auto-fix: Correções automáticas do sistema - %mydate% %mytime%

:: Fazer commit
call :log_info "Fazendo commit: !COMMIT_MSG!"
git commit -m "!COMMIT_MSG!"

:: Push para o repositório
call :log_info "Enviando para o GitHub..."
git push origin main 2>&1

if !ERRORLEVEL! EQU 0 (
    call :log_success "Commit enviado com sucesso"
) else (
    call :log_warning "Falha ao enviar commit (pode precisar de autenticação)"
)

exit /b 0

:continuous_monitoring
call :log_info "Iniciando monitoramento contínuo (Ctrl+C para parar)..."

set /a CYCLE=0

:monitoring_loop
set /a CYCLE+=1
echo.
echo ═══════════════════════════════════════════════════════════════
echo   CICLO DE MONITORAMENTO #!CYCLE! - %date% %time%
echo ═══════════════════════════════════════════════════════════════
echo.

:: Verificar status dos containers
call :log_info "Verificando status dos containers..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose ps"

:: Verificar logs recentes
call :log_info "Verificando logs recentes..."
%SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose logs --tail=20 --since=5m backend" | findstr /i "error exception" >nul
if !ERRORLEVEL! EQU 0 (
    call :log_warning "Novos erros detectados, aplicando correções..."
    call :execute_fixes
    call :test_system
)

:: Testar sistema
call :log_info "Testando disponibilidade..."
curl -s -o nul -w "%%{http_code}" http://185.217.125.72:3000 > http_check.txt
set /p HTTP_CHECK=<http_check.txt

if "!HTTP_CHECK!" NEQ "200" (
    call :log_error "Sistema não está respondendo! Reiniciando containers..."
    %SSH_CMD% %SSH_USER%@%SSH_HOST% "cd %REMOTE_DIR% && docker-compose restart"
    timeout /t 30 >nul
    call :test_system
)

call :log_success "Sistema operacional - Ciclo !CYCLE! completo"

:: Aguardar 5 minutos antes do próximo ciclo
echo.
echo Aguardando 5 minutos até próximo ciclo...
timeout /t 300 >nul

goto :monitoring_loop

:: ============================================
:: FUNÇÕES DE LOG
:: ============================================

:log_info
echo [INFO] %date% %time% - %~1
exit /b 0

:log_success
echo [OK] %date% %time% - %~1
exit /b 0

:log_warning
echo [AVISO] %date% %time% - %~1
exit /b 0

:log_error
echo [ERRO] %date% %time% - %~1
exit /b 0

:error_exit
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  ERRO CRÍTICO - Execução interrompida                          ║
echo ╚════════════════════════════════════════════════════════════════╝
pause
exit /b 1

:end
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  AGENTE AUTÔNOMO FINALIZADO                                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Logs salvos em:
echo - logs_backend.txt
echo - logs_frontend.txt
echo - logs_mysql.txt
echo - erros_detectados.txt
echo.
pause
exit /b 0
