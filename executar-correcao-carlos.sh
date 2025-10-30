#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "🔧 CORRIGINDO LOGIN DO CARLOS NO SERVIDOR VPS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Hash bcrypt da senha "123456"
HASH='$2b$10$NTviDX5.40LC.qBOmdCAzeAnT1bV2ugxUPsuPTPQBDHrmAk4LWYsi'

echo "📋 ETAPA 1: Atualizando senha no banco de dados..."
docker-compose exec -T db mysql -u root -prootpassword crm -e "UPDATE usuarios SET senha = '$HASH', ativo = 1 WHERE email = 'carlos@protecar.com';"

echo ""
echo "📋 ETAPA 2: Verificando atualização..."
docker-compose exec -T db mysql -u root -prootpassword crm -e "SELECT id, nome, email, tipo, ativo, SUBSTRING(senha, 1, 30) as senha_hash FROM usuarios WHERE email = 'carlos@protecar.com';"

echo ""
echo "📋 ETAPA 3: Verificando na tabela consultores..."
docker-compose exec -T db mysql -u root -prootpassword crm -e "SELECT id, nome, email, usuario_id, ativo FROM consultores WHERE email = 'carlos@protecar.com';"

echo ""
echo "📋 ETAPA 4: Testando login via API..."
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@protecar.com","password":"123456"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Próximo passo: Testar no navegador"
echo "🌐 URL: http://185.217.125.72:3000/"
echo "📧 Email: carlos@protecar.com"
echo "🔑 Senha: 123456"
