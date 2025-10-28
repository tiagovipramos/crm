# 🔐 Guia de Conexão SSH na VPS

## Erro: "No supported authentication methods available (server sent: publickey)"

Este erro ocorre quando o servidor VPS requer autenticação por chave SSH, mas você está tentando conectar sem a chave privada.

## 🔧 Soluções

### Opção 1: Conectar com Chave SSH (Recomendado)

#### 1. Localizar sua Chave Privada
Seu provedor de VPS deve ter fornecido uma chave privada quando você criou o servidor. Ela pode estar em:
- Email de boas-vindas
- Painel de controle da VPS
- Download automático quando criou o servidor

#### 2. Converter a Chave para formato PuTTY (se necessário)

Se sua chave está em formato `.pem` ou outro formato, você precisa convertê-la:

1. Abra o **PuTTYgen** (instalado junto com o PuTTY)
2. Clique em **"Load"**
3. Selecione **"All Files (*.*)"** no filtro
4. Navegue até sua chave privada (arquivo `.pem` ou similar)
5. Clique em **"Save private key"**
6. Salve como arquivo `.ppk` (formato do PuTTY)

#### 3. Configurar PuTTY com a Chave

1. Abra o **PuTTY**
2. Em **Host Name**, coloque: `root@154.53.38.58` (ou `admin@154.53.38.58`)
3. No menu lateral esquerdo, navegue para:
   ```
   Connection → SSH → Auth → Credentials
   ```
4. Em **"Private key file for authentication"**, clique em **"Browse"**
5. Selecione seu arquivo `.ppk` salvo anteriormente
6. Volte para **"Session"** no menu lateral
7. Clique em **"Open"** para conectar

### Opção 2: Habilitar Autenticação por Senha (Via Painel da VPS)

Se você tem acesso ao console da VPS pelo painel web do provedor:

1. Acesse o **console/terminal** pela interface web da VPS
2. Execute os comandos abaixo para habilitar autenticação por senha:

```bash
# Editar configuração SSH
sudo nano /etc/ssh/sshd_config

# Procure e altere estas linhas:
PasswordAuthentication yes
PubkeyAuthentication yes
ChallengeResponseAuthentication yes

# Salve (Ctrl+O, Enter, Ctrl+X)

# Reinicie o serviço SSH
sudo systemctl restart sshd
```

3. Defina/redefina a senha do root:
```bash
sudo passwd root
```

4. Agora tente conectar novamente com PuTTY usando senha

### Opção 3: Usar Cliente SSH Alternativo

#### Git Bash (se você tem Git instalado)
```bash
# Navegue até onde está sua chave privada
cd /c/Users/SeuUsuario/Downloads

# Dê permissão correta à chave (importante!)
chmod 600 sua-chave.pem

# Conecte
ssh -i sua-chave.pem root@154.53.38.58
```

#### Windows Terminal / PowerShell (Windows 10+)
```powershell
# Conectar com chave
ssh -i C:\caminho\para\sua-chave.pem root@154.53.38.58

# Ou se habilitou senha
ssh root@154.53.38.58
```

## 🚀 Depois de Conectado: Instalação do CRM

Após conectar com sucesso na VPS, execute:

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependências
sudo apt install -y nodejs npm mysql-server git

# 3. Configurar Node.js versão 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Verificar instalação
node --version
npm --version

# 5. Clonar o projeto
cd /var/www  # ou outro diretório de sua preferência
git clone https://github.com/tiagovipramos/crm.git
cd crm

# 6. Instalar dependências
npm install
cd backend && npm install && cd ..

# 7. Configurar MySQL
sudo mysql_secure_installation
sudo mysql -u root -p

# No console MySQL:
CREATE DATABASE protecar_crm;
CREATE USER 'crmuser'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON protecar_crm.* TO 'crmuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 8. Configurar .env
cd backend
cp .env.example .env
nano .env

# Edite conforme necessário:
# DB_HOST=localhost
# DB_USER=crmuser
# DB_PASSWORD=senha_forte_aqui
# DB_NAME=protecar_crm
# JWT_SECRET=sua_chave_secreta
# FRONTEND_URL=http://seu-dominio.com

# 9. Executar migrations
chmod +x *.sh
mysql -u crmuser -p protecar_crm < migrations/schema-mysql.sql
mysql -u crmuser -p protecar_crm < migrations/schema-indicadores-mysql.sql
mysql -u crmuser -p protecar_crm < migrations/schema-campanhas.sql
mysql -u crmuser -p protecar_crm < migrations/schema-followup.sql
mysql -u crmuser -p protecar_crm < migrations/schema-lootbox.sql
./executar-migration-ativo.sh
./executar-migration-avatar.sh
./executar-migration-lootbox.sh
./executar-migration-lootbox-vendas.sh
./executar-migration-sistema-online.sh

# 10. Criar pasta uploads
mkdir -p uploads
chmod 755 uploads

# 11. Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# 12. Build do projeto
cd ..
npm run build
cd backend
npm run build
cd ..

# 13. Iniciar com PM2
pm2 start backend/dist/server.js --name crm-backend
pm2 start npm --name crm-frontend -- start

# 14. Configurar inicialização automática
pm2 startup
pm2 save

# 15. Verificar status
pm2 status
```

## 📝 Configurar Nginx (Proxy Reverso)

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/crm

# Cole esta configuração:
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;  # Troque pelo seu domínio ou IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
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

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configurar firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 🔒 Configurar SSL (HTTPS) - Opcional mas Recomendado

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Renovação automática já está configurada
```

## 📊 Comandos Úteis PM2

```bash
# Ver logs
pm2 logs

# Ver logs específicos
pm2 logs crm-backend
pm2 logs crm-frontend

# Reiniciar aplicação
pm2 restart all
pm2 restart crm-backend

# Parar aplicação
pm2 stop all

# Ver status
pm2 status

# Monitorar em tempo real
pm2 monit
```

## 🆘 Troubleshooting

### Se der erro de porta em uso:
```bash
# Verificar o que está usando a porta
sudo lsof -i :3000
sudo lsof -i :3001

# Matar processo
sudo kill -9 <PID>
```

### Se MySQL não conectar:
```bash
# Verificar status
sudo systemctl status mysql

# Reiniciar
sudo systemctl restart mysql

# Ver logs
sudo tail -f /var/log/mysql/error.log
```

### Problemas com permissões:
```bash
# Dar permissão ao usuário www-data (Nginx)
sudo chown -R www-data:www-data /var/www/crm
sudo chmod -R 755 /var/www/crm
```

## 📞 Contato com Suporte da VPS

Se não conseguir resolver o problema de autenticação SSH, contate o suporte do seu provedor de VPS e solicite:

1. **Chave privada SSH** para acesso
2. **Habilitar autenticação por senha** temporariamente
3. **Acesso ao console web** para gerenciar credenciais

---

**Desenvolvido para facilitar o deploy na VPS** 🚀
