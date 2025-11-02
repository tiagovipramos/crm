# 🚗 CRM Protecar - Sistema de Gestão de Vendas

Sistema completo de gestão de relacionamento com clientes para proteção veicular, com integração WhatsApp, desenvolvido com Next.js, TypeScript e MySQL.

## 📋 Sobre o Sistema

O **CRM Protecar** é um sistema web full-stack para gestão de vendas de proteção veicular, com interface intuitiva inspirada no WhatsApp Web. Centraliza toda a comunicação, propostas e acompanhamento de leads em uma plataforma integrada.

## ✨ Características Principais

- 💬 **Chat Integrado** - Interface estilo WhatsApp com mensagens em tempo real
- 📊 **Funil de Vendas** - Visualização Kanban drag-and-drop
- 📄 **Gestão de Propostas** - Criação e acompanhamento automatizado
- 📅 **Agenda Inteligente** - Tarefas e lembretes automáticos
- 👥 **Multi-usuário** - Consultores, Admin e Indicadores
- 🔐 **Segurança** - Autenticação JWT, senhas criptografadas
- 🐳 **Dockerizado** - Deploy simplificado com Docker Compose
- 🎮 **Gamificação** - Sistema de lootbox e recompensas

## 🛠️ Stack Tecnológica

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- TailwindCSS
- Zustand (State Management)
- Socket.IO (Real-time)

**Backend:**
- Node.js 20 + Express
- TypeScript
- MySQL 8.0
- JWT Authentication
- Socket.IO

**Infrastructure:**
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Let's Encrypt (SSL)

## 🚀 Início Rápido

### Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Git

### Instalação (Desenvolvimento)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/crm-protecar.git
cd crm-protecar

# 2. Configure o ambiente
cp backend/.env.example backend/.env.development
# Edite backend/.env.development se necessário

# 3. Torne os scripts executáveis (Linux/Mac)
chmod +x scripts/*.sh

# 4. Inicie o sistema
./scripts/start.sh

# 5. Execute as migrations
./scripts/migrate.sh

# 6. (Opcional) Popular dados de teste
./scripts/seed.sh
```

**Acesse:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- MySQL: localhost:3306

### Credenciais Padrão

**Admin:**
- Email: `admin@protecar.com`
- Senha: `admin123`

**Consultor de Teste:**
- Email: `carlos@protecar.com`
- Senha: `123456`

## 📦 Scripts Disponíveis

```bash
./scripts/start.sh          # Iniciar sistema
./scripts/stop.sh           # Parar sistema
./scripts/restart.sh        # Reiniciar
./scripts/logs.sh           # Ver logs
./scripts/migrate.sh        # Executar migrations
./scripts/seed.sh           # Popular dados de teste
./scripts/backup-db.sh      # Backup do banco
./scripts/restore-db.sh     # Restaurar backup
./scripts/health-check.sh   # Verificar saúde
./scripts/update.sh         # Atualizar sistema
./scripts/cleanup.sh        # Limpar recursos Docker
```

Ver documentação completa em [scripts/README.md](scripts/README.md)

## 🎯 Módulos do Sistema

### 1. 💬 Chat (WhatsApp)
- Lista de conversas organizada
- Interface idêntica ao WhatsApp Web
- Mensagens em tempo real via Socket.IO
- Templates rápidos de mensagens
- Status de leitura
- Envio de mídia (imagens, vídeos, áudios, documentos)

### 2. 📊 Funil de Vendas
- Visualização Kanban drag-and-drop
- 7 etapas customizáveis
- Cards informativos com dados do lead
- Estatísticas por etapa
- Filtros e pesquisa

### 3. 📄 Propostas
- Criação de propostas personalizadas
- 3 tipos de planos (Básico, Completo, Premium)
- Envio automático via WhatsApp
- Acompanhamento de status
- Estatísticas de conversão

### 4. 📅 Agenda & Tarefas
- Lista de tarefas pendentes
- Tarefas de hoje destacadas
- Lembretes automáticos
- Vinculação com leads
- Notificações push

### 5. 👥 Gestão de Indicadores
- Cadastro de parceiros indicadores
- Comissões por venda
- Relatórios de performance
- Sistema de gamificação

### 6. 🎮 Gamificação (Lootbox)
- Sistema de recompensas
- Lootboxes por meta atingida
- Prêmios configuráveis
- Ranking de consultores

### 7. ⚙️ Painel Admin
- Gestão de usuários e consultores
- Dashboard com estatísticas globais
- Relatórios de vendas
- Configurações do sistema
- Visão geral de chats

## 🏗️ Estrutura do Projeto

```
crm-protecar/
├── app/                    # Frontend Next.js (App Router)
├── components/             # Componentes React
├── backend/               # Backend API
│   ├── src/              # Código TypeScript
│   └── migrations/       # Migrations SQL
├── scripts/              # Scripts de automação
├── docker/               # Configurações Docker
├── docs/                 # Documentação
└── types/                # TypeScript types
```

## 📚 Documentação

- [Guia de Deploy (DEPLOY.md)](DEPLOY.md) - Deploy completo em VPS Linux
- [Arquitetura (docs/ARQUITETURA.md)](docs/ARQUITETURA.md) - Arquitetura técnica
- [Scripts (scripts/README.md)](scripts/README.md) - Documentação dos scripts
- [Migrations (backend/migrations/README.md)](backend/migrations/README.md) - Ordem de migrations

## 🐳 Deploy em Produção

### Deploy Rápido em VPS

```bash
# 1. No servidor VPS (Ubuntu/Debian)
cd /opt
sudo git clone https://github.com/seu-usuario/crm-protecar.git
cd crm-protecar

# 2. Configurar ambiente
cp backend/.env.example backend/.env.production
vim backend/.env.production  # Configure senhas e JWT_SECRET

# 3. Iniciar em produção
chmod +x scripts/*.sh
./scripts/start.sh prod

# 4. Configurar Nginx + SSL
# Ver DEPLOY.md para instruções completas
```

### Requisitos Mínimos do Servidor

- **CPU:** 2 vCPUs
- **RAM:** 4GB
- **Storage:** 20GB SSD
- **OS:** Ubuntu 20.04+ ou Debian 11+

Ver [DEPLOY.md](DEPLOY.md) para guia completo de deploy.

## 🔒 Segurança

- ✅ Autenticação JWT
- ✅ Senhas hash com bcrypt
- ✅ CORS configurado
- ✅ SQL Injection prevention (prepared statements)
- ✅ Variáveis de ambiente para secrets
- ✅ Containers com usuário não-root
- 🔄 Rate limiting (TODO)
- 🔄 Input validation (TODO)

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
npm test

# E2E
npm run test:e2e
```

## 📈 Performance

- Server-side rendering com Next.js
- Code splitting automático
- Image optimization
- Connection pooling MySQL
- Caching de assets
- Gzip compression (Nginx)

## 🔄 Backup e Recuperação

```bash
# Criar backup
./scripts/backup-db.sh

# Restaurar backup
./scripts/restore-db.sh backups/backup_XXXXXX.sql.gz

# Backup automático (cron)
# Ver DEPLOY.md
```

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Ver [LICENSE](LICENSE) para mais informações.

## 🆘 Suporte

- 📖 Documentação: Ver pasta `docs/`
- 🐛 Reportar bug: Abrir issue no GitHub
- 💬 Discussões: GitHub Discussions

## 🗺️ Roadmap

### Curto Prazo
- [ ] Testes unitários e E2E
- [ ] Rate limiting
- [ ] Input validation
- [ ] Logs estruturados

### Médio Prazo
- [ ] Redis para caching
- [ ] Queue system para emails
- [ ] Notificações push
- [ ] Relatórios avançados

### Longo Prazo
- [ ] Mobile app (React Native)
- [ ] Multi-tenancy
- [ ] Integração com CRMs externos
- [ ] IA para sugestões de vendas

## 👥 Equipe

Desenvolvido para consultores de proteção veicular.

## 📞 Contato

- Website: [protecar.com.br](https://protecar.com.br)
- Email: contato@protecar.com.br

---

**🚗 CRM Protecar - Simplifique suas vendas, maximize seus resultados!**

⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!
