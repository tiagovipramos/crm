# Guia de Deploy no VPS com Docker

## Pré-requisitos

Certifique-se de que seu VPS tem:
- Docker instalado
- Docker Compose instalado
- Git instalado
- Portas 3000, 3001 e 5432 disponíveis (ou configure outras no .env)

## Passo 1: Preparar o Ambiente

### 1.1. Clonar o repositório (se ainda não fez)
```bash
git clone https://github.com/tiagovipramos/crm.git
cd crm
```

### 1.2. Criar arquivo .env
```bash
cp .env.example .env
```

### 1.3. Editar o arquivo .env com suas configurações
```bash
nano .env
```

Exemplo de configuração para produção:
```env
# Database
DB_NAME=protecar_crm
DB_USER=postgres
DB_PASSWORD=senha_segura_aqui
DB_PORT=5432

# Backend
PORT=3001
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRES_IN=7d

# Frontend
NEXT_PUBLIC_API_URL=http://seu-dominio-ou-ip:3001

# URLs
FRONTEND_URL=http://seu-dominio-ou-ip:3000
```

**IMPORTANTE:** 
- Altere `DB_PASSWORD` para uma senha forte
- Altere `JWT_SECRET` para uma chave secreta longa e aleatória
- Substitua `seu-dominio-ou-ip` pelo IP/domínio real do seu VPS

## Passo 2: Build e Deploy

### Opção 1: Usando o script automatizado
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Opção 2: Comandos manuais

#### 2.1. Limpar builds anteriores (opcional, se houver problemas)
```bash
docker-compose down -v
docker system prune -af
```

#### 2.2. Build das imagens
```bash
docker-compose build --no-cache
```

#### 2.3. Iniciar os containers
```bash
docker-compose up -d
```

## Passo 3: Verificar o Deploy

### 3.1. Verificar se os containers estão rodando
```bash
docker-compose ps
```

Você deve ver 3 containers:
- crm-postgres (rodando)
- crm-backend (rodando)
- crm-frontend (rodando)

### 3.2. Ver logs em tempo real
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend

# Apenas database
docker-compose logs -f postgres
```

### 3.3. Acessar a aplicação
- Frontend: http://seu-ip-ou-dominio:3000
- Backend API: http://seu-ip-ou-dominio:3001
- Database: localhost:5432 (apenas internamente)

## Comandos Úteis

### Parar os containers
```bash
docker-compose stop
```

### Reiniciar os containers
```bash
docker-compose restart
```

### Parar e remover os containers
```bash
docker-compose down
```

### Parar e remover os containers + volumes (CUIDADO: apaga o banco de dados)
```bash
docker-compose down -v
```

### Ver logs de um container específico
```bash
docker logs crm-backend
docker logs crm-frontend
docker logs crm-postgres
```

### Executar comandos dentro de um container
```bash
# Acessar o backend
docker exec -it crm-backend sh

# Acessar o postgres
docker exec -it crm-postgres psql -U postgres -d protecar_crm

# Executar migrations manualmente
docker exec -it crm-backend npm run setup
```

### Atualizar a aplicação
```bash
# 1. Parar os containers
docker-compose stop

# 2. Fazer pull do código novo
git pull

# 3. Rebuild das imagens
docker-compose build --no-cache

# 4. Reiniciar os containers
docker-compose up -d
```

## Solução de Problemas

### Problema: Container do backend não inicia
```bash
# Ver logs detalhados
docker-compose logs backend

# Possíveis soluções:
# 1. Verificar se o .env está correto
# 2. Verificar se o banco está acessível
# 3. Rebuild sem cache
docker-compose build --no-cache backend
docker-compose up -d
```

### Problema: Erro de conexão com o banco
```bash
# 1. Verificar se o container do postgres está rodando
docker-compose ps postgres

# 2. Verificar logs do postgres
docker-compose logs postgres

# 3. Verificar variáveis de ambiente
docker exec crm-backend env | grep DB_
```

### Problema: Porta já em uso
```bash
# Ver o que está usando a porta
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :5432

# Matar o processo ou mudar a porta no .env
```

### Problema: Sem espaço em disco
```bash
# Limpar imagens e containers não utilizados
docker system prune -a

# Ver uso de espaço
docker system df
```

## Configuração de Firewall (se necessário)

Se estiver usando UFW:
```bash
# Permitir HTTP
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Não exponha a porta 5432 (postgres) publicamente!
```

## Backup do Banco de Dados

### Criar backup
```bash
docker exec crm-postgres pg_dump -U postgres protecar_crm > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup
```bash
cat backup_20251029_123456.sql | docker exec -i crm-postgres psql -U postgres protecar_crm
```

## Monitoramento

### Ver uso de recursos
```bash
docker stats
```

### Ver processos dentro do container
```bash
docker top crm-backend
docker top crm-frontend
```

## Notas de Segurança

1. **NUNCA** exponha a porta do PostgreSQL (5432) publicamente
2. Use senhas fortes para DB_PASSWORD e JWT_SECRET
3. Configure HTTPS usando nginx ou similar em produção
4. Mantenha o Docker e as imagens atualizadas
5. Faça backups regulares do banco de dados
