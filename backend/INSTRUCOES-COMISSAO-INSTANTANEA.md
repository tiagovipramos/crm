# 📋 COMISSÃO INSTANTÂNEA - SISTEMA DE INDICAÇÕES

## 🎯 Objetivo

Implementar atualização **instantânea** do saldo dos indicadores quando o vendedor mudar o status do lead no CRM.

## 🔄 Como Funciona Agora

### ✅ Antes (Sistema Antigo)
- Indicador criava a indicação → R$ 2,00 ficavam **bloqueados**
- Saldo só ficava **disponível** quando o lead respondia (mudava de status "novo")
- Comissão de venda (R$ 20,00) só era paga na conversão

### 🚀 Agora (Sistema Novo - INSTANTÂNEO)

#### 1️⃣ **Cotação Enviada** (Status: `proposta_enviada`)
- Vendedor move o lead para "Cotação Enviada"
- **INSTANTANEAMENTE:**
  - R$ 2,00 saem de **BLOQUEADO**
  - R$ 2,00 vão para **DISPONÍVEL**
  - Indicador pode sacar o saldo imediatamente
  - Notificação em tempo real via Socket.IO

#### 2️⃣ **Convertido** (Status: `convertido`)
- Vendedor move o lead para "Convertido"
- **INSTANTANEAMENTE:**
  - R$ 20,00 são adicionados ao **SALDO DISPONÍVEL**
  - Indicador recebe comissão de venda
  - Notificação em tempo real via Socket.IO
  - Contador de vendas é incrementado (para loot box)

#### 3️⃣ **Não Solicitado** (Status: `nao_solicitado`)
- Vendedor move o lead para "Não Solicitado"
- **INSTANTANEAMENTE:**
  - R$ 2,00 saem de **BLOQUEADO**
  - R$ 2,00 vão para **PERDIDO**
  - Saldo não pode mais ser recuperado
  - Notificação em tempo real via Socket.IO

#### 4️⃣ **Perdido** ou **Engano** (Status: `perdido` ou `engano`)
- Vendedor marca o lead como "Perdido" ou "Engano"
- **INSTANTANEAMENTE:**
  - R$ 2,00 saem de **BLOQUEADO**
  - R$ 2,00 vão para **PERDIDO**
  - Saldo não pode mais ser recuperado

## 🛠️ Implementação Técnica

### 📊 Triggers do Banco de Dados

O sistema usa **TRIGGERS MySQL** que são executados automaticamente quando o status do lead muda:

1. **`trigger_comissao_proposta_enviada`**
   - Acionado quando: `OLD.status != 'proposta_enviada' AND NEW.status = 'proposta_enviada'`
   - Ação: Move R$ 2,00 de bloqueado → disponível

2. **`trigger_comissao_conversao`**
   - Acionado quando: `OLD.status != 'convertido' AND NEW.status = 'convertido'`
   - Ação: Adiciona R$ 20,00 ao saldo disponível

3. **`trigger_lead_nao_solicitado`**
   - Acionado quando: `OLD.status != 'nao_solicitado' AND NEW.status = 'nao_solicitado'`
   - Ação: Move R$ 2,00 de bloqueado → perdido

4. **`trigger_lead_perdido`**
   - Acionado quando: `OLD.status != 'perdido' AND NEW.status = 'perdido'`
   - Ação: Move R$ 2,00 de bloqueado → perdido

5. **`trigger_lead_engano`**
   - Acionado quando: `OLD.status != 'engano' AND NEW.status = 'engano'`
   - Ação: Move R$ 2,00 de bloqueado → perdido

### 🔔 Notificações em Tempo Real

O **leadsController** emite eventos Socket.IO para:

1. **Indicador**: Notifica mudança de saldo
   ```javascript
   io.to(`indicador_${indicadorId}`).emit('saldo_atualizado', {
     indicadorId,
     leadId,
     leadNome,
     status,
     saldoDisponivel,
     saldoBloqueado,
     saldoPerdido,
     timestamp
   });
   ```

2. **Admins**: Notifica mudança de status do lead
   ```javascript
   io.to('admins').emit('lead_status_atualizado', {
     leadId,
     consultorId,
     status,
     timestamp
   });
   ```

## 📥 Como Instalar

### 1. Executar a Migration

Execute o script batch na pasta `backend`:

```bash
cd backend
executar-migration-triggers-comissao.bat
```

Ou manualmente via MySQL:

```bash
mysql -u root -p crm_protecar < migrations/atualizar-triggers-indicacao-instantaneo.sql
```

### 2. Verificar Instalação

No MySQL, execute:

```sql
SHOW TRIGGERS WHERE `Table` = 'leads';
```

Você deve ver 5 triggers:
- ✅ trigger_comissao_proposta_enviada
- ✅ trigger_comissao_conversao
- ✅ trigger_lead_nao_solicitado
- ✅ trigger_lead_perdido
- ✅ trigger_lead_engano

### 3. Reiniciar o Backend

Após executar a migration, reinicie o backend para garantir que os logs estejam atualizados.

## 🧪 Como Testar

### Teste 1: Cotação Enviada
1. Criar uma indicação no sistema de indicações
2. No CRM, mover o lead para "Cotação Enviada"
3. Verificar que o saldo do indicador mudou de bloqueado → disponível

### Teste 2: Conversão
1. Mover um lead que já tem comissão liberada para "Convertido"
2. Verificar que R$ 20,00 foram adicionados ao saldo disponível

### Teste 3: Não Solicitado
1. Mover um lead novo para "Não Solicitado"
2. Verificar que o saldo foi movido para "perdido"

## 📊 Logs

Os logs no console do backend mostram:

```
💰 Lead tem indicação! Notificando indicador: {indicadorId}
✅ Evento de atualização de saldo emitido para indicador: {indicadorId}
💰 Novo saldo disponível: {valor}
🔒 Novo saldo bloqueado: {valor}
❌ Novo saldo perdido: {valor}
```

## ⚠️ Observações Importantes

1. **Os triggers só acionam se a indicação ainda estiver pendente/enviada ao CRM**
   - Evita dupla contabilização
   - Garante consistência dos dados

2. **Transações são registradas automaticamente**
   - Cada mudança de saldo gera um registro na tabela `transacoes_indicador`
   - Permite auditoria completa

3. **Notificações em tempo real**
   - Indicador vê o saldo mudar instantaneamente
   - Não precisa recarregar a página

4. **Compatibilidade**
   - Funciona com indicações antigas
   - Não afeta leads sem indicação
   - Sistema robusto e seguro

## 🔧 Troubleshooting

### Problema: Triggers não estão funcionando

**Solução:**
```sql
-- Verificar se os triggers existem
SHOW TRIGGERS WHERE `Table` = 'leads';

-- Se não existirem, executar novamente a migration
SOURCE migrations/atualizar-triggers-indicacao-instantaneo.sql;
```

### Problema: Saldo não atualiza em tempo real

**Solução:**
1. Verificar se o Socket.IO está configurado corretamente no backend
2. Verificar se o indicador está conectado via WebSocket
3. Verificar logs do backend para confirmar emissão de eventos

### Problema: Saldo inconsistente

**Solução:**
```sql
-- Verificar registros de transações
SELECT * FROM transacoes_indicador 
WHERE indicador_id = 'ID_DO_INDICADOR' 
ORDER BY data_transacao DESC;

-- Verificar status das indicações
SELECT * FROM indicacoes 
WHERE indicador_id = 'ID_DO_INDICADOR';
```

## 📞 Suporte

Para dúvidas ou problemas, verificar os logs do backend e do banco de dados.

## ✅ Checklist de Implementação

- [x] Migration SQL criada
- [x] Triggers implementados no banco de dados
- [x] Controller atualizado para emitir eventos Socket.IO
- [x] Validação de status adicionada
- [x] Logs detalhados implementados
- [x] Documentação criada
- [x] Script de instalação criado

## 🎉 Resultado Final

Com esta implementação, o sistema de comissões se tornou **100% instantâneo**:

- ✅ Vendedor move lead → Saldo atualiza **instantaneamente**
- ✅ Indicador vê a mudança **em tempo real**
- ✅ Sem necessidade de atualizar a página
- ✅ Auditoria completa de todas as transações
- ✅ Sistema robusto e confiável
