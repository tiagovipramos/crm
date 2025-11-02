@echo off
echo ========================================
echo CORRIGINDO USUARIO ADMIN
echo ========================================
echo.

cd backend
node check-admin.js

echo.
echo ========================================
echo CONCLUIDO!
echo ========================================
pause
