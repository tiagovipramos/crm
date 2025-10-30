# 🔧 Guia de Resolução de Problemas - VPS

Este guia contém soluções para os problemas mais comuns do sistema CRM no VPS.

## 📋 Scripts Disponíveis

### 1. `diagnostico-vps.sh` - Diagnóstico Completo
```bash
chmod +x diagnostico-vps.sh
./diagnostico-vps.sh
```
**O que faz:**
- Verifica status de todos os containers
- Testa conectividade com MySQL, Backend e Frontend
- Mostra estatísticas de recursos
- Detecta erros nos logs
- Fornece recomendações

### 2. `ver-logs-vps.sh` - Visualizar Logs
```bash
chmod +x ver-logs-vps.sh
./ver-logs-vps.sh
```
**O que faz:**
- Menu interativo para visualizar logs
- Opções: Backend, Frontend, MySQL, Todos, Tempo Real

### 3. `fix-tudo-definitivo-vps.sh` - Correção Definitiva
```bash
chmod +x fix-tudo-definitivo-vps.sh
./fix-tudo-definitivo-vps.sh
```
**O que faz:**
- Cria tabela indicacoes
- Adiciona colunas de lootbox
- Corrige collations
- Cria tabela saques_indicador
- Reinicia containers

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: Login do Admin não funciona

**Sintomas:**
- Erro "Usuário ou senha inválidos"
- Console mostra erro 401

**Solução:**
```bash
# 1. Verificar se o usuário admin existe
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT id, nome, email, role FROM consultores WHERE role='admin';"

# 2. Se não existir, criar:
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm << 'EOF'
DELETE FROM consultores WHERE email = 'admin@admin.com';
INSERT INTO consultores (id, nome, email, senha, telefone, role, ativo) 
VALUES ('admin-123', 'Administrador', 'admin@admin.com', '$2b$10$rH6VqKqgQO3fF9HKgGAKOeYXHwYxDxF8vXr7zAKF5AKqgQO3fF9HK', '(11) 99999-9999', 'admin', 1);
EOF

# 3. Reiniciar backend
docker restart crm-backend

# 4. Testar: admin@admin.com / admin123
```

---

### Problema 2: Login do Indicador não funciona

**Sintomas:**
- Erro ao carregar dashboard
- Tabela indicacoes não existe

**Solução:**
```bash
# Executar correção completa
./fix-tudo-definitivo-vps.sh
```

---

### Problema 3: Frontend mostra erro 500

**Sintomas:**
- Página em branco
- Console mostra erro de API

**Diagnóstico:**
```bash
# 1. Verificar se backend está respondendo
curl http://localhost:3001/api/health

# 2. Ver logs do backend
docker logs crm-backend --tail 50

# 3. Verificar conectividade com MySQL
docker exec crm-mysql mysqladmin ping -h localhost -u protecar -pprotecar123
```

**Solução:**
```bash
# Se backend não responder
docker restart crm-backend
sleep 10
docker logs crm-backend --tail 20

# Se MySQL não responder
docker restart crm-mysql
sleep 15
docker restart crm-backend
```

---

### Problema 4: Erro de Collation (utf8mb4_unicode_ci vs utf8mb4_0900_ai_ci)

**Sintomas:**
- Erro: "Illegal mix of collations"
- Problemas com foreign keys

**Solução:**
```bash
./fix-tudo-definitivo-vps.sh
```

---

### Problema 5: Container não inicia

**Sintomas:**
- `docker ps` não mostra o container
- Status "Exited"

**Diagnóstico:**
```bash
# Ver status de todos os containers
docker ps -a --filter "name=crm-"

# Ver logs do container com problema
docker logs crm-backend  # ou crm-frontend ou crm-mysql
```

**Solução:**
```bash
# 1. Parar tudo
docker-compose down

# 2. Limpar (CUIDADO: remove volumes!)
# docker volume prune -f  # Apenas se necessário

# 3. Rebuild e restart
docker-compose up -d --build

# 4. Verificar logs
./ver-logs-vps.sh
```

---

### Problema 6: Porta já em uso

**Sintomas:**
- Erro: "port is already allocated"
- Container não inicia

**Diagnóstico:**
```bash
# Verificar quem está usando a porta
sudo netstat -tulpn | grep :3000  # Frontend
sudo netstat -tulpn | grep :3001  # Backend
sudo netstat -tulpn | grep :3306  # MySQL
```

**Solução:**
```bash
# Matar processo na porta (substitua PID pelo número do processo)
sudo kill -9 <PID>

# Ou reiniciar containers
docker-compose restart
```

---

### Problema 7: Disco cheio

**Sintomas:**
- Erro: "No space left on device"
- Containers param de funcionar

**Diagnóstico:**
```bash
# Ver uso de disco
df -h

# Ver uso por containers
docker system df
```

**Solução:**
```bash
# Limpar logs antigos
docker system prune -a --volumes -f

# Limpar imagens não utilizadas
docker image prune -a -f

# Limpar volumes órfãos
docker volume prune -f
```

---

## 🔍 Comandos Úteis de Diagnóstico

### Status dos Containers
```bash
# Ver todos os containers
docker ps -a

# Ver apenas containers do CRM
docker ps --filter "name=crm-"

# Ver uso de recursos
docker stats crm-backend crm-frontend crm-mysql --no-stream
```

### Logs
```bash
# Últimas 50 linhas
docker logs crm-backend --tail 50
docker logs crm-frontend --tail 50
docker logs crm-mysql --tail 50

# Seguir em tempo real
docker logs crm-backend -f

# Logs com timestamp
docker logs crm-backend --timestamps
```

### MySQL
```bash
# Conectar ao MySQL
docker exec -it crm-mysql mysql -u protecar -pprotecar123 protecar_crm

# Executar query
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT * FROM consultores;"

# Ver tabelas
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SHOW TABLES;"

# Ver estrutura de tabela
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "DESCRIBE indicadores;"
```

### Reiniciar Serviços
```bash
# Reiniciar um container
docker restart crm-backend

# Reiniciar todos
docker-compose restart

# Parar todos
docker-compose down

# Iniciar todos
docker-compose up -d
```

### Rebuild
```bash
# Rebuild apenas backend
docker-compose up -d --build backend

# Rebuild apenas frontend
docker-compose up -d --build frontend

# Rebuild tudo
docker-compose up -d --build
```

---

## 🧪 Testes de Conectividade

### Teste 1: Backend Health Check
```bash
curl http://localhost:3001/api/health
# Esperado: {"status":"ok","timestamp":"..."}
```

### Teste 2: Login Admin via API
```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","senha":"admin123"}'
# Esperado: token JWT
```

### Teste 3: Frontend responde
```bash
curl -I http://localhost:3000
# Esperado: HTTP/1.1 200 OK
```

### Teste 4: MySQL responde
```bash
docker exec crm-mysql mysqladmin ping -h localhost -u protecar -pprotecar123
# Esperado: mysqld is alive
```

---

## 📊 Monitoramento

### Ver uso de recursos em tempo real
```bash
docker stats
```

### Ver logs de erro em tempo real
```bash
# Backend
docker logs crm-backend -f 2>&1 | grep -i error

# Frontend
docker logs crm-frontend -f 2>&1 | grep -i error
```

---

## 🔐 Credenciais Padrão

### Admin
- Email: `admin@admin.com`
- Senha: `admin123`
- URL: `http://185.217.125.72:3000/admin/login`

### Indicador (criar via admin)
- URL: `http://185.217.125.72:3000/indicador/login`

### MySQL
- Host: `localhost` (dentro dos containers: `mysql`)
- Porta: `3306`
- Usuário: `protecar`
- Senha: `protecar123`
- Database: `protecar_crm`

---

## 🚀 URLs do Sistema

- **Admin:** http://185.217.125.72:3000/admin/login
- **Indicador:** http://185.217.125.72:3000/indicador/login
- **CRM:** http://185.217.125.72:3000/crm
- **API:** http://185.217.125.72:3001/api

---

## 📞 Fluxo de Resolução de Problemas

1. **Execute o diagnóstico:**
   ```bash
   ./diagnostico-vps.sh
   ```

2. **Se encontrar erro nos logs:**
   ```bash
   ./ver-logs-vps.sh
   # Escolha opção 4 para ver todos os logs
   ```

3. **Se erro relacionado ao banco:**
   ```bash
   ./fix-tudo-definitivo-vps.sh
   ```

4. **Se problema persistir:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ./diagnostico-vps.sh
   ```

5. **Se ainda não funcionar:**
   - Verificar variáveis de ambiente no `.env`
   - Verificar conectividade de rede
   - Verificar espaço em disco: `df -h`
   - Verificar logs detalhados: `./ver-logs-vps.sh`

---

## 🆘 Suporte

Se após seguir este guia o problema persistir:

1. Execute e salve a saída de:
   ```bash
   ./diagnostico-vps.sh > diagnostico.txt
   ```

2. Salve os logs:
   ```bash
   docker logs crm-backend > backend.log
   docker logs crm-frontend > frontend.log
   docker logs crm-mysql > mysql.log
   ```

3. Envie os arquivos para análise

---

**Última atualização:** 30/01/2025
