# 🏗️ Arquitetura do Sistema - CRM Protecar

Documentação técnica da arquitetura do sistema CRM Protecar.

## 📊 Visão Geral

O CRM Protecar é um sistema full-stack moderno para gestão de relacionamento com clientes na área automotiva, com foco em seguros veiculares.

### Stack Tecnológica

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- Zustand (State Management)
- Socket.IO Client

**Backend:**
- Node.js 20
- Express.js
- TypeScript
- Socket.IO
- MySQL 8.0
- JWT Authentication

**Infrastructure:**
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Let's Encrypt (SSL)

## 🗂️ Estrutura de Diretórios

```
crm-protecar/
├── app/                          # Frontend Next.js (App Router)
│   ├── layout.tsx               # Layout raiz
│   ├── page.tsx                 # Página inicial
│   ├── admin/                   # Área administrativa
│   ├── crm/                     # Área CRM
│   └── indicador/               # Área de indicadores
│
├── components/                   # Componentes React
│   ├── views/                   # Views principais
│   └── admin/                   # Componentes admin
│
├── backend/                      # Backend API
│   ├── src/
│   │   ├── server.ts           # Entry point
│   │   ├── config/             # Configurações
│   │   ├── controllers/        # Controllers
│   │   ├── middleware/         # Middlewares
│   │   ├── routes/             # Rotas
│   │   └── services/           # Serviços
│   ├── migrations/             # Migrations SQL
│   └── uploads/                # Arquivos enviados
│
├── scripts/                      # Scripts de automação
├── docker/                       # Configurações Docker
├── docs/                         # Documentação
└── types/                        # TypeScript types
```

## 🔄 Fluxo de Dados

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │  HTTP   │              │  SQL    │             │
│   Next.js   ├────────►│   Express    ├────────►│    MySQL    │
│  (Frontend) │◄────────┤   (Backend)  │◄────────┤ (Database)  │
│             │ JSON    │              │ Results │             │
└──────┬──────┘         └──────┬───────┘         └─────────────┘
       │                       │
       │    WebSocket          │
       └───────────────────────┘
            (Real-time)
```

## 🔐 Autenticação e Autorização

### Fluxo de Login

1. Usuário envia credenciais (POST /api/auth/login)
2. Backend valida no MySQL
3. Gera JWT token
4. Frontend armazena token
5. Requisições subsequentes incluem token no header

### Níveis de Acesso

- **Admin:** Acesso total ao sistema
- **Consultor:** Gerencia leads e propostas
- **Indicador:** Visualiza comissões e estatísticas

## 🗄️ Modelo de Dados

### Principais Tabelas

#### consultores
```sql
- id (VARCHAR 36)
- nome (VARCHAR 255)
- email (VARCHAR 255) UNIQUE
- senha (VARCHAR 255) hash bcrypt
- telefone (VARCHAR 20)
- avatar (TEXT)
- role (VARCHAR 20)
- ativo (BOOLEAN)
- data_criacao (TIMESTAMP)
```

#### leads
```sql
- id (VARCHAR 36)
- nome (VARCHAR 255)
- telefone (VARCHAR 20)
- email (VARCHAR 255)
- cidade (VARCHAR 100)
- modelo_veiculo (VARCHAR 100)
- status (VARCHAR 50)
- consultor_id (VARCHAR 36) FK
- origem (VARCHAR 50)
- tags (JSON)
- data_criacao (TIMESTAMP)
```

#### mensagens
```sql
- id (VARCHAR 36)
- lead_id (VARCHAR 36) FK
- consultor_id (VARCHAR 36) FK
- conteudo (TEXT)
- tipo (VARCHAR 20)
- remetente (VARCHAR 20)
- timestamp (TIMESTAMP)
```

#### propostas
```sql
- id (VARCHAR 36)
- lead_id (VARCHAR 36) FK
- consultor_id (VARCHAR 36) FK
- plano (VARCHAR 20)
- valor_mensal (DECIMAL)
- status (VARCHAR 20)
- data_envio (TIMESTAMP)
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário logado

### Leads
- `GET /api/leads` - Listar leads
- `POST /api/leads` - Criar lead
- `GET /api/leads/:id` - Detalhes do lead
- `PUT /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Deletar lead

### Mensagens
- `GET /api/mensagens/:leadId` - Mensagens do lead
- `POST /api/mensagens` - Enviar mensagem

### Propostas
- `GET /api/propostas` - Listar propostas
- `POST /api/propostas` - Criar proposta
- `PUT /api/propostas/:id` - Atualizar proposta

### Admin
- `GET /api/admin/consultores` - Listar consultores
- `POST /api/admin/consultores` - Criar consultor
- `GET /api/admin/dashboard` - Estatísticas

## 🔄 Estado da Aplicação (Frontend)

### Stores Zustand

#### useCRMStore
```typescript
{
  user: User | null,
  leads: Lead[],
  selectedLead: Lead | null,
  mensagens: Mensagem[],
  // ... actions
}
```

#### useAdminStore
```typescript
{
  consultores: Consultor[],
  stats: Stats,
  // ... actions
}
```

## 🐳 Arquitetura Docker

```yaml
Services:
  - mysql:       Database (port 3306)
  - backend:     API REST (port 3001)
  - frontend:    Next.js (port 3000)

Networks:
  - protecar-network (bridge)

Volumes:
  - mysql_data:           Persistência do banco
  - backend_node_modules: Cache de dependências
  - frontend_node_modules: Cache de dependências
```

## 🔒 Segurança

### Implementadas

1. **JWT Authentication:** Tokens seguros para sessões
2. **Bcrypt:** Hash de senhas (10 rounds)
3. **CORS:** Configurado para origins permitidas
4. **SQL Injection:** Uso de prepared statements
5. **Rate Limiting:** Proteção contra brute force (TODO)
6. **Helmet:** Headers de segurança HTTP (TODO)
7. **Input Validation:** Sanitização de inputs (TODO)

### Boas Práticas

- Secrets em variáveis de ambiente
- Usuário não-root nos containers
- Volumes de dados persistentes separados
- Logs estruturados para auditoria

## 🚀 Performance

### Otimizações Frontend

- **Server Components:** Renderização no servidor
- **Code Splitting:** Carregamento sob demanda
- **Image Optimization:** Next.js Image
- **Caching:** HTTP caching headers

### Otimizações Backend

- **Connection Pool:** Pool de conexões MySQL
- **Async/Await:** Operações não bloqueantes
- **Indexes:** Indexes em colunas frequentes
- **Pagination:** Limites em queries grandes

### Otimizações Database

- **InnoDB:** Engine otimizada
- **Charset utf8mb4:** Suporte completo Unicode
- **Buffer Pool:** Configurado para RAM disponível
- **Query Cache:** Desabilitado (MySQL 8.0)

## 📡 WebSocket (Real-time)

### Eventos

**Client → Server:**
- `join-room` - Entrar em sala de chat
- `send-message` - Enviar mensagem
- `typing` - Status de digitação

**Server → Client:**
- `new-message` - Nova mensagem recebida
- `user-typing` - Usuário digitando
- `lead-updated` - Lead atualizado

## 🔄 CI/CD (Futuro)

### Pipeline Proposto

```
┌─────────────┐
│  Git Push   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Run Tests  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Build     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Deploy    │
└─────────────┘
```

## 📊 Monitoramento (Futuro)

### Métricas Sugeridas

- Uptime dos serviços
- Tempo de resposta da API
- Taxa de erro
- Uso de CPU/RAM
- Conexões MySQL ativas
- Tamanho do banco de dados

### Ferramentas Sugeridas

- Prometheus + Grafana
- Sentry (Error Tracking)
- LogTail (Logs)

## 🔮 Roadmap Técnico

### Curto Prazo
- [ ] Testes unitários (Jest)
- [ ] Testes E2E (Playwright)
- [ ] Rate limiting
- [ ] Input validation

### Médio Prazo
- [ ] Redis para caching
- [ ] Queue system (Bull)
- [ ] CDN para assets
- [ ] Elasticsearch para busca

### Longo Prazo
- [ ] Microserviços
- [ ] Kubernetes
- [ ] Multi-tenancy
- [ ] Mobile app (React Native)

## 📚 Referências

- [Next.js Docs](https://nextjs.org/docs)
- [Express.js](https://expressjs.com/)
- [MySQL 8.0](https://dev.mysql.com/doc/)
- [Docker](https://docs.docker.com/)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

**Última atualização:** 2025-02-01
