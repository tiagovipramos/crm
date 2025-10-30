@echo off
echo ========================================
echo ATUALIZANDO SENHA DO CARLOS NO BANCO
echo ========================================
echo.

set HASH=$2b$10$AleGEAqjEKHvNQN/3MkSPOyJlM0XoFpII1KHKr.ecmTlmD2EH85z6

echo Conectando ao servidor via plink...
echo.

plink -batch -ssh root@185.217.125.72 -pw UA3485Z43hqvZ@4r "cd /root/crm && docker-compose exec -T db mysql -u root -prootpassword crm -e \"UPDATE usuarios SET senha = '%HASH%', ativo = 1 WHERE email = 'carlos@protecar.com'; SELECT id, nome, email, tipo, ativo FROM usuarios WHERE email = 'carlos@protecar.com';\""

echo.
echo ========================================
echo COMANDO EXECUTADO!
echo ========================================
echo.
pause
