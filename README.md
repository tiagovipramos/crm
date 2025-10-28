# 🚗 Protecar CRM

Sistema completo de gestão de vendas de proteção veicular com integração WhatsApp, desenvolvido com Next.js 15, TypeScript, Tailwind CSS e Zustand.

## 📋 Sobre o Sistema

O **Protecar CRM** é um sistema web completo para gestão de vendas de proteção veicular, com interface inspirada no WhatsApp Web. O sistema centraliza toda a comunicação de vendas e acompanhamento de leads, permitindo que consultores gerenciem conversas, propostas e o funil de vendas de forma visual e eficiente.

### ✨ Características Principais

- ✅ **Sem estrutura hierárquica** - Todos os consultores têm acesso igual ao sistema
- ✅ **Interface estilo WhatsApp Web** - Familiar e intuitiva
- ✅ **Integração WhatsApp via QR Code** - Conexão simulada (API não oficial)
- ✅ **Gestão visual de leads** - Kanban drag-and-drop
- ✅ **Sistema de propostas** - Criação e envio automatizado
- ✅ **Agenda inteligente** - Lembretes e tarefas automáticas
- ✅ **Automações** - Mensagens e ações automáticas
- ✅ **Templates de mensagens** - Agilize o atendimento

## 🎯 Módulos do Sistema

### 1. 💬 Chat (WhatsApp Inbox)
- Lista de conversas organizada por leads
- Interface idêntica ao WhatsApp Web
- Envio e recebimento de mensagens em tempo real
- Status de leitura e hora das mensagens
- Filtros: todos, não lidos, abertos, convertidos
- Pesquisa de conversas
- Badges de mensagens não lidas
- Templates de mensagens rápidas

### 2. 📊 Funil de Vendas (Kanban)
- Visualização visual do pipeline de vendas
- 7 etapas configuráveis:
  - Novo Lead
  - Primeiro Contato
  - Proposta Enviada
  - Aguardando Retorno
  - Vistoria Agendada
  - Convertido
  - Perdido
- Drag-and-drop entre colunas
- Cards informativos com dados do lead
- Botão rápido para abrir chat
- Estatísticas por etapa

### 3. 📄 Propostas
- Criação de propostas personalizadas
- 3 tipos de planos:
  - **Básico**: R$ 150/mês (Franquia R$ 2.000)
  - **Completo**: R$ 250/mês (Franquia R$ 1.500)
  - **Premium**: R$ 350/mês (Franquia R$ 1.000)
- Envio automático via WhatsApp
- Acompanhamento de status
- Estatísticas de conversão

### 4. 📅 Agenda
- Lista de tarefas pendentes
- Tarefas de hoje destacadas
- Lembretes automáticos
- Tipos de tarefa:
  - Retornar contato
  - Enviar proposta
  - Acompanhar vistoria
  - Follow-up
- Vinculação com leads
- Conclusão e exclusão de tarefas

### 5. ⚙️ Configurações
- **WhatsApp**: Conexão via QR Code (simulado)
- **Planos**: Visualização dos planos disponíveis
- **Templates**: Mensagens pré-definidas
- **Automações**: Regras automáticas configuráveis
- **Geral**: Personalização do sistema

## 🚀 Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **Lucide React** - Ícones
- **Framer Motion** - Animações

## 📦 Instalação

### Windows
```bash
# Clone o repositório
git clone https://github.com/tiagovipramos/crm.git

# Entre na pasta do projeto
cd crm

# Instale as dependências
npm install

# Use o script de inicialização
INICIAR-PROJETO.bat
```

### Linux
```bash
# Clone o repositório
git clone https://github.com/tiagovipramos/crm.git

# Entre na pasta do projeto
cd crm

# Instale as dependências
npm install

# Dê permissão de execução aos scripts
chmod +x iniciar-projeto.sh parar-projeto.sh
chmod +x backend/*.sh

# Use o script de inicialização
./iniciar-projeto.sh
```

📖 **Para instruções detalhadas de instalação no Linux**, consulte [DEPLOY-LINUX.md](DEPLOY-LINUX.md)

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## 👤 Contas de Demonstração

O sistema vem com 3 contas pré-configuradas:

### Consultor 1 - Carlos Silva
- **E-mail**: carlos@protecar.com
- **Senha**: 123456
- **Status WhatsApp**: Online
- **Leads**: 6 leads em diferentes etapas

### Consultor 2 - Ana Paula
- **E-mail**: ana@protecar.com
- **Senha**: 123456
- **Status WhatsApp**: Offline

### Consultor 3 - Roberto Lima
- **E-mail**: roberto@protecar.com
- **Senha**: 123456
- **Status WhatsApp**: Online

## 🎨 Design e UX

### Paleta de Cores
- **Primária**: #128C7E (Verde WhatsApp)
- **Secundária**: #075E54 (Verde escuro)
- **Background**: #ECE5DD (Bege claro)
- **Chat Consultor**: #D9FDD3 (Verde claro)
- **Chat Lead**: #FFFFFF (Branco)

### Layout
- **Header Superior**: Logo, status WhatsApp, perfil do consultor
- **Menu de Navegação**: Abas horizontais com badges
- **Área Principal**: Conteúdo específico de cada módulo
- **Design Responsivo**: Funciona em desktop e mobile

## 🔄 Automações Disponíveis

1. **Boas-vindas automático**
   - Evento: Novo lead
   - Ação: Enviar mensagem de boas-vindas

2. **Notificar proposta enviada**
   - Evento: Mudança de status para "Proposta Enviada"
   - Ação: Criar tarefa de follow-up

3. **Follow-up sem resposta 48h**
   - Evento: Sem resposta há 48 horas
   - Ação: Enviar mensagem de follow-up
   - Status: Inativa (exemplo)

4. **Agradecimento conversão**
   - Evento: Mudança de status para "Convertido"
   - Ação: Enviar mensagem de agradecimento

## 📁 Estrutura do Projeto

```
crm/
├── app/                      # Páginas Next.js
│   ├── page.tsx             # Tela de login
│   ├── layout.tsx           # Layout global
│   └── crm/                 # Área do CRM
│       ├── layout.tsx       # Layout do CRM
│       └── page.tsx         # Roteador de views
├── components/              # Componentes React
│   └── views/              # Views principais
│       ├── ChatView.tsx    # Módulo de Chat
│       ├── FunilView.tsx   # Módulo de Funil
│       ├── PropostasView.tsx
│       ├── AgendaView.tsx
│       └── ConfiguracoesView.tsx
├── store/                   # Gerenciamento de estado
│   └── useProtecarStore.ts # Store Zustand
├── types/                   # Tipos TypeScript
│   └── index.ts
├── data/                    # Dados mock
│   └── mockData.ts
├── hooks/                   # Custom hooks
│   └── useInitializeData.ts
└── lib/                     # Utilitários
    └── utils.ts
```

## 🔧 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Tela de login
- [x] Validação de credenciais
- [x] Sessão persistente
- [x] Logout

### ✅ Chat
- [x] Lista de conversas
- [x] Interface estilo WhatsApp
- [x] Envio de mensagens
- [x] Recebimento de mensagens (simulado)
- [x] Status de leitura
- [x] Filtros e pesquisa
- [x] Badges de não lidas

### ✅ Funil
- [x] Kanban visual
- [x] Drag and drop
- [x] 7 etapas configuráveis
- [x] Cards informativos
- [x] Estatísticas
- [x] Navegação rápida para chat

### ✅ Propostas
- [x] Listagem de propostas
- [x] Filtros por status
- [x] Cards com detalhes
- [x] Envio automatizado
- [x] Estatísticas de conversão

### ✅ Agenda
- [x] Lista de tarefas
- [x] Tarefas de hoje
- [x] Próximas tarefas
- [x] Conclusão de tarefas
- [x] Vinculação com leads

### ✅ Configurações
- [x] Conexão WhatsApp (simulada)
- [x] Visualização de planos
- [x] Templates de mensagens
- [x] Automações
- [x] Configurações gerais

## 🔮 Próximos Passos (Produção)

Para implementar em produção, você precisará:

1. **Backend Real**
   - API REST ou GraphQL
   - Banco de dados (PostgreSQL, MongoDB, etc.)
   - Autenticação JWT
   - WebSockets para tempo real

2. **Integração WhatsApp Real**
   - Venom Bot, Baileys ou WhatsApp Business API oficial
   - QR Code real
   - Webhook para receber mensagens
   - Gerenciamento de sessões

3. **Deploy**
   - Vercel, Netlify ou servidor próprio
   - Variáveis de ambiente
   - CDN para assets
   - Certificado SSL

4. **Segurança**
   - Rate limiting
   - Sanitização de inputs
   - CORS configurado
   - Backup de dados

## 🐧 Compatibilidade com Linux

O sistema é **100% compatível com Linux**! Foram criados scripts shell equivalentes a todos os scripts Windows.

### Documentação Linux
- 📖 [DEPLOY-LINUX.md](DEPLOY-LINUX.md) - Guia completo de instalação e deploy
- 📋 [COMPATIBILIDADE-LINUX.md](COMPATIBILIDADE-LINUX.md) - Relatório de compatibilidade

### Scripts Disponíveis
- `iniciar-projeto.sh` - Inicia frontend e backend
- `parar-projeto.sh` - Para todos os processos
- `backend/*.sh` - Scripts de migration e manutenção

### Sistemas Testados
- ✅ Ubuntu 20.04+
- ✅ Debian 10+
- ✅ Fedora/RHEL/CentOS
- ✅ Arch Linux

## 📝 Notas Importantes

- Este é um **sistema de demonstração** com dados mockados
- A integração WhatsApp é **simulada** - não envia mensagens reais
- **Multiplataforma**: Funciona em Windows, Linux e macOS
- Em produção, implemente validações de segurança
- Adicione testes unitários e E2E
- Configure CI/CD para deploys automáticos

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas features
- Enviar pull requests
- Melhorar a documentação

## 📄 Licença

Este projeto é livre para uso educacional e comercial.

---

**Desenvolvido com ❤️ para consultores de proteção veicular**

🚗 Protecar CRM - Simplifique suas vendas, maximize seus resultados!
