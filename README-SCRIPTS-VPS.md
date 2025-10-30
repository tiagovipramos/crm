# 📚 Scripts de Gerenciamento do CRM - VPS

Conjunto completo de scripts para gerenciar, diagnosticar e corrigir problemas no sistema CRM rodando em Docker.

## 🚀 Scripts Principais

### 1. 📊 `diagnostico-vps.sh` - Diagnóstico Completo
**O mais importante! Execute primeiro quando houver problemas.**

```bash
chmod +x diagnostico-vps.sh
./diagnostico-vps.sh
```

**O que faz:**
- ✅ Verifica status de todos os containers
- ✅ Testa conectividade (MySQL, Backend, Frontend)
- ✅ Mostra estatísticas de recursos (CPU, RAM)
- ✅ Detecta erros nos logs automaticamente
- ✅ Fornece recomendações de ação
- ✅ Lista contadores (admins, indicadores, leads)

**Quando usar:** Sempre que algo não funcionar corretamente.

---

### 2. 📋 `ver-logs-vps.sh` - Visualizar Logs
**Menu interativo para logs detalhados.**

```bash
chmod +x ver-logs-vps.sh
./ver-logs-vps.sh
```

**Opções disponíveis:**
1. Backend (últimas 50 linhas)
2. Frontend (últimas 50 linhas)
3. MySQL (últimas 50 linhas)
4. Todos os serviços
5. Backend - Tempo real (seguir log)
6. Frontend - Tempo real (seguir log)

**Quando usar:** Para investigar erros específicos encontrados no diagnóstico.

---

### 3. 🔧 `fix-tudo-definitivo-vps.sh` - Correção Definitiva
**Corrige todos os problemas conhecidos do banco de dados.**

```bash
chmod +x fix-tudo-definitivo-vps.sh
./fix-tudo-definitivo-vps.sh
```

**O que faz:**
- ✅ Cria tabela `indicacoes` se não existir
- ✅ Adiciona colunas de lootbox em indicadores
- ✅ Corrige todas as collations (utf8mb4_unicode_ci)
- ✅ Cria tabela `saques_indicador`
- ✅ Adiciona coluna `created_by` em consultores e indicadores
- ✅ Recria foreign keys com collations corretas
- ✅ Reinicia backend e frontend automaticamente

**Quando usar:** 
- Login de admin ou indicador não funciona
- Erros de collation nos logs
- Tabelas faltando
- Após deploy/redeploy

---

## 🎯 Fluxo de Resolução Rápida

```
┌─────────────────────────────────┐
│  Algo não está funcionando?     │
└────────────────┬────────────────┘
                 │
                 v
┌─────────────────────────────────┐
│  1. Execute diagnóstico         │
│  ./diagnostico-vps.sh           │
└────────────────┬────────────────┘
                 │
                 v
┌─────────────────────────────────┐
│  Erro encontrado?               │
├─────────────────────────────────┤
│  SIM → Próximo passo            │
│  NÃO → Sistema OK!              │
└────────────────┬────────────────┘
                 │
                 v
┌─────────────────────────────────┐
│  2. Verificar logs detalhados   │
│  ./ver-logs-vps.sh              │
└────────────────┬────────────────┘
                 │
                 v
┌─────────────────────────────────┐
│  Erro de banco/login?           │
├─────────────────────────────────┤
│  SIM → Execute correção         │
│  ./fix-tudo-definitivo-vps.sh   │
└────────────────┬────────────────┘
                 │
                 v
┌─────────────────────────────────┐
│  3. Execute diagnóstico         │
│  novamente para confirmar       │
└─────────────────────────────────┘
```

---

## 📖 Guia Completo

Para problemas específicos e soluções detalhadas, consulte:

```bash
# Abrir guia completo
cat GUIA-RESOLUCAO-PROBLEMAS-VPS.md
```

Ou abrir no VSCode: `GUIA-RESOLUCAO-PROBLEMAS-VPS.md`

---

## 🔗 URLs do Sistema

### Produção (VPS)
- **Admin:** http://185.217.125.72:3000/admin/login
- **Indicador:** http://185.217.125.72:3000/indicador/login
- **CRM:** http://185.217.125.72:3000/crm
- **API:** http://185.217.125.72:3001/api

### Credenciais Padrão Admin
- **Email:** admin@admin.com
- **Senha:** admin123

---

## 🛠️ Comandos Úteis do Docker

### Status e Logs
```bash
# Ver todos os containers do CRM
docker ps --filter "name=crm-"

# Ver logs em tempo real
docker logs crm-backend -f
docker logs crm-frontend -f

# Ver últimas 50 linhas do log
docker logs crm-backend --tail 50
```

### Reiniciar Serviços
```bash
# Reiniciar um serviço específico
docker restart crm-backend
docker restart crm-frontend
docker restart crm-mysql

# Reiniciar todos
docker-compose restart

# Parar todos
docker-compose down

# Iniciar todos
docker-compose up -d
```

### Rebuild
```bash
# Rebuild backend
docker-compose up -d --build backend

# Rebuild frontend
docker-compose up -d --build frontend

# Rebuild tudo
docker-compose up -d --build
```

### Acesso ao MySQL
```bash
# Conectar ao MySQL
docker exec -it crm-mysql mysql -u protecar -pprotecar123 protecar_crm

# Executar query
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT * FROM consultores;"

# Ver todas as tabelas
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SHOW TABLES;"
```

---

## 📊 Scripts de Deploy

### Deploy Inicial
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Redeploy (atualização)
```bash
chmod +x REDEPLOY-VPS.md
# Seguir instruções no arquivo
```

### Reset do Banco (CUIDADO!)
```bash
chmod +x reset-database-vps.sh
./reset-database-vps.sh
```

---

## 🆘 Suporte e Troubleshooting

### Problema: Login não funciona
```bash
./fix-tudo-definitivo-vps.sh
```

### Problema: Container não inicia
```bash
./diagnostico-vps.sh
./ver-logs-vps.sh  # Opção 4 - Ver todos
```

### Problema: Erro 500
```bash
./ver-logs-vps.sh  # Opção 1 - Backend
# Verificar erro específico
```

### Problema: Tabela não existe
```bash
./fix-tudo-definitivo-vps.sh
```

### Problema: Collation mismatch
```bash
./fix-tudo-definitivo-vps.sh
```

---

## 🔍 Checklist de Verificação

Após qualquer mudança ou problema, execute esta checklist:

- [ ] `./diagnostico-vps.sh` - Status geral OK?
- [ ] Todos os containers rodando? (`docker ps`)
- [ ] Backend responde? (`curl http://localhost:3001/api/health`)
- [ ] Frontend responde? (`curl http://localhost:3000`)
- [ ] MySQL responde? (verificado no diagnóstico)
- [ ] Login admin funciona?
- [ ] Login indicador funciona?
- [ ] Nenhum erro crítico nos logs?

---

## 📁 Estrutura de Arquivos

```
crm/
├── diagnostico-vps.sh              # 📊 Script principal de diagnóstico
├── ver-logs-vps.sh                 # 📋 Visualizador de logs
├── fix-tudo-definitivo-vps.sh      # 🔧 Correção definitiva
├── GUIA-RESOLUCAO-PROBLEMAS-VPS.md # 📖 Guia completo de problemas
├── README-SCRIPTS-VPS.md           # 📚 Este arquivo
├── deploy-vps.sh                   # 🚀 Deploy inicial
├── REDEPLOY-VPS.md                 # 🔄 Guia de redeploy
├── reset-database-vps.sh           # ⚠️  Reset do banco
├── docker-compose.yml              # 🐳 Configuração Docker
└── .env                            # 🔐 Variáveis de ambiente
```

---

## 💡 Dicas Importantes

1. **Sempre execute o diagnóstico primeiro**
   - Economiza tempo identificando o problema rapidamente

2. **Use logs em tempo real para debugging**
   - Veja erros acontecendo ao vivo: `./ver-logs-vps.sh` → Opção 5 ou 6

3. **Backup antes de mudanças grandes**
   - Exporte banco antes de alterações críticas

4. **Mantenha .env atualizado**
   - Variáveis de ambiente devem estar corretas

5. **Monitore recursos**
   - `docker stats` mostra uso de CPU/RAM em tempo real

---

## 🎓 Como Usar Este Guia

### Novo no projeto?
1. Leia este README
2. Execute `./diagnostico-vps.sh`
3. Teste login no sistema
4. Consulte `GUIA-RESOLUCAO-PROBLEMAS-VPS.md` se necessário

### Sistema com problema?
1. Execute `./diagnostico-vps.sh`
2. Se erro de banco/login: `./fix-tudo-definitivo-vps.sh`
3. Verifique logs: `./ver-logs-vps.sh`
4. Consulte `GUIA-RESOLUCAO-PROBLEMAS-VPS.md` para problema específico

### Fazendo deploy/atualização?
1. Siga `DEPLOY-VPS.md` ou `REDEPLOY-VPS.md`
2. Execute `./fix-tudo-definitivo-vps.sh`
3. Execute `./diagnostico-vps.sh` para confirmar
4. Teste todas as funcionalidades

---

## 📞 Comandos de Emergência

### Sistema travado?
```bash
docker-compose down
docker-compose up -d
./diagnostico-vps.sh
```

### Banco corrompido?
```bash
./reset-database-vps.sh  # CUIDADO: Apaga tudo!
```

### Disco cheio?
```bash
docker system prune -a --volumes -f
```

### Porta em uso?
```bash
sudo netstat -tulpn | grep :3000  # ou :3001, :3306
sudo kill -9 <PID>
```

---

**Última atualização:** 30/01/2025  
**Versão:** 1.0  
**Autor:** Sistema CRM

---

## ✨ Próximos Passos

Agora que você tem todos os scripts, recomendamos:

1. ✅ Tornar todos executáveis:
   ```bash
   chmod +x diagnostico-vps.sh ver-logs-vps.sh fix-tudo-definitivo-vps.sh
   ```

2. ✅ Fazer um teste completo:
   ```bash
   ./diagnostico-vps.sh
   ```

3. ✅ Conhecer os logs:
   ```bash
   ./ver-logs-vps.sh
   ```

4. ✅ Ler o guia completo:
   ```bash
   cat GUIA-RESOLUCAO-PROBLEMAS-VPS.md
   ```

**Bom trabalho! 🚀**
