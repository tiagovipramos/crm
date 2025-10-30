# 🚀 Comandos para Executar na VPS

Execute estes comandos **NA ORDEM** no terminal da VPS.

---

## 📥 PASSO 1: Atualizar Código da VPS

```bash
# Conectar na VPS
ssh root@185.217.125.72

# Navegar para o diretório do projeto
cd ~/crm

# Fazer backup do .env (IMPORTANTE!)
cp .env .env.backup

# Salvar alterações locais
git stash

# Puxar atualizações do GitHub
git pull origin main

# Restaurar .env
cp .env.backup .env

# Listar novos scripts
ls -la *.sh *.md
```

**Resultado esperado:** Você verá os novos arquivos:
- `diagnostico-vps.sh`
- `ver-logs-vps.sh`
- `fix-tudo-definitivo-vps.sh`
- `GUIA-RESOLUCAO-PROBLEMAS-VPS.md`
- `README-SCRIPTS-VPS.md`
- `SINCRONIZAR-LOCAL-PARA-VPS.md`

---

## 🔧 PASSO 2: Tornar Scripts Executáveis

```bash
chmod +x diagnostico-vps.sh
chmod +x ver-logs-vps.sh
chmod +x fix-tudo-definitivo-vps.sh
```

---

## 🔍 PASSO 3: Executar Diagnóstico

```bash
./diagnostico-vps.sh
```

**O que vai mostrar:**
- Status dos containers
- Conectividade MySQL, Backend, Frontend
- Estatísticas de recursos
- Erros nos logs
- Recomendações

---

## 📋 PASSO 4: Ver Logs (Se Necessário)

```bash
./ver-logs-vps.sh
```

**Menu interativo com opções:**
1. Backend
2. Frontend
3. MySQL
4. Todos os serviços
5. Backend - Tempo real
6. Frontend - Tempo real

---

## 🔧 PASSO 5: Corrigir Problemas (Se Necessário)

```bash
./fix-tudo-definitivo-vps.sh
```

**O que faz:**
- Cria tabela indicacoes
- Adiciona colunas de lootbox
- Corrige collations
- Cria tabela saques_indicador
- Reinicia containers

---

## 🌐 PASSO 6: Testar Acessos

Abra no navegador:

- **Admin:** http://185.217.125.72:3000/admin/login
  - Email: `admin@admin.com`
  - Senha: `admin123`

- **Indicador:** http://185.217.125.72:3000/indicador/login
  - Use credenciais cadastradas no admin

- **CRM:** http://185.217.125.72:3000/crm

---

## 📊 Comandos Úteis de Diagnóstico

### Ver status dos containers
```bash
docker ps
```

### Ver logs em tempo real
```bash
# Backend
docker logs crm-backend -f

# Frontend
docker logs crm-frontend -f

# MySQL
docker logs crm-mysql -f
```

### Ver últimas 30 linhas dos logs
```bash
docker logs crm-backend --tail 30
docker logs crm-frontend --tail 30
docker logs crm-mysql --tail 30
```

### Reiniciar serviços
```bash
# Reiniciar um serviço específico
docker restart crm-backend
docker restart crm-frontend

# Reiniciar todos
docker-compose restart

# Parar todos
docker-compose down

# Iniciar todos
docker-compose up -d
```

### Verificar banco de dados
```bash
# Conectar ao MySQL
docker exec -it crm-mysql mysql -u protecar -pprotecar123 protecar_crm

# Ver tabelas
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SHOW TABLES;"

# Contar registros
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT COUNT(*) as total FROM leads;"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT COUNT(*) as total FROM indicadores;"
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT COUNT(*) as total FROM consultores WHERE role='admin';"
```

---

## 🔄 SINCRONIZAR BANCO LOCAL PARA VPS (Opcional)

Se quiser substituir o banco da VPS pelo seu banco local:

### No Windows (Local):
```cmd
exportar-banco-local.bat
```

### Transferir para VPS:
```powershell
scp banco-local-completo.sql root@185.217.125.72:~/crm/
scp importar-banco-na-vps.sh root@185.217.125.72:~/crm/
```

### Na VPS:
```bash
cd ~/crm
chmod +x importar-banco-na-vps.sh
./importar-banco-na-vps.sh
```

**⚠️ ATENÇÃO:** Isso irá:
- Fazer backup automático do banco VPS atual
- APAGAR completamente o banco VPS
- SUBSTITUIR pelo banco local

---

## 📖 Documentação Disponível

```bash
# Ler guia de resolução de problemas
cat GUIA-RESOLUCAO-PROBLEMAS-VPS.md

# Ler documentação dos scripts
cat README-SCRIPTS-VPS.md

# Ler guia de sincronização
cat SINCRONIZAR-LOCAL-PARA-VPS.md
```

---

## 🆘 Em Caso de Problemas

1. **Execute o diagnóstico:**
   ```bash
   ./diagnostico-vps.sh
   ```

2. **Veja os logs:**
   ```bash
   ./ver-logs-vps.sh
   ```

3. **Se erro de banco/login:**
   ```bash
   ./fix-tudo-definitivo-vps.sh
   ```

4. **Se problema persistir:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ./diagnostico-vps.sh
   ```

---

## ✅ Checklist Rápido

Execute na ordem:

- [ ] `cd ~/crm`
- [ ] `cp .env .env.backup`
- [ ] `git stash`
- [ ] `git pull origin main`
- [ ] `cp .env.backup .env`
- [ ] `chmod +x diagnostico-vps.sh ver-logs-vps.sh fix-tudo-definitivo-vps.sh`
- [ ] `./diagnostico-vps.sh`
- [ ] Testar: http://185.217.125.72:3000/admin/login
- [ ] Testar: http://185.217.125.72:3000/indicador/login

---

**Última atualização:** 30/01/2025  
**Commit:** 24bd056
