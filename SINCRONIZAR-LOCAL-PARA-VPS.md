# 🔄 Sincronizar Banco Local (XAMPP) para VPS (Docker)

Este guia ensina como exportar seu banco de dados funcionando no XAMPP local e importar na VPS, mantendo todos os dados, usuários e configurações.

## 📋 Pré-requisitos

- XAMPP rodando localmente (Windows)
- Acesso SSH à VPS (root@185.217.125.72)
- Docker rodando na VPS

---

## 🚀 Passo a Passo Completo

### PARTE 1: Exportar Banco Local (Windows)

#### 1.1. Execute o script de exportação

```cmd
exportar-banco-local.bat
```

**O que o script faz:**
- ✅ Verifica conexão com MySQL local
- ✅ Exporta banco completo (estrutura + dados)
- ✅ Inclui triggers, procedures, events
- ✅ Preserva charset utf8mb4
- ✅ Cria script de importação **com backup automático**
- ✅ Gera arquivo `banco-local-completo.sql`

#### 1.2. Arquivos gerados

Após executar, você terá:
- `banco-local-completo.sql` - Dump completo do banco
- `importar-banco-na-vps.sh` - Script para VPS

---

### PARTE 2: Transferir Arquivos para VPS

#### 2.1. Usando WinSCP (Recomendado - Interface Gráfica)

1. Abra o WinSCP
2. Conecte em: `185.217.125.72` (usuário: root)
3. Navegue até `/root/crm/`
4. Arraste os 2 arquivos:
   - `banco-local-completo.sql`
   - `importar-banco-na-vps.sh`

#### 2.2. Usando SCP (Linha de comando)

**Opção A - Windows PowerShell:**
```powershell
# Navegar até a pasta do projeto
cd C:\xampp3\htdocs\crm

# Enviar arquivos
scp banco-local-completo.sql root@185.217.125.72:~/crm/
scp importar-banco-na-vps.sh root@185.217.125.72:~/crm/
```

**Opção B - Git Bash (se instalado):**
```bash
cd /c/xampp3/htdocs/crm
scp banco-local-completo.sql root@185.217.125.72:~/crm/
scp importar-banco-na-vps.sh root@185.217.125.72:~/crm/
```

---

### PARTE 3: Importar na VPS

#### 3.1. Conectar via SSH

```bash
ssh root@185.217.125.72
```

#### 3.2. Verificar arquivos

```bash
cd ~/crm
ls -lh banco-local-completo.sql importar-banco-na-vps.sh
```

**Saída esperada:**
```
-rw-r--r-- 1 root root  XXX banco-local-completo.sql
-rw-r--r-- 1 root root  XXX importar-banco-na-vps.sh
```

#### 3.3. Tornar script executável

```bash
chmod +x importar-banco-na-vps.sh
```

#### 3.4. Executar importação

```bash
./importar-banco-na-vps.sh
```

**O que acontece:**
1. ✅ **Faz BACKUP automático do banco VPS atual**
2. ✅ Para containers Docker
3. ✅ Inicia apenas o MySQL
4. ✅ Aguarda MySQL ficar pronto
5. ✅ **APAGA o banco VPS atual**
6. ✅ **Importa banco local (substituição completa)**
7. ✅ Inicia todos os containers
8. ✅ Sistema fica idêntico ao local

**🔒 IMPORTANTE:** 
- Um backup do banco VPS atual é criado ANTES de qualquer alteração
- Arquivo de backup: `backup-vps-antes-importacao.sql`
- Você pode restaurar o backup se algo der errado

#### 3.5. Aguardar conclusão

O processo pode levar alguns minutos dependendo do tamanho do banco.

---

## ✅ Verificação Pós-Importação

### No VPS, execute:

```bash
# Verificar status dos containers
docker ps

# Verificar logs do backend
docker logs crm-backend --tail 30

# Verificar logs do frontend  
docker logs crm-frontend --tail 30

# Testar conexão com banco
docker exec -i crm-mysql mysql -u protecar -pprotecar123 protecar_crm -e "SELECT COUNT(*) as total_leads FROM leads;"
```

### Teste no navegador:

- **Admin:** http://185.217.125.72:3000/admin/login
- **Indicador:** http://185.217.125.72:3000/indicador/login
- **CRM:** http://185.217.125.72:3000/crm

**Use as mesmas credenciais do seu banco local!**

---

## 🔄 Sincronização Recorrente

Para sincronizar novamente no futuro:

### 1. No Windows (Local):
```cmd
exportar-banco-local.bat
```

### 2. Transferir novo dump:
```powershell
scp banco-local-completo.sql root@185.217.125.72:~/crm/
```

### 3. Na VPS:
```bash
./importar-banco-na-vps.sh
```

Pronto! Banco atualizado.

---

## 🆘 Resolução de Problemas

### Problema: Erro ao exportar localmente

**Sintoma:** Script falha na exportação

**Solução:**
```cmd
# Verificar se XAMPP está rodando
# Abrir XAMPP Control Panel
# Iniciar MySQL se parado

# Testar conexão manual
C:\xampp3\mysql\bin\mysql.exe -u root -e "SELECT 1;"
```

### Problema: Erro ao transferir arquivo

**Sintoma:** SCP falha ou nega acesso

**Solução:**
```bash
# Verificar conexão SSH primeiro
ssh root@185.217.125.72 "echo Conexão OK"

# Se falhar, verificar credenciais
# Ou usar WinSCP com interface gráfica
```

### Problema: Erro ao importar na VPS

**Sintoma:** Script falha ao importar

**Solução:**
```bash
# Verificar se arquivo foi transferido completamente
cd ~/crm
ls -lh banco-local-completo.sql

# Verificar MySQL no container
docker exec crm-mysql mysqladmin ping -h localhost -u root -proot123

# Tentar importação manual
docker-compose down
docker-compose up -d mysql
sleep 15
docker exec -i crm-mysql mysql -u root -proot123 < banco-local-completo.sql
docker-compose up -d
```

### Problema: Containers não iniciam após importação

**Sintoma:** docker ps não mostra containers

**Solução:**
```bash
# Ver logs para identificar erro
docker-compose logs

# Reiniciar tudo
docker-compose down
docker-compose up -d

# Verificar status
docker ps
```

---

## 📊 Informações Técnicas

### Banco de Dados Local (XAMPP)
- **Software:** MariaDB 10.4.32
- **Caminho:** C:\xampp3\mysql\
- **Usuário:** root
- **Senha:** (vazia)
- **Database:** protecar_crm

### Banco de Dados VPS (Docker)
- **Software:** MySQL 8.0
- **Container:** crm-mysql
- **Usuário root:** root / root123
- **Usuário app:** protecar / protecar123
- **Database:** protecar_crm
- **Porta:** 3306

### Compatibilidade

O script garante compatibilidade entre:
- MariaDB 10.4 (local) → MySQL 8.0 (VPS)
- Charset: utf8mb4
- Collation: utf8mb4_unicode_ci

---

## 💡 Dicas Importantes

1. **Backup automático:**
   - O script FAZ BACKUP automaticamente antes de importar
   - Não é necessário fazer backup manual
   - Backup salvo em: `backup-vps-antes-importacao.sql`
   - **Guarde este arquivo em local seguro!**

2. **Verificar tamanho do arquivo:**
   - Se o banco for muito grande (>100MB), a transferência pode demorar
   - Considere compactar: `gzip banco-local-completo.sql`

3. **Manter .env atualizado:**
   - O .env na VPS não é sobrescrito
   - Se mudou configurações, atualize manualmente

4. **Confirmação obrigatória:**
   - O script pede confirmação DUAS vezes
   - É necessário digitar 'sim' para continuar
   - Isso evita substituições acidentais

5. **Credenciais preservadas:**
   - Todos os usuários do banco local vêm junto
   - Senhas são mantidas (são hashes)
   - **Use as mesmas credenciais do banco local na VPS**

6. **Primeira importação:**
   - Na primeira vez, pode demorar mais
   - Aguarde pacientemente a conclusão
   - O script mostra o progresso em tempo real

---

## 🎯 Resumo Rápido

```
┌─────────────────────────────────────────┐
│  WINDOWS (Local)                        │
│  └─ exportar-banco-local.bat           │
│     └─ Gera: banco-local-completo.sql  │
└─────────────────┬───────────────────────┘
                  │ scp / WinSCP
                  ↓
┌─────────────────────────────────────────┐
│  VPS (185.217.125.72)                   │
│  └─ importar-banco-na-vps.sh           │
│     └─ Importa no Docker               │
└─────────────────────────────────────────┘
```

**3 passos para sincronizar:**

```cmd
REM 1. Local (Windows) - Exportar
exportar-banco-local.bat

REM 2. Local (Windows) - Transferir
scp banco-local-completo.sql root@185.217.125.72:~/crm/
scp importar-banco-na-vps.sh root@185.217.125.72:~/crm/

REM 3. VPS (Linux) - Importar (com backup automático)
ssh root@185.217.125.72
cd ~/crm && chmod +x importar-banco-na-vps.sh && ./importar-banco-na-vps.sh
```

**⚠️ ATENÇÃO:** O passo 3 irá:
- ✅ Fazer backup automático do banco VPS
- ⚠️ APAGAR completamente o banco VPS atual
- ✅ SUBSTITUIR pelo banco local
- ✅ Salvar backup para restauração se necessário

---

## 📞 Suporte

Se após seguir este guia você ainda tiver problemas:

1. Verifique os logs:
   ```bash
   docker logs crm-backend --tail 50
   docker logs crm-mysql --tail 50
   ```

2. Execute o diagnóstico:
   ```bash
   ./diagnostico-vps.sh
   ```

3. Consulte o guia de problemas:
   ```bash
   cat GUIA-RESOLUCAO-PROBLEMAS-VPS.md
   ```

---

**Última atualização:** 30/01/2025  
**Versão:** 1.0
