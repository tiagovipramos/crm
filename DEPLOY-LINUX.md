# 🐧 Guia de Deploy - Linux

Este guia contém instruções específicas para executar o Protecar CRM em sistemas Linux.

## 📋 Pré-requisitos

### 1. Node.js e npm
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm

# Fedora/RHEL/CentOS
sudo dnf install -y nodejs npm

# Arch Linux
sudo pacman -S nodejs npm

# Verificar instalação
node --version
npm --version
```

### 2. MySQL Server
```bash
# Ubuntu/Debian
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Fedora/RHEL/CentOS
sudo dnf install -y mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Arch Linux
sudo pacman -S mysql
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Configurar senha root do MySQL (se necessário)
sudo mysql_secure_installation
```

### 3. Git
```bash
# Ubuntu/Debian
sudo apt install -y git

# Fedora/RHEL/CentOS
sudo dnf install -y git

# Arch Linux
sudo pacman -S git
```

## 🚀 Instalação

### 1. Clonar o Repositório
```bash
git clone https://github.com/tiagovipramos/crm.git
cd crm
```

### 2. Instalar Dependências do Frontend
```bash
npm install
```

### 3. Instalar Dependências do Backend
```bash
cd backend
npm install
cd ..
```

### 4. Configurar Banco de Dados

#### Criar o banco de dados:
```bash
mysql -u root -p
```

No console do MySQL:
```sql
CREATE DATABASE protecar_crm;
EXIT;
```

#### Executar migrations:
```bash
cd backend
mysql -u root -p protecar_crm < migrations/schema-mysql.sql
mysql -u root -p protecar_crm < migrations/schema-indicadores-mysql.sql
mysql -u root -p protecar_crm < migrations/schema-campanhas.sql
mysql -u root -p protecar_crm < migrations/schema-followup.sql
mysql -u root -p protecar_crm < migrations/schema-lootbox.sql
mysql -u root -p protecar_crm < migrations/adicionar-coluna-ativo-consultores.sql
mysql -u root -p protecar_crm < migrations/adicionar-coluna-avatar-indicadores.sql
mysql -u root -p protecar_crm < migrations/adicionar-lootbox-vendas.sql
mysql -u root -p protecar_crm < migrations/adicionar-coluna-sistema-online.sql
cd ..
```

Ou usar os scripts automatizados:
```bash
cd backend
chmod +x *.sh
./executar-migration-ativo.sh
./executar-migration-avatar.sh
./executar-migration-lootbox.sh
./executar-migration-lootbox-vendas.sh
./executar-migration-sistema-online.sh
cd ..
```

### 5. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e edite conforme necessário:
```bash
cd backend
cp .env.example .env
nano .env  # ou use seu editor preferido
```

Configurações importantes no `.env`:
```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=protecar_crm
DB_USER=root
DB_PASSWORD=sua_senha_mysql

JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

### 6. Criar Pasta de Uploads
```bash
cd backend
mkdir -p uploads
chmod 755 uploads
cd ..
```

## 🎯 Executar o Projeto

### Opção 1: Scripts Automatizados (Recomendado)

Dar permissão de execução aos scripts:
```bash
chmod +x iniciar-projeto.sh parar-projeto.sh
```

Iniciar o projeto:
```bash
./iniciar-projeto.sh
```

Parar o projeto:
```bash
./parar-projeto.sh
```

### Opção 2: Manualmente em Terminais Separados

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🌐 Acessar o Sistema

Após iniciar, acesse:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **CRM Vendedores**: http://localhost:3000/crm
- **Painel Indicador**: http://localhost:3000/indicador/login
- **Painel Admin**: http://localhost:3000/admin/login

## 🔧 Problemas Comuns e Soluções

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Erro: "EADDRINUSE" (Porta em uso)
```bash
# Verificar processo usando a porta 3000
sudo lsof -i :3000
# Matar processo
sudo kill -9 <PID>

# Verificar processo usando a porta 3001
sudo lsof -i :3001
sudo kill -9 <PID>
```

### Erro de Conexão com MySQL
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql  # ou mysqld

# Iniciar MySQL se necessário
sudo systemctl start mysql  # ou mysqld

# Verificar se pode conectar
mysql -u root -p
```

### Problemas com Permissões de Arquivo
```bash
# Dar permissões corretas para pasta uploads
cd backend
sudo chown -R $USER:$USER uploads
chmod -R 755 uploads
cd ..
```

### Problemas com Scripts .sh
```bash
# Tornar todos os scripts executáveis
chmod +x *.sh
chmod +x backend/*.sh
```

## 📦 Deploy em Produção

### 1. Usar PM2 para Manter Processos Ativos

Instalar PM2:
```bash
sudo npm install -g pm2
```

Criar arquivo de configuração `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      cwd: './backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'crm-frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

Iniciar com PM2:
```bash
# Build do backend
cd backend
npm run build
cd ..

# Build do frontend
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar para iniciar automaticamente no boot
pm2 startup
pm2 save
```

### 2. Usar Nginx como Reverse Proxy

Instalar Nginx:
```bash
sudo apt install -y nginx  # Ubuntu/Debian
sudo dnf install -y nginx  # Fedora/RHEL
```

Configurar Nginx (`/etc/nginx/sites-available/crm`):
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar configuração:
```bash
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Segurança

1. **Firewall**: Configure o firewall para permitir apenas portas necessárias
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

2. **SSL/TLS**: Use Let's Encrypt para HTTPS
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

3. **Variáveis de Ambiente**: Nunca commite arquivos `.env` com dados sensíveis

4. **Atualizações**: Mantenha o sistema e dependências atualizadas
```bash
sudo apt update && sudo apt upgrade
npm update
cd backend && npm update
```

## 📊 Monitoramento

### Ver logs do PM2:
```bash
pm2 logs crm-backend
pm2 logs crm-frontend
pm2 monit
```

### Ver status dos serviços:
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql
```

## 🆘 Suporte

Para problemas específicos do Linux, verifique:
- Logs do sistema: `journalctl -xe`
- Logs do MySQL: `/var/log/mysql/error.log`
- Logs do Nginx: `/var/log/nginx/error.log`

## 📝 Notas Importantes

1. **Diferenças do Windows**: Os scripts `.bat` não funcionam no Linux. Use os scripts `.sh` fornecidos.
2. **Caminhos de Arquivo**: Linux usa `/` em vez de `\` para caminhos.
3. **Permissões**: O sistema de permissões do Linux é diferente do Windows.
4. **Case-Sensitive**: Nomes de arquivos no Linux são case-sensitive.
5. **MySQL**: No Linux, o serviço pode se chamar `mysql` ou `mysqld` dependendo da distribuição.

## ✅ Checklist de Instalação

- [ ] Node.js e npm instalados
- [ ] MySQL Server instalado e rodando
- [ ] Banco de dados `protecar_crm` criado
- [ ] Migrations executadas
- [ ] Dependências instaladas (frontend e backend)
- [ ] Arquivo `.env` configurado
- [ ] Pasta `uploads` criada com permissões corretas
- [ ] Scripts `.sh` com permissão de execução
- [ ] Projeto testado e funcionando

---

**Desenvolvido para rodar em ambientes Linux com total compatibilidade** 🐧
