#!/bin/bash

# Script de Instalação Automatizada do Protecar CRM na VPS
# Execute este script após conectar na VPS via SSH

set -e  # Parar em caso de erro

echo "============================================"
echo "   PROTECAR CRM - INSTALAÇÃO VPS"
echo "============================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    log_error "Execute este script como root: sudo ./install-vps.sh"
    exit 1
fi

# 1. Atualizar sistema
log_info "Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependências básicas
log_info "Instalando dependências básicas..."
apt install -y curl wget git nano

# 3. Instalar Node.js 18.x
log_info "Instalando Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalação
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_info "Node.js instalado: $NODE_VERSION"
log_info "npm instalado: $NPM_VERSION"

# 4. Instalar MySQL
log_info "Instalando MySQL Server..."
export DEBIAN_FRONTEND=noninteractive
apt install -y mysql-server

# Iniciar e habilitar MySQL
systemctl start mysql
systemctl enable mysql
log_info "MySQL Server instalado e iniciado"

# 5. Configurar senha root do MySQL
log_warn "Configurando senha root do MySQL..."
read -sp "Digite a senha desejada para o root do MySQL: " MYSQL_ROOT_PASS
echo ""

mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASS';"
mysql -e "FLUSH PRIVILEGES;"
log_info "Senha root do MySQL configurada"

# 6. Criar banco de dados e usuário
log_info "Criando banco de dados e usuário..."
read -p "Digite o nome de usuário MySQL para o CRM [crmuser]: " DB_USER
DB_USER=${DB_USER:-crmuser}

read -sp "Digite a senha para o usuário $DB_USER: " DB_PASS
echo ""

mysql -u root -p"$MYSQL_ROOT_PASS" <<EOF
CREATE DATABASE IF NOT EXISTS protecar_crm;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON protecar_crm.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
log_info "Banco de dados 'protecar_crm' criado"

# 7. Clonar repositório
log_info "Clonando repositório..."
cd /var/www || mkdir -p /var/www && cd /var/www

if [ -d "crm" ]; then
    log_warn "Diretório 'crm' já existe. Atualizando..."
    cd crm
    git pull
else
    git clone https://github.com/tiagovipramos/crm.git
    cd crm
fi

# 8. Instalar dependências do projeto
log_info "Instalando dependências do frontend..."
npm install

log_info "Instalando dependências do backend..."
cd backend
npm install

# 9. Configurar .env
log_info "Configurando arquivo .env..."
read -p "Digite a URL do frontend (ex: http://seu-dominio.com) [http://localhost:3000]: " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}

read -p "Digite uma chave secreta JWT (mínimo 32 caracteres): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    log_warn "Chave JWT gerada automaticamente: $JWT_SECRET"
fi

cat > .env <<EOF
# Configuração do Servidor
PORT=3001
NODE_ENV=production

# Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=protecar_crm
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Frontend URL (para CORS)
FRONTEND_URL=$FRONTEND_URL
EOF

log_info "Arquivo .env criado"

# 10. Executar migrations
log_info "Executando migrations do banco de dados..."
chmod +x *.sh

mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/schema-mysql.sql 2>/dev/null || log_warn "schema-mysql.sql já executado"
mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/schema-indicadores-mysql.sql 2>/dev/null || log_warn "schema-indicadores-mysql.sql já executado"
mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/schema-campanhas.sql 2>/dev/null || log_warn "schema-campanhas.sql já executado"
mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/schema-followup.sql 2>/dev/null || log_warn "schema-followup.sql já executado"
mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/schema-lootbox.sql 2>/dev/null || log_warn "schema-lootbox.sql já executado"
mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/adicionar-coluna-ativo-consultores.sql 2>/dev/null || log_warn "Migration ativo já executada"
mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/adicionar-coluna-avatar-indicadores.sql 2>/dev/null || log_warn "Migration avatar já executada"
mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/adicionar-lootbox-vendas.sql 2>/dev/null || log_warn "Migration lootbox-vendas já executada"
mysql -u "$DB_USER" -p"$DB_PASS" protecar_crm < migrations/adicionar-coluna-sistema-online.sql 2>/dev/null || log_warn "Migration sistema-online já executada"

log_info "Migrations executadas"

# 11. Criar pasta uploads
log_info "Criando pasta de uploads..."
mkdir -p uploads
chmod 755 uploads
log_info "Pasta uploads criada"

# 12. Instalar PM2
log_info "Instalando PM2 (gerenciador de processos)..."
npm install -g pm2

# 13. Build do projeto
log_info "Compilando backend..."
npm run build

cd ..
log_info "Compilando frontend..."
npm run build

# 14. Criar configuração PM2
log_info "Criando configuração PM2..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      cwd: './backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true
    },
    {
      name: 'crm-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      time: true
    }
  ]
};
EOF

# Criar pasta de logs
mkdir -p logs

# 15. Iniciar aplicação com PM2
log_info "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd

log_info "Aplicação iniciada com sucesso!"

# 16. Instalar e configurar Nginx
log_info "Instalando Nginx..."
apt install -y nginx

read -p "Digite seu domínio ou IP (ex: meusite.com ou 154.53.38.58): " DOMAIN
DOMAIN=${DOMAIN:-_}

cat > /etc/nginx/sites-available/crm <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads {
        proxy_pass http://localhost:3001/uploads;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
systemctl enable nginx

log_info "Nginx configurado e iniciado"

# 17. Configurar firewall
log_info "Configurando firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
echo "y" | ufw enable

log_info "Firewall configurado"

# 18. Mostrar informações finais
echo ""
echo "============================================"
echo "   INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "============================================"
echo ""
echo "🌐 Acesse o sistema em: http://$DOMAIN"
echo ""
echo "📊 Status da aplicação:"
pm2 status
echo ""
echo "📝 Comandos úteis:"
echo "  - Ver logs: pm2 logs"
echo "  - Reiniciar: pm2 restart all"
echo "  - Parar: pm2 stop all"
echo "  - Status: pm2 status"
echo ""
echo "🔒 Para configurar SSL (HTTPS):"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d $DOMAIN"
echo ""
echo "============================================"
