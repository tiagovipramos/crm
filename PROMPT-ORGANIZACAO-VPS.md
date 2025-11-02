# 🚀 PROMPT PARA ORGANIZAÇÃO DO CRM PARA DEPLOY EM VPS LINUX

## 📋 CONTEXTO DO PROJETO

Este sistema CRM foi desenvolvido parcialmente usando XAMPP (Windows) e depois Docker, resultando em configurações conflitantes que causarão problemas ao fazer deploy em VPS Linux. Preciso que você organize completamente o projeto para um deploy limpo e profissional.

## 🎯 OBJETIVOS PRINCIPAIS

1. **Padronizar Banco de Dados**: O código usa MySQL mas o `.env.example` menciona PostgreSQL
2. **Eliminar Dependências Windows**: Remover todos os scripts `.bat` e dependências do XAMPP
3. **Dockerizar Completamente**: Criar configuração Docker/Docker Compose funcional
4. **Scripts Linux**: Criar scripts `.sh` para iniciar, parar e gerenciar o projeto em Linux
5. **Organizar Migrations**: Consolidar e ordenar todas as migrations SQL
6. **Documentar Deploy**: Criar guia completo de deploy para VPS Linux (Ubuntu/Debian)
7. **Corrigir Bugs**: Identificar e corrigir potenciais bugs de compatibilidade

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. Conflito de Banco de Dados
- **Arquivo**: `backend/.env.example`
  - Configurado para PostgreSQL (DATABASE_URL=postgresql://...)
- **Arquivo**: `backend/src/config/database.ts`
  - Código usa MySQL (mysql2/promise)
- **Problema**: Inconsistência total entre configuração e código
- **Solução Necessária**: Padronizar tudo para MySQL

### 2. Scripts Windows Incompatíveis
- **Arquivos**: `INICIAR-PROJETO.bat`, `PARAR-PROJETO.bat`
  - Usam comandos Windows específicos (tasklist, xampp3 paths)
- **Problema**: Não funcionam em Linux
- **Solução Necessária**: Criar equivalentes Linux (.sh)

### 3. Migrations Desorganizadas
- **Pasta**: `backend/migrations/`
  - 20+ arquivos SQL sem ordem clara
  - Alguns para PostgreSQL, outros para MySQL
  - Nomes inconsistentes
- **Problema**: Impossível saber a ordem correta de execução
- **Solução Necessária**: Renomear com prefixos numerados (001_, 002_, etc.)

### 4. Dependências de Desenvolvimento
- Scripts de desenvolvimento misturados com produção
- Caminhos absolutos do Windows hardcoded
- Falta configuração de ambiente de produção

## ✅ TAREFAS QUE VOCÊ DEVE EXECUTAR

### FASE 1: Padronização do Banco de Dados
- [ ] Atualizar `backend/.env.example` para usar MySQL consistentemente
- [ ] Criar `backend/.env.development` com configurações de dev MySQL
- [ ] Criar `backend/.env.production` com placeholders para VPS
- [ ] Verificar todas as migrations e converter syntax PostgreSQL para MySQL (se existir)
- [ ] Garantir que `database.ts` está otimizado para MySQL

### FASE 2: Dockerização Completa
- [ ] Criar `docker-compose.yml` na raiz do projeto com:
  - Serviço MySQL 8.0
  - Serviço Backend (Node.js/TypeScript)
  - Serviço Frontend (Next.js)
  - Network interna
  - Volumes persistentes para MySQL
  - Volumes para uploads
- [ ] Criar `Dockerfile` para o Backend:
  - Multi-stage build (build + production)
  - Node.js 20 LTS Alpine
  - Copiar apenas arquivos necessários
  - Instalar ffmpeg para WhatsApp
  - Configurar healthcheck
- [ ] Criar `Dockerfile` para o Frontend:
  - Multi-stage build
  - Next.js otimizado para produção
  - Variáveis de ambiente corretas
- [ ] Criar `.dockerignore` adequado

### FASE 3: Scripts Linux
- [ ] Criar `scripts/start.sh`: Iniciar todo o projeto com Docker Compose
- [ ] Criar `scripts/stop.sh`: Parar projeto gracefully
- [ ] Criar `scripts/logs.sh`: Ver logs de todos os serviços
- [ ] Criar `scripts/backup-db.sh`: Fazer backup do MySQL
- [ ] Criar `scripts/restore-db.sh`: Restaurar backup
- [ ] Criar `scripts/migrate.sh`: Executar migrations
- [ ] Criar `scripts/seed.sh`: Popular banco com dados iniciais
- [ ] Tornar todos executáveis (chmod +x)

### FASE 4: Organização de Migrations
- [ ] Renomear migrations com prefixo numérico sequencial:
  - `001_create-database.sql`
  - `002_schema-mysql.sql`
  - `003_adicionar-coluna-role.sql`
  - etc.
- [ ] Criar arquivo `backend/migrations/README.md` documentando a ordem
- [ ] Criar script que executa migrations em ordem (`scripts/migrate.sh`)
- [ ] Garantir idempotência (migrations podem rodar múltiplas vezes sem erro)

### FASE 5: Configuração de Ambiente
- [ ] Criar arquivo `.env.example` na raiz com TODAS as variáveis necessárias
- [ ] Documentar cada variável de ambiente
- [ ] Criar validação de variáveis obrigatórias no startup
- [ ] Separar configs de desenvolvimento e produção claramente

### FASE 6: Documentação de Deploy
- [ ] Criar `DEPLOY.md` com:
  - Requisitos do servidor (RAM, CPU, storage)
  - Instalação do Docker + Docker Compose
  - Clone e configuração do projeto
  - Primeiro deploy passo a passo
  - Configuração de SSL/HTTPS (Let's Encrypt)
  - Configuração de Nginx como reverse proxy
  - Processo de backup e restore
  - Monitoramento e logs
  - Troubleshooting comum
- [ ] Criar `docs/ARQUITETURA.md` explicando a estrutura
- [ ] Atualizar `README.md` principal com instruções de deploy

### FASE 7: Otimizações para Produção
- [ ] Adicionar `PM2` ou similar para gerenciar processo Node
- [ ] Configurar logs estruturados (winston/pino)
- [ ] Adicionar healthchecks em todos os serviços
- [ ] Configurar restart automático em caso de crash
- [ ] Adicionar rate limiting nas APIs
- [ ] Configurar CORS corretamente para produção
- [ ] Otimizar images Docker (multi-stage, Alpine)
- [ ] Adicionar `.env` ao `.gitignore` (se não estiver)

### FASE 8: Scripts de Manutenção
- [ ] Script para atualizar sistema (`scripts/update.sh`)
- [ ] Script para limpar volumes antigos (`scripts/cleanup.sh`)
- [ ] Script para verificar saúde do sistema (`scripts/health-check.sh`)
- [ ] Script para restart seguro (`scripts/restart.sh`)

### FASE 9: Segurança
- [ ] Gerar JWT_SECRET forte automaticamente se não existir
- [ ] Configurar MySQL com senha forte
- [ ] Remover credenciais padrão de desenvolvimento
- [ ] Adicionar headers de segurança no Express
- [ ] Configurar rate limiting
- [ ] Adicionar validação de inputs
- [ ] Documentar práticas de segurança

### FASE 10: Testes e Validação
- [ ] Testar startup completo com Docker Compose
- [ ] Testar todos os scripts criados
- [ ] Verificar se migrations rodam corretamente
- [ ] Testar conexão entre frontend e backend
- [ ] Verificar uploads de arquivos
- [ ] Testar integração WhatsApp
- [ ] Documentar casos de teste

## 📝 ESTRUTURA FINAL ESPERADA

```
crm/
├── docker-compose.yml              # Orquestração de serviços
├── .env.example                    # Template de variáveis
├── .dockerignore                   # Arquivos ignorados no build
├── README.md                       # Documentação principal (atualizada)
├── DEPLOY.md                       # Guia de deploy VPS
├── 
├── scripts/                        # Scripts de automação Linux
│   ├── start.sh                    # Iniciar projeto
│   ├── stop.sh                     # Parar projeto
│   ├── restart.sh                  # Reiniciar
│   ├── logs.sh                     # Ver logs
│   ├── migrate.sh                  # Executar migrations
│   ├── seed.sh                     # Popular dados
│   ├── backup-db.sh                # Backup MySQL
│   ├── restore-db.sh               # Restore backup
│   ├── update.sh                   # Atualizar sistema
│   ├── cleanup.sh                  # Limpar volumes
│   └── health-check.sh             # Verificar saúde
│
├── docs/                           # Documentação adicional
│   ├── ARQUITETURA.md              # Arquitetura do sistema
│   ├── API.md                      # Documentação de APIs
│   └── TROUBLESHOOTING.md          # Resolução de problemas
│
├── backend/
│   ├── Dockerfile                  # Build do backend
│   ├── .env.example                # Variáveis do backend
│   ├── .dockerignore               # Ignorar no build
│   │
│   ├── migrations/                 # Migrations organizadas
│   │   ├── README.md               # Ordem e descrição
│   │   ├── 001_create-database.sql
│   │   ├── 002_schema-mysql.sql
│   │   ├── 003_adicionar-role.sql
│   │   └── ...
│   │
│   └── src/
│       ├── server.ts
│       └── config/
│           ├── database.ts         # Conexão MySQL otimizada
│           └── env.ts              # Validação de env vars
│
├── frontend/                       # Ou mover arquivos do app/
│   ├── Dockerfile                  # Build do frontend
│   ├── .env.example
│   └── ...
│
└── nginx/                          # Configuração nginx (opcional)
    └── nginx.conf                  # Reverse proxy
```

## 🎯 CRITÉRIOS DE SUCESSO

Ao final, o projeto deve:
1. ✅ Iniciar completamente com um único comando: `./scripts/start.sh`
2. ✅ Ter banco de dados consistente (MySQL)
3. ✅ Funcionar 100% em Linux (Ubuntu/Debian)
4. ✅ Ter documentação completa de deploy
5. ✅ Migrations ordenadas e documentadas
6. ✅ Variáveis de ambiente validadas
7. ✅ Sem dependências Windows
8. ✅ Pronto para produção em VPS

## 💡 INSTRUÇÕES IMPORTANTES

1. **Não quebre funcionalidades existentes**: Ao refatorar, mantenha a compatibilidade
2. **Documente mudanças**: Cada alteração significativa deve ser documentada
3. **Use boas práticas**: Docker multi-stage, .dockerignore, health checks
4. **Pense em manutenção**: Scripts devem ser fáceis de entender e modificar
5. **Segurança em primeiro lugar**: Nunca commitar secrets, usar senhas fortes
6. **Teste cada mudança**: Verificar se não quebrou nada antes de prosseguir

## 🚦 COMEÇAR AGORA

Por favor, execute as tarefas na ordem apresentada (FASE 1 a FASE 10), verificando cada item da checklist. Após completar cada fase, apresente um resumo do que foi feito antes de prosseguir para a próxima fase.

**IMPORTANTE**: Mantenha-me informado do progresso a cada 5 tarefas completadas, para que eu possa revisar e aprovar antes de continuar.

Está pronto para começar? Inicie pela FASE 1 (Padronização do Banco de Dados).
