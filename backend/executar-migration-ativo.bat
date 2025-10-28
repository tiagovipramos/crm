@echo off
echo Executando migration para adicionar coluna ativo...
cd /d "%~dp0"
C:\xampp3\mysql\bin\mysql.exe -u root protecar_crm < migrations\adicionar-coluna-ativo-consultores.sql
echo Migration concluida!
pause
