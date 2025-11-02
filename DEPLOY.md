# 🚀 Guia de Deploy - CRM Protecar em VPS Linux

Guia completo para fazer deploy do CRM Protecar em servidor VPS Linux (Ubuntu/Debian).

## 📋 Requisitos do Servidor

### Mínimo
- **CPU:** 2 vCPUs
- **RAM:** 4GB
- **Storage:** 20GB SSD
- **OS:** Ubuntu 20.04+ ou Debian 11+
- **Portas:** 80, 443, 3000, 3001, 3306 (ou usar Nginx reverse proxy)

### Recomendado para Produção
- **CPU:** 4 vCPUs
- **RAM:** 8GB
- **Storage:** 40GB SSD
- **Swap:** 2GB
- **OS:** Ubuntu 22.04 LTS

## 🛠️ Pré-requisitos

### 1. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git vim ufw
```

### 2. Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão (logout e login)
# ou executar:
newgrp docker

# Verificar instalação
docker --version
```

### 3. Instalar Docker Compose

```bash
# Instalar Docker Compose v2
sudo apt install -y docker-compose-plugin

# Verificar instalação
docker compose version
```

### 4. Configurar Firewall

```bash
# Habilitar UFW
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verificar status
sudo ufw status
```

## 📦 Deploy do Projeto

### 1. Clonar Repositório

```bash
cd /opt
sudo git clone https://github.com/seu-usuario/crm-protecar.git
sudo chown -R $USER:$USER crm-protecar
cd crm-protecar
```

### 2. Configurar Ambiente

```bash
# Copiar e configurar .env de produção
cp backend/.env.example backend/.env.production

# Editar configurações
vim backend/.env.production
```

**Configurações importantes:**

```bash
NODE_ENV=production
DB_PASSWORD=SENHA_FORTE_AQUI
JWT_SECRET=$(openssl rand -base64 64)
FRONTEND_URL=https://seu-dominio.com.br
```

### 3. Tornar Scripts Executáveis

```bash
chmod +x scripts/*.sh
```

### 4. Iniciar Sistema

```bash
# Primeira inicialização (modo produção)
./scripts/start.sh prod

# Verificar se está rodando
docker ps
```

### 5. Executar Migrations

```bash
# Aguardar MySQL iniciar (cerca de 30s)
sleep 30

# Executar migrations
./scripts/migrate.sh

# Popular com usuário admin (opcional)
./scripts/seed.sh
```

### 6. Verificar Saúde

```bash
./scripts/health-check.sh
```

## 🌐 Configurar Nginx (Reverse Proxy)

### 1. Instalar Nginx

```bash
sudo apt install -y nginx
```

### 2. Configurar Site

Criar arquivo `/etc/nginx/sites-available/crm-protecar`:

```nginx
# Frontend
server {
    listen 80;
    server_name seu-dominio.com.br www.seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Upload limits
        client_max_body_size 10M;
    }
}
```

### 3. Ativar Site

```bash
sudo ln -s /etc/nginx/sites-available/crm-protecar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Configurar SSL com Let's Encrypt

### 1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obter Certificados

```bash
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br
sudo certbot --nginx -d api.seu-dominio.com.br
```

### 3. Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Crontab já configurado automaticamente
```

## 🔄 Backup Automático

### 1. Criar Script de Backup Diário

Criar arquivo `/opt/crm-protecar/scripts/cron-backup.sh`:

```bash
#!/bin/bash
cd /opt/crm-protecar
./scripts/backup-db.sh "auto_$(date +\%Y\%m\%d)"

# Manter apenas últimos 30 backups
find backups/ -name "auto_*.sql.gz" -mtime +30 -delete
```

### 2. Configurar Cron

```bash
chmod +x scripts/cron-backup.sh

# Adicionar ao crontab (backup diário às 2h)
crontab -e

# Adicionar linha:
0 2 * * * /opt/crm-protecar/scripts/cron-backup.sh >> /var/log/crm-backup.log 2>&1
```

## 📊 Monitoramento

### Logs do Sistema

```bash
# Ver logs em tempo real
./scripts/logs.sh all -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do Docker
docker logs -f protecar-backend
docker logs -f protecar-frontend
docker logs -f protecar-mysql
```

### Health Check Periódico

```bash
# Adicionar ao crontab (a cada 5 minutos)
*/5 * * * * /opt/crm-protecar/scripts/health-check.sh > /dev/null 2>&1
```

## 🔄 Atualização do Sistema

### Deploy de Nova Versão

```bash
cd /opt/crm-protecar

# 1. Fazer backup
./scripts/backup-db.sh "pre_update_$(date +\%Y\%m\%d_\%H\%M\%S)"

# 2. Atualizar código
git pull origin main

# 3. Rebuild e restart
./scripts/update.sh

# 4. Verificar
./scripts/health-check.sh
```

### Rollback em Caso de Problema

```bash
# 1. Voltar código
git reset --hard HEAD~1

# 2. Rebuild
./scripts/restart.sh prod

# 3. Restaurar banco (se necessário)
./scripts/restore-db.sh backups/pre_update_XXXXXX.sql.gz
```

## 🔧 Troubleshooting

### Serviço não inicia

```bash
# Verificar logs
./scripts/logs.sh

# Verificar portas em uso
sudo netstat -tulpn | grep -E '3000|3001|3306'

# Limpar e reiniciar
./scripts/cleanup.sh
./scripts/start.sh prod
```

### Erro de Memória

```bash
# Verificar uso
free -h
docker stats

# Adicionar swap se necessário
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Banco de Dados Corrompido

```bash
# Restaurar último backup
./scripts/restore-db.sh backups/backup_XXXXXX.sql.gz

# Ou executar migrations novamente
./scripts/migrate.sh
```

### Certificado SSL Expirado

```bash
sudo certbot renew
sudo systemctl restart nginx
```

## 🔐 Segurança

### 1. Configurar Senha MySQL Forte

```bash
# No backend/.env.production
DB_PASSWORD=$(openssl rand -base64 32)
```

### 2. Configurar JWT Secret Forte

```bash
# No backend/.env.production
JWT_SECRET=$(openssl rand -base64 64)
```

### 3. Restringir Acesso MySQL

```bash
# MySQL só aceita conexões internas (via Docker network)
# Firewall bloqueia porta 3306 externa
```

### 4. Rate Limiting no Nginx

Adicionar em `/etc/nginx/sites-available/crm-protecar`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    ...
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        ...
    }
}
```

## 📈 Otimizações de Performance

### 1. Ajustar MySQL para Produção

Editar `docker/mysql/my.cnf`:

```ini
innodb_buffer_pool_size = 2G  # 50-70% da RAM
max_connections = 200
```

### 2. Configurar Nginx Cache

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;

location /_next/static {
    proxy_cache STATIC;
    proxy_pass http://localhost:3000;
}
```

### 3. Habilitar Compressão

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

## 📞 Suporte

- **Documentação:** `/opt/crm-protecar/README.md`
- **Scripts:** `/opt/crm-protecar/scripts/README.md`
- **Migrations:** `/opt/crm-protecar/backend/migrations/README.md`

## ✅ Checklist de Deploy

- [ ] Servidor atualizado
- [ ] Docker e Docker Compose instalados
- [ ] Firewall configurado
- [ ] Projeto clonado
- [ ] Arquivo `.env.production` configurado
- [ ] Scripts tornados executáveis
- [ ] Sistema iniciado
- [ ] Migrations executadas
- [ ] Health check passou
- [ ] Nginx instalado e configurado
- [ ] SSL configurado
- [ ] Backup automático configurado
- [ ] Monitoramento configurado
- [ ] Teste completo do sistema

---

**Deploy realizado com sucesso! 🎉**
