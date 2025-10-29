# Instruções: Escolher API WhatsApp (Oficial ou Não Oficial)

## 📋 Visão Geral

O sistema agora suporta **duas opções de API do WhatsApp**:

1. **API Não Oficial** (Baileys) - Gratuita, usa QR Code
2. **API Oficial** (WhatsApp Business API) - Mais estável, profissional

## 🚀 Instalação

### 1. Executar as Migrations

Execute o script de migration para adicionar as novas tabelas:

```bash
cd backend
executar-migration-tipo-api.bat
```

Ou manualmente no MySQL:

```sql
-- Migration 1: Adicionar coluna tipo_api_whatsapp
mysql -u root crm_vipseg < migrations/adicionar-tipo-api-whatsapp.sql

-- Migration 2: Criar tabela whatsapp_oficial_config
mysql -u root crm_vipseg < migrations/criar-tabela-whatsapp-oficial-config.sql
```

### 2. Reiniciar o Backend

Após executar as migrations, reinicie o backend:

```bash
npm run dev
```

## 🔧 Configuração

### API Não Oficial (Padrão)

1. Acesse **Configurações** no menu
2. Selecione **API Não Oficial**
3. Clique em **Conectar WhatsApp**
4. Leia o QR Code com seu celular
5. Pronto! ✅

**Características:**
- ✓ Gratuita
- ✓ Conexão via QR Code
- ✓ Todos os recursos disponíveis
- ✓ Sincronização de histórico
- ⚠️ Requer manter celular conectado à internet

### API Oficial

#### Pré-requisitos

Para usar a API Oficial, você precisa:

1. Uma conta **WhatsApp Business API** aprovada pela Meta
2. **Phone Number ID** do seu número WhatsApp Business
3. **Access Token** da API
4. **Webhook Verify Token** (você define)

#### Como Obter as Credenciais

1. Acesse [Meta for Developers](https://developers.facebook.com/)
2. Crie ou selecione seu aplicativo WhatsApp Business
3. Na seção **WhatsApp** > **API Setup**:
   - Copie o **Phone Number ID**
   - Gere um **Access Token** permanente
   - Defina um **Webhook Verify Token** (ex: `meu_token_seguro_123`)

#### Configuração no CRM

1. Acesse **Configurações** no menu
2. Selecione **API Oficial**
3. Clique em **Configurar Credenciais**
4. Preencha os campos:
   - **Phone Number ID**: Cole o ID copiado
   - **Access Token**: Cole o token gerado
   - **Webhook Verify Token**: Digite o mesmo token que você definiu
5. Clique em **Salvar Configuração**
6. Configure o webhook no Meta for Developers (veja abaixo)

**Características:**
- ✓ Mais estável
- ✓ Suporte oficial da Meta
- ✓ Webhooks nativos (mensagens em tempo real)
- ✓ Não requer celular conectado
- ⚠️ Pode ter custos (verifique com a Meta)

#### Configurar Webhook

No Meta for Developers, configure o webhook:

1. Vá em **WhatsApp** > **Configuration**
2. Clique em **Edit** na seção Webhook
3. Configure:
   - **Callback URL**: `https://seu-dominio.com/api/whatsapp/webhook-oficial`
   - **Verify Token**: O mesmo token que você definiu no CRM
4. Clique em **Verify and Save**
5. Inscreva-se nos eventos: `messages`

## 🔄 Alternar entre APIs

Você pode alternar entre as APIs a qualquer momento:

1. Acesse **Configurações**
2. Clique no card da API desejada
3. O sistema salvará sua escolha
4. Configure a nova API conforme necessário

**Importante:** Ao alternar de API:
- As mensagens antigas permanecem salvas
- Você precisará reconectar na nova API
- Leads e histórico não são afetados

## 📡 Endpoints da API

### Backend Routes

```typescript
// Conectar WhatsApp (API Não Oficial com QR Code ou API Oficial)
POST /api/whatsapp/connect

// Alterar tipo de API
POST /api/whatsapp/alterar-tipo-api
Body: { "tipoApi": "oficial" | "nao_oficial" }

// Configurar API Oficial
POST /api/whatsapp/configurar-api-oficial
Body: {
  "phoneNumberId": "123456789",
  "accessToken": "EAAxxxxxx",
  "webhookVerifyToken": "meu_token"
}

// Webhook da API Oficial (receber mensagens)
GET/POST /api/whatsapp/webhook-oficial
```

## 🐛 Troubleshooting

### API Não Oficial

**Problema:** QR Code não aparece
- **Solução:** Verifique se o backend está rodando e tente novamente

**Problema:** Desconexões frequentes
- **Solução:** Mantenha o celular com internet estável. Considere usar API Oficial.

### API Oficial

**Problema:** Erro ao salvar credenciais
- **Solução:** Verifique se as credenciais estão corretas no Meta for Developers

**Problema:** Não recebo mensagens
- **Solução:** Verifique se o webhook está configurado corretamente e se a URL está acessível

**Problema:** Erro 403 no webhook
- **Solução:** Verifique se o Verify Token no Meta é o mesmo do CRM

## 📊 Comparação

| Recurso | API Não Oficial | API Oficial |
|---------|----------------|-------------|
| **Custo** | Gratuita | Pode ter custos |
| **Configuração** | QR Code (fácil) | Credenciais (complexo) |
| **Estabilidade** | Média | Alta |
| **Suporte** | Comunidade | Oficial Meta |
| **Celular** | Requer conectado | Não requer |
| **Webhooks** | Não nativos | Nativos |
| **Sincronização** | Manual | Automática |

## 🎯 Recomendações

- **Use API Não Oficial se:**
  - Está começando
  - Quer testar o sistema
  - Não tem WhatsApp Business API

- **Use API Oficial se:**
  - Precisa de alta estabilidade
  - Tem volume alto de mensagens
  - Quer webhooks nativos
  - Já tem WhatsApp Business API aprovado

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs do backend em `backend/` ao executar `npm run dev`
- Consulte a documentação oficial:
  - [Baileys (API Não Oficial)](https://github.com/WhiskeySockets/Baileys)
  - [WhatsApp Business API (API Oficial)](https://developers.facebook.com/docs/whatsapp)
