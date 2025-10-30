#!/bin/bash

# Script para visualizar logs dos containers Docker
# Autor: Sistema CRM
# Data: 2025-01-30

echo "📋 === LOGS DOS CONTAINERS DOCKER ==="
echo ""
echo "Escolha qual log visualizar:"
echo ""
echo "1) Backend (crm-backend)"
echo "2) Frontend (crm-frontend)"
echo "3) MySQL (crm-mysql)"
echo "4) Todos os serviços"
echo "5) Backend - Tempo real (seguir log)"
echo "6) Frontend - Tempo real (seguir log)"
echo ""
read -p "Digite o número (1-6): " opcao

case $opcao in
  1)
    echo ""
    echo "📋 === LOGS DO BACKEND (últimas 50 linhas) ==="
    echo ""
    docker logs crm-backend --tail 50
    ;;
  2)
    echo ""
    echo "📋 === LOGS DO FRONTEND (últimas 50 linhas) ==="
    echo ""
    docker logs crm-frontend --tail 50
    ;;
  3)
    echo ""
    echo "📋 === LOGS DO MYSQL (últimas 50 linhas) ==="
    echo ""
    docker logs crm-mysql --tail 50
    ;;
  4)
    echo ""
    echo "📋 === LOGS DO BACKEND ==="
    docker logs crm-backend --tail 30
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 === LOGS DO FRONTEND ==="
    docker logs crm-frontend --tail 30
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 === LOGS DO MYSQL ==="
    docker logs crm-mysql --tail 20
    ;;
  5)
    echo ""
    echo "📋 === LOGS DO BACKEND - TEMPO REAL ==="
    echo "   (Pressione Ctrl+C para sair)"
    echo ""
    docker logs crm-backend -f
    ;;
  6)
    echo ""
    echo "📋 === LOGS DO FRONTEND - TEMPO REAL ==="
    echo "   (Pressione Ctrl+C para sair)"
    echo ""
    docker logs crm-frontend -f
    ;;
  *)
    echo "❌ Opção inválida!"
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Comandos úteis:"
echo "   docker ps                    # Ver status dos containers"
echo "   docker restart crm-backend   # Reiniciar backend"
echo "   docker restart crm-frontend  # Reiniciar frontend"
echo "   docker logs crm-backend -f   # Seguir logs em tempo real"
echo ""
