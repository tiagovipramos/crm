# 🎯 Sistema de Distribuição Round Robin - Indicações

## 📋 Problema Resolvido

O sistema de indicação não estava verificando se os vendedores tinham WhatsApp conectado antes de atribuir os leads. Agora, o sistema identifica automaticamente qual vendedor está com **"WhatsApp: Conectado"** para enviar as indicações usando o algoritmo Round Robin.

## ✅ Implementação

### Algoritmo Round Robin

O sistema agora distribui leads apenas para vendedores que atendem aos seguintes critérios:

1. **Status de conexão**: `status_conexao = 'online'` (WhatsApp Conectado)
2. **Distribuição equilibrada**: Ordena por quantidade de leads (menor primeiro)
3. **Antiguidade**: Em caso de empate, prioriza o vendedor mais antigo

### 🔍 Como Funciona

```sql
SELECT id, nome, status_conexao, 
       (SELECT COUNT(*) FROM leads WHERE consultor_id = consultores.id) as total_leads
FROM consultores 
WHERE status_conexao = 'online'
ORDER BY total_leads ASC, data_criacao ASC
```

### Cenários de Distribuição

#### 1️⃣ Um vendedor com WhatsApp conectado
- **Comportamento**: Todos os leads vão para esse vendedor
- **Exemplo**: Se apenas Carlos está online, todas as indicações vão para ele

#### 2️⃣ Dois ou mais vendedores com WhatsApp conectado
- **Comportamento**: Distribuição equilibrada (Round Robin)
- **Exemplo**: 
  - Carlos: 5 leads → Recebe próximo lead
  - João: 8 leads → Aguarda na fila
  - Maria: 5 leads → Recebe depois de Carlos

#### 3️⃣ Nenhum vendedor com WhatsApp conectado
- **Comportamento**: Indicação fica pendente
- **Mensagem**: "Aguardando disponibilidade de consultores com WhatsApp conectado"

## 📊 Logs do Sistema

O sistema agora exibe logs detalhados para debug:

```
🔍 Buscando consultores com WhatsApp conectado...
✅ Consultor selecionado: Carlos Silva (uuid-123)
📊 Total de leads atuais: 5
📱 Status WhatsApp: online
```

### Logs em caso de sucesso:
```
📡 Emitindo evento 'novo_lead' para consultor uuid-123
✅ Evento Socket.IO emitido com sucesso
📤 Enviando mensagem automática de boas-vindas para 5581988040121...
✅ Mensagem de boas-vindas enviada com sucesso!
```

### Logs em caso de nenhum vendedor online:
```
⚠️ Nenhum consultor com WhatsApp conectado. Indicação criada mas lead não será gerado.
```

## 🧪 Como Testar

### Teste 1: Nenhum vendedor conectado
1. Desconecte todos os WhatsApp dos vendedores
2. Crie uma indicação
3. **Resultado esperado**: Indicação criada mas lead não é gerado
4. **Mensagem**: "Aguardando disponibilidade de consultores..."

### Teste 2: Um vendedor conectado
1. Conecte o WhatsApp de apenas 1 vendedor
2. Crie várias indicações
3. **Resultado esperado**: Todos os leads vão para esse vendedor

### Teste 3: Múltiplos vendedores conectados
1. Conecte o WhatsApp de 2+ vendedores
2. Crie várias indicações
3. **Resultado esperado**: Leads distribuídos de forma equilibrada

### Teste 4: Verificação em tempo real
1. Crie uma indicação com vendedor conectado
2. **Verifique**:
   - Lead aparece no CRM do vendedor
   - Mensagem de boas-vindas é enviada
   - Status da indicação muda para "enviado_crm"

## 📱 Status de Conexão WhatsApp

O campo `status_conexao` na tabela `consultores` pode ter os seguintes valores:

- `'online'` → WhatsApp Conectado (recebe leads)
- `'offline'` → WhatsApp Desconectado (não recebe leads)

## 🔧 Arquivo Modificado

**Arquivo**: `backend/src/controllers/indicadorController.ts`

**Função**: `criarIndicacao`

**Linhas modificadas**: ~450-520

## 🎯 Benefícios

✅ **Distribuição Justa**: Leads equilibrados entre vendedores online
✅ **Automático**: Identifica automaticamente quem está conectado
✅ **Escalável**: Funciona com 1 ou 100 vendedores
✅ **Confiável**: Logs detalhados para debug
✅ **Seguro**: Não perde leads quando ninguém está conectado

## 📝 Notas Importantes

1. A indicação sempre é criada no sistema, mesmo sem vendedores online
2. O saldo R$ 2,00 é bloqueado imediatamente ao criar a indicação
3. A mensagem de boas-vindas é enviada automaticamente quando há vendedor online
4. O sistema emite eventos Socket.IO em tempo real para atualização do dashboard

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar dashboard para visualizar distribuição de leads
- [ ] Implementar métricas de performance por vendedor
- [ ] Criar alertas quando nenhum vendedor estiver online
- [ ] Adicionar logs de auditoria para rastreamento

---

**Data da Implementação**: 27/10/2025
**Versão**: 1.0
**Status**: ✅ Implementado e Testado
