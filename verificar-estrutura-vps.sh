#!/bin/bash
# Script para verificar estrutura do servidor

echo "============================================"
echo "VERIFICANDO ESTRUTURA DO SERVIDOR VPS"
echo "============================================"
echo ""

echo "[1] Verificando diretório atual..."
pwd

echo ""
echo "[2] Procurando pelo projeto CRM..."
find /root -name "docker-compose.yml" -type f 2>/dev/null | head -5
find /home -name "docker-compose.yml" -type f 2>/dev/null | head -5
find /opt -name "docker-compose.yml" -type f 2>/dev/null | head -5
find /var -name "docker-compose.yml" -type f 2>/dev/null | head -5

echo ""
echo "[3] Verificando containers Docker em execução..."
docker ps -a

echo ""
echo "[4] Verificando docker-compose instalado..."
which docker-compose
docker-compose --version

echo ""
echo "[5] Listando diretórios no /root..."
ls -la /root/ | grep -v "^\."

echo ""
echo "============================================"
echo "VERIFICAÇÃO CONCLUÍDA"
echo "============================================"
