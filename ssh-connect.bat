@echo off
echo ====================================
echo CONECTANDO AO SERVIDOR VPS
echo ====================================
echo.

plink -ssh root@185.217.125.72 -pw "UA3485Z43hqvZ@4r" %*
