# 📜 Scripts de Automação - CRM Protecar

Conjunto de scripts Bash para gerenciar o CRM Protecar em ambiente Linux/Unix.

## 🚀 Primeiro Uso (Linux/macOS)

Após clonar o repositório, torne os scripts executáveis:

```bash
chmod +x scripts/*.sh
```

## 📋 Scripts Disponíveis

### 🚀 start.sh
Inicia todos os serviços (MySQL, Backend, Frontend)
```bash
./scripts/start.sh              # Modo desenvolvimento
./scripts/start.sh prod         # Modo produção
```

### 🛑 stop.sh
Para todos os serviços
```bash
./scripts/stop.sh               # Preserva volumes
./scripts/stop.sh --remove-volumes  # Remove volumes (CUIDADO!)
```

### 🔄 restart.sh
Reinicia todos os serviços
```bash
./scripts/restart.sh            # Modo desenvolvimento
./scripts/restart.sh prod       # Modo produção
```

### 📋 logs.sh
Exibe logs dos serviços
```bash
./scripts/logs.sh               # Todos os serviços
./scripts/logs.sh backend       # Apenas backend
./scripts/logs.sh frontend      # Apenas frontend
./scripts/logs.sh mysql         # Apenas MySQL
./scripts/logs.sh all -f        # Follow mode
./scripts/logs.sh backend -n 50 # Últimas 50 linhas
```

### 📊 migrate.sh
Executa migrations do banco de dados
```bash
./scripts/migrate.sh            # Todas as migrations
./scripts/migrate.sh 001_schema.sql  # Migration específica
```

### 🌱 seed.sh
Popula banco com dados de teste
```bash
./scripts/seed.sh
```
**Credenciais criadas:**
- Admin: `admin@protecar.com` / `admin123`
- Teste: `carlos@protecar.com` / `123456`

### 💾 backup-db.sh
Cria backup do banco de dados
```bash
./scripts/backup-db.sh          # Nome automático
./scripts/backup-db.sh my-backup  # Nome customizado
```
Backups são salvos em `backups/` comprimidos com gzip.

### ♻️  restore-db.sh
Restaura backup do banco de dados
```bash
./scripts/restore-db.sh backup_20250201_120000.sql.gz
```
⚠️ **ATENÇÃO:** Substitui todos os dados atuais!

### 🧹 cleanup.sh
Limpa recursos Docker não utilizados
```bash
./scripts/cleanup.sh            # Preserva volumes
./scripts/cleanup.sh --all      # Remove tudo (CUIDADO!)
```

### 🏥 health-check.sh
Verifica saúde de todos os serviços
```bash
./scripts/health-check.sh
```
Verifica:
- Docker status
- Containers rodando
- MySQL respondendo
- Backend API (http://localhost:3001/health)
- Frontend (http://localhost:3000)
- Logs de erros
- Uso de recursos

### 🔄 update.sh
Atualiza sistema (git pull + rebuild)
```bash
./scripts/update.sh             # Com backup
./scripts/update.sh --no-backup # Sem backup
```

## 🎯 Fluxo de Trabalho Comum

### Primeiro Deploy
```bash
# 1. Configurar ambiente
cp backend/.env.example backend/.env.development
# Editar backend/.env.development com suas configurações

# 2. Iniciar sistema
./scripts/start.sh

# 3. Executar migrations
./scripts/migrate.sh

# 4. Popular com dados de teste (opcional)
./scripts/seed.sh

# 5. Verificar saúde
./scripts/health-check.sh
```

### Desenvolvimento Diário
```bash
# Ver logs em tempo real
./scripts/logs.sh all -f

# Reiniciar após mudanças
./scripts/restart.sh

# Verificar se está tudo OK
./scripts/health-check.sh
```

### Manutenção
```bash
# Backup antes de mudanças importantes
./scripts/backup-db.sh

# Atualizar sistema
./scripts/update.sh

# Limpar recursos antigos
./scripts/cleanup.sh
```

### Em Caso de Problemas
```bash
# 1. Ver logs
./scripts/logs.sh

# 2. Verificar saúde
./scripts/health-check.sh

# 3. Reiniciar
./scripts/restart.sh

# 4. Se persistir, limpar e reiniciar
./scripts/cleanup.sh
./scripts/start.sh
./scripts/migrate.sh
```

## 🐳 Requisitos

- **Docker** (20.10+)
- **Docker Compose** (2.0+)
- **Bash** (4.0+)
- **curl** (para health checks)
- **gzip** (para backups)

## 📝 Notas Importantes

1. **Windows:** Use WSL2, Git Bash ou MSYS2 para executar os scripts
2. **Permissões:** Scripts devem ter permissão de execução (`chmod +x`)
3. **Backups:** São salvos em `backups/` e comprimidos automaticamente
4. **Logs:** Use `-f` para follow mode e `-n N` para número de linhas
5. **Ambiente:** Use `prod` como argumento para modo produção

## 🆘 Troubleshooting

### Script não executa
```bash
chmod +x scripts/nome-do-script.sh
```

### Docker não encontrado
```bash
# Verificar instalação
docker --version
docker-compose --version
```

### Portas em uso
```bash
# Ver o que está usando as portas
netstat -tuln | grep -E '3000|3001|3306'

# Ou parar tudo
./scripts/stop.sh
```

### Erros de permissão
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
# Fazer logout e login novamente
```

## 📚 Documentação Adicional

- [DEPLOY.md](../DEPLOY.md) - Guia completo de deploy em VPS
- [README.md](../README.md) - Documentação principal do projeto
- [docs/ARQUITETURA.md](../docs/ARQUITETURA.md) - Arquitetura do sistema

## 🤝 Contribuindo

Ao adicionar novos scripts:
1. Use o mesmo padrão de banner e cores
2. Adicione comentários explicativos
3. Implemente validações de segurança
4. Documente neste README
5. Torne executável com `chmod +x`

---

**Desenvolvido para CRM Protecar** 🚗💚
