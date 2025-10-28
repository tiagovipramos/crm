# 🔐 Como Conectar na VPS Contabo

## Problema: Não consigo conectar via SSH

Você está vendo o erro: "No supported authentication methods available (server sent: publickey)"

## ✅ Solução para Contabo VPS

### Opção 1: Usar a Opção "I can't connect to this server" (Mais Fácil)

1. No painel da Contabo, clique em **"Manage ▼"** ao lado da sua VPS
2. Selecione **"I can't connect to this server"**
3. A Contabo irá te ajudar a resetar o acesso ou fornecer credenciais

### Opção 2: Usar o VNC Console (Recomendado)

O Contabo oferece um console VNC web que não precisa de SSH:

1. No painel da Contabo, clique em **"Manage ▼"**
2. Selecione **"Control"**
3. Procure por **"VNC Console"** ou **"Console"**
4. Clique para abrir o console no navegador
5. Faça login como `root` com a senha que você definiu

**Dentro do console VNC**, você pode habilitar autenticação por senha:

```bash
# Editar configuração SSH
nano /etc/ssh/sshd_config

# Procure e altere estas linhas para:
PasswordAuthentication yes
PermitRootLogin yes
PubkeyAuthentication yes

# Pressione Ctrl+O para salvar, Enter, Ctrl+X para sair

# Reinicie o SSH
systemctl restart sshd

# Defina/redefina a senha do root
passwd root
# Digite a nova senha duas vezes
```

Agora você pode conectar via PuTTY com usuário `root` e a senha que você definiu.

### Opção 3: Resetar a Senha Root

1. No painel da Contabo, clique em **"Manage ▼"**
2. Selecione **"Rescue System"**
3. Ative o sistema de resgate
4. Use o VNC Console para acessar o sistema de resgate
5. Monte o disco e redefina a senha root

### Opção 4: Reinstalar o Sistema

Se nada funcionar:

1. No painel da Contabo, clique em **"Manage ▼"**
2. Selecione **"Reinstall"**
3. Durante a reinstalação, você pode definir:
   - Novo sistema operacional (Ubuntu 22.04 recomendado)
   - Nova senha root
   - Opcionalmente adicionar sua chave SSH pública

## 🚀 Depois de Conectar

### Via PuTTY (após habilitar senha):

```
Host Name: 185.217.125.72
Port: 22
Username: root
Password: [sua senha]
```

### Via Git Bash / PowerShell:

```bash
ssh root@185.217.125.72
# Digite a senha quando solicitado
```

## 📥 Instalação Automatizada do CRM

Depois de conectar com sucesso:

```bash
# 1. Baixar o script de instalação
wget https://raw.githubusercontent.com/tiagovipramos/crm/main/install-vps.sh

# 2. Dar permissão de execução
chmod +x install-vps.sh

# 3. Executar
./install-vps.sh
```

O script vai:
- ✅ Instalar tudo automaticamente (Node.js, MySQL, etc)
- ✅ Configurar o banco de dados
- ✅ Clonar o projeto do GitHub
- ✅ Instalar dependências
- ✅ Compilar o projeto
- ✅ Configurar Nginx e PM2
- ✅ Iniciar o sistema

## 🆘 Suporte Contabo

Se nenhuma opção funcionar, abra um ticket de suporte:

1. No painel da Contabo, vá em **"Support"**
2. Crie um novo ticket explicando:
   - "Não consigo conectar via SSH na VPS"
   - "Preciso de ajuda para resetar a senha root"
   - "Ou adicionar autenticação por senha"

## 📞 Informações Úteis da Sua VPS

**VPS Principal (185.217.125.72):**
- IP: 185.217.125.72
- OS: Ubuntu 22.04
- RAM: Verificar no painel
- Localização: Hub Europe

**Outras VPS disponíveis:**
- 154.53.38.58 (Geocoder VOLP)
- 207.244.243.76 (VOLP SYSTEM)
- 162.105.90.179 (VPS 1 SSD)

## 🎯 Checklist

- [ ] Tentei "I can't connect to this server" no menu Manage
- [ ] Acessei via VNC Console
- [ ] Habilitei PasswordAuthentication no SSH
- [ ] Resetei a senha root
- [ ] Consegui conectar via SSH
- [ ] Executei o script de instalação automática
- [ ] Sistema CRM funcionando

---

**Dica:** O VNC Console é a forma mais fácil e rápida de acessar sua VPS quando o SSH não funciona! 🚀
