# 🚀 Redeploy na VPS - Correção do Erro de Login

## 📋 Problema Identificado

O erro "Network Error" ocorria porque:
1. O frontend Next.js estava tentando conectar em `http://localhost:3001` ao invés do IP da VPS
2. Variáveis `NEXT_PUBLIC_*` precisam ser definidas em **BUILD TIME**, não em runtime
3. O backend não estava configurado para aceitar requisições do IP da VPS

## ✅ Correções Aplicadas

1. **Dockerfile do Frontend** - Adicionado suporte a build args para `NEXT_PUBLIC_API_URL`
2. **docker-compose.yml** - Configurado build args e URL do frontend correta
3. **.env** - Criado arquivo com configurações corretas para a VPS

## 🔧 Comandos para Redeploy

### 1. Fazer upload dos arquivos modificados para a VPS

Use SCP, FTP ou Git para enviar os arquivos:
- `Dockerfile`
- `docker-compose.yml`
- `.env`

**Usando Git (recomendado):**
```bash
# No seu computador local
git add .
git commit -m "Correção configuração VPS - URLs corretas"
git push origin main

# Na VPS
cd /caminho/do/projeto
git pull origin main
```

**Ou usando SCP:**
```bash
scp Dockerfile docker-compose.yml .env usuario@185.217.125.72:/caminho/do/projeto/
```

### 2. Conectar na VPS via SSH

```bash
ssh usuario@185.217.125.72
```

### 3. Navegar até o diretório do projeto

```bash
cd /caminho/do/projeto/crm
```

### 4. Parar os containers atuais

```bash
docker-compose down
```

### 5. Remover a imagem antiga do frontend (IMPORTANTE!)

Como mudamos o Dockerfile, precisamos forçar o rebuild:

```bash
docker rmi crm-frontend
```

### 6. Rebuild e iniciar os containers

```bash
docker-compose up -d --build
```

O `--build` força a reconstrução das imagens com as novas configurações.

### 7. Verificar os logs

```bash
# Ver logs de todos os containers
docker-compose logs -f

# Ver logs apenas do frontend
docker-compose logs -f frontend

# Ver logs apenas do backend
docker-compose logs -f backend
```

### 8. Testar o acesso

Abra o navegador e acesse:
- Frontend: http://185.217.125.72:3000
- Backend: http://185.217.125.72:3001/api/health

## 🔍 Verificação

Após o redeploy, verifique:

1. ✅ O frontend carrega sem erros no console
2. ✅ Consegue fazer login sem "Network Error"
3. ✅ O Socket.IO conecta corretamente
4. ✅ As mensagens de WhatsApp funcionam

## ⚠️ Observações Importantes

1. **Primeira vez após rebuild**: O frontend pode demorar alguns segundos para iniciar
2. **Banco de dados**: Os dados não serão perdidos, estão salvos no volume Docker
3. **Sessões WhatsApp**: As sessões salvas serão reconectadas automaticamente

## 🆘 Se ainda houver problemas

Execute na VPS:

```bash
# Verificar se os containers estão rodando
docker-compose ps

# Ver logs detalhados do frontend
docker-compose logs frontend | tail -50

# Ver logs detalhados do backend
docker-compose logs backend | tail -50

# Verificar variáveis de ambiente do frontend
docker exec crm-frontend env | grep NEXT_PUBLIC_API_URL
```

## 📝 Notas

- As mudanças agora apontam corretamente para o IP: **185.217.125.72**
- Frontend na porta **3000**, Backend na porta **3001**
- O arquivo `.env` pode ser personalizado conforme necessário
