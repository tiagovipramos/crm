# 🔄 TRIGGERS DE REVERSÃO - Correção de Status

## O Problema

Anteriormente, quando um lead era marcado incorretamente (ex: "Não Solicitado" ao invés de "Cotação Enviada"), o saldo ia para **PERDIDO** e não podia ser recuperado.

## A Solução

Esta migration adiciona **triggers de reversão** que permitem corrigir erros de status, recuperando o saldo automaticamente.

---

## 📋 Como Executar

### Windows:
```bash
backend\executar-migration-triggers-reversao.bat
```

### Linux/Mac:
```bash
cd backend
mysql -u root crm_desenvolvimento < migrations/adicionar-triggers-reversao.sql
```

---

## ✅ O Que os Triggers Fazem

### 1. Reversão para "Cotação Enviada"

**Cenário:**
- Lead foi marcado como "Não Solicitado" por engano
- Vendedor corrige para "Cotação Enviada"

**Ação Automática:**
- ❌ Saldo sai de PERDIDO
- ✅ Saldo vai para DISPONÍVEL
- 📊 Estatísticas atualizadas
- 🔄 Histórico registrado como "CORREÇÃO"

### 2. Reversão para "Convertido" (Venda)

**Cenário:**
- Lead foi marcado como "Não Solicitado" por engano
- Vendedor corrige direto para "Venda"

**Ação Automática:**
- ❌ Saldo de resposta sai de PERDIDO
- ✅ Saldo de resposta vai para DISPONÍVEL
- 💰 Saldo de venda é ADICIONADO
- 📊 Estatísticas de vendas atualizadas
- 🔄 Histórico registrado como "CORREÇÃO + VENDA"

---

## 📊 Exemplos Práticos

### Exemplo 1: Erro Simples

**Fluxo:**
1. Lead criado → R$ 2,00 **Bloqueado** ✅
2. Marcou "Não Solicitado" → R$ 2,00 **Perdido** ❌
3. Corrigiu para "Cotação" → R$ 2,00 **Disponível** ✅

**Resultado:** Saldo recuperado! 💰

### Exemplo 2: Corrigiu e Vendeu

**Fluxo:**
1. Lead criado → R$ 2,00 **Bloqueado** ✅
2. Marcou "Engano" → R$ 2,00 **Perdido** ❌
3. Corrigiu para "Venda" → R$ 4,00 **Disponível** 💰✅

**Resultado:** Saldo recuperado + comissão de venda! 🎉

---

## 🎯 Triggers Criados

### 1. `trigger_reversao_para_proposta`
- Detecta mudança de status: `nao_solicitado/engano/perdido` → `proposta_enviada`
- Move saldo: PERDIDO → DISPONÍVEL
- Atualiza indicação: `perdido/engano` → `respondeu`

### 2. `trigger_reversao_para_convertido`
- Detecta mudança de status: `nao_solicitado/engano/perdido` → `convertido`
- Move saldo de resposta: PERDIDO → DISPONÍVEL
- Adiciona comissão de venda
- Atualiza indicação: `perdido/engano` → `converteu`

---

## 🔍 Verificar se Funcionou

### 1. Verificar Triggers Ativos
```sql
SHOW TRIGGERS WHERE `Table` = 'leads';
```

Deve mostrar:
- `trigger_reversao_para_proposta`
- `trigger_reversao_para_convertido`
- (+ outros triggers existentes)

### 2. Testar Reversão

**Teste no CRM:**
1. Mova um lead para "Não Solicitado"
2. Verifique no app do indicador: saldo vai para PERDIDO
3. Mova de volta para "Cotação Enviada"
4. Verifique no app do indicador: saldo volta para DISPONÍVEL ✅

---

## ⚠️ Observações Importantes

1. **Só funciona com indicações que estão perdidas/engano**
   - Se a indicação já está "respondeu" ou "converteu", não há o que reverter

2. **Saldo é recuperado automaticamente**
   - Não precisa fazer nada manualmente
   - Os triggers fazem tudo sozinhos

3. **Histórico é mantido**
   - Toda reversão é registrada em `transacoes_indicador`
   - Tipo: "reversao"
   - Descrição: "🔄 CORREÇÃO - Saldo recuperado..."

4. **Socket.IO notifica em tempo real**
   - O app do indicador atualiza automaticamente
   - Estatísticas são recalculadas
   - Histórico é atualizado

---

## 🚀 Fluxo Completo de Correção

```
┌─────────────────────────┐
│  Lead Criado            │
│  R$ 2,00 Bloqueado      │
└───────────┬─────────────┘
            │
            │ (Erro: marcou Não Solicitado)
            ▼
┌─────────────────────────┐
│  Lead Não Solicitado    │
│  R$ 2,00 Perdido ❌     │
└───────────┬─────────────┘
            │
            │ (Correção: move para Cotação)
            ▼
┌─────────────────────────┐
│  Lead Cotação Enviada   │
│  R$ 2,00 Disponível ✅  │
│  🔄 REVERSÃO APLICADA   │
└─────────────────────────┘
```

---

## ✅ Conclusão

Agora você pode **corrigir erros de status** no kanban sem perder saldo!

O sistema permite:
- ❌ → ✅ (Perdido → Disponível)
- ❌ → 💰 (Perdido → Disponível + Venda)
- Correções infinitas (pode mudar quantas vezes quiser)

Tudo em **tempo real** via Socket.IO! ⚡
