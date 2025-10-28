#!/bin/bash

echo "============================================"
echo "   PROTECAR CRM - INICIANDO PROJETO"
echo "============================================"
echo ""

# Verificar se o MySQL está rodando
echo "[1/5] Verificando MySQL..."
if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld; then
    echo "   MySQL já está rodando"
else
    echo "   Iniciando MySQL..."
    sudo systemctl start mysql || sudo systemctl start mysqld
    sleep 3
fi

echo ""
echo "[2/5] Verificando banco de dados..."
cd "$(dirname "$0")/backend"
node dev-scripts/adicionar-coluna-whatsapp-id.js > /dev/null 2>&1 || true
node dev-scripts/preencher-ids-mensagens-antigas.js > /dev/null 2>&1 || true
node dev-scripts/limpar-mensagens-duplicadas.js > /dev/null 2>&1 || true
echo "   Banco otimizado"
cd "$(dirname "$0")"

echo ""
echo "[3/5] Iniciando Backend na porta 3001..."
cd backend
gnome-terminal --tab --title="Backend - Protecar CRM" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -T "Backend - Protecar CRM" -e "npm run dev" 2>/dev/null || \
konsole --new-tab -e bash -c "npm run dev; exec bash" 2>/dev/null || \
(npm run dev &)
cd ..

# Aguardar o backend iniciar
sleep 5

echo ""
echo "[4/5] Iniciando Frontend na porta 3000..."
gnome-terminal --tab --title="Frontend - Protecar CRM" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -T "Frontend - Protecar CRM" -e "npm run dev" 2>/dev/null || \
konsole --new-tab -e bash -c "npm run dev; exec bash" 2>/dev/null || \
(npm run dev &)

echo ""
echo "[5/5] Finalizando..."
sleep 2

echo ""
echo "============================================"
echo "   PROJETO INICIADO COM SUCESSO!"
echo "============================================"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "=== MÓDULOS DISPONÍVEIS ==="
echo "CRM Vendedores:   http://localhost:3000/crm"
echo "Painel Indicador: http://localhost:3000/indicador/login"
echo "Painel Admin:     http://localhost:3000/admin/login"
echo ""
echo "Aguarde alguns segundos para tudo iniciar..."
echo "Pressione Ctrl+C para fechar esta janela."
echo ""

# Manter o script aberto
read -p "Pressione Enter para fechar..."
