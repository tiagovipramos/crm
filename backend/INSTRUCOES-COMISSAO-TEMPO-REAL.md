# 🔄 Correção: Comissão em Tempo Real para Indicadores

## 📋 Problema Identificado

Quando um lead era movido no kanban para "Convertido" ou "Cotação Enviada" (proposta_enviada), o indicador deveria receber a comissão em tempo real no app de INDICAÇÃO, mas isso só acontecia após pressionar F5.

## 🔍 Causa do Problema

O sistema tinha dois métodos diferentes para atualizar o status de um lead:

1. **`updateLead`** - Usado quando você **ARRASTA o card no kanban**
2. **`updateStatus`** - Usado para atualização específica de status via API

O problema estava no método `updateLead` que:
- ✅ Emitia evento Socket.IO para admins (`lead_status_atualizado`)
- ❌ **NÃO emitia** evento para o indicador (`saldo_atualizado`)

Enquanto o `updateStatus` emitia corretamente ambos os eventos.

## ✅ Solução Implementada

### Arquivo Modificado:
`backend/src/controllers/leadsController.ts`

### Mudança Realizada:

Adicionamos a **mesma lógica de notificação de indicadores** no método `updateLead` que já existia no `updateStatus`:

```typescript
// Se o status foi atualizado, emitir evento Socket.IO para admins
if (fields.includes('status')) {
  const io = (req.app as any).get('io');
  if (io) {
    // Emitir para admins
    io.to('admins').emit('lead_status_atualizado', {
      leadId: id,
      consultorId,
      status: updates.status,
      timestamp: new Date().toISOString()
    });

    // 💰 NOVO: Buscar dados do lead para verificar se tem indicação
    const leadDataResult = await query(
      'SELECT indicacao_id, indicador_id, nome FROM leads WHERE id = ?',
      [id]
    );

    if (leadDataResult.rows.length > 0) {
      const leadData = leadDataResult.rows[0];
      const indicadorId = leadData.indicador_id;
      const novoStatus = updates.status;

      // 💰 NOVO: Emitir evento para o indicador em tempo real
      if (indicadorId && (novoStatus === 'proposta_enviada' || novoStatus === 'convertido' || ...)) {
        // Buscar saldos atualizados
        const indicadorResult = await query(
          'SELECT saldo_disponivel, saldo_bloqueado, saldo_perdido FROM indicadores WHERE id = ?',
          [indicadorId]
        );

        if (indicadorResult.rows.length > 0) {
          const indicador = indicadorResult.rows[0];
          
          // Emitir evento Socket.IO para a sala do indicador
          io.to(`indicador_${indicadorId}`).emit('saldo_atualizado', {
            indicadorId,
            leadId: id,
            leadNome: leadData.nome,
            status: novoStatus,
            saldoDisponivel: parseFloat(indicador.saldo_disponivel),
            saldoBloqueado: parseFloat(indicador.saldo_bloqueado),
            saldoPerdido: parseFloat(indicador.saldo_perdido),
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }
}
```

## 🎯 Como Funciona Agora

1. **Vendedor move lead no kanban** → `updateLead` é chamado
2. **Backend verifica se status mudou** → Se sim, continua
3. **Busca dados do lead** → Verifica se tem `indicador_id`
4. **Se tem indicador** → Busca saldos atualizados do banco
5. **Emite evento Socket.IO** → Para a sala `indicador_{id}`
6. **Frontend escuta evento** → Hook `useIndicadorSocket` recebe
7. **Atualiza interface** → Dashboard, saldos e indicações atualizados **SEM F5**

## 📡 Fluxo de Eventos Socket.IO

```
┌─────────────────┐
│  Vendedor Move  │
│  Lead no Kanban │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Backend: leadsController.ts    │
│  updateLead()                    │
└────────┬────────────────────────┘
         │
         ├──────────────────┬─────────────────────┐
         ▼                  ▼                     ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│ Atualiza DB  │   │ Emite para   │   │ Emite para       │
│ (triggers)   │   │ Admins       │   │ Indicador        │
└──────────────┘   └──────────────┘   └─────────┬────────┘
                                                 │
                                                 ▼
                                    ┌──────────────────────┐
                                    │  Frontend: Indicador │
                                    │  useIndicadorSocket  │
                                    └─────────┬────────────┘
                                              │
                                              ▼
                                    ┌──────────────────────┐
                                    │  Atualiza Interface  │
                                    │  • Dashboard         │
                                    │  • Saldos            │
                                    │  • Indicações        │
                                    │  • LootBox           │
                                    └──────────────────────┘
```

## 🧪 Status dos Leads que Acionam Notificação

Os seguintes status acionam a notificação em tempo real para o indicador:

- ✅ `proposta_enviada` - Cotação Enviada (desbloqueia R$ 2,00)
- ✅ `convertido` - Convertido/Venda (mantém R$ 2,00 disponível)
- ✅ `nao_solicitado` - Não Solicitado (perde R$ 2,00)
- ✅ `perdido` - Perdido (perde R$ 2,00)
- ✅ `engano` - Engano (perde R$ 2,00)

## 🔧 Componentes Envolvidos

### Backend:
- `backend/src/controllers/leadsController.ts` - **CORRIGIDO** ✅
- `backend/src/server.ts` - Configuração de salas Socket.IO
- `backend/migrations/atualizar-triggers-indicacao-instantaneo.sql` - Triggers do banco

### Frontend:
- `hooks/useIndicadorSocket.ts` - Escuta eventos Socket.IO
- `app/indicador/page.tsx` - Página do indicador (usa o hook)
- `store/useIndicadorStore.ts` - Store do indicador

## ✅ Resultado

Agora, quando o vendedor move um lead no kanban:

1. **Admins** recebem atualização em tempo real
2. **Indicador** recebe atualização de saldo **EM TEMPO REAL** ⚡
3. **Não precisa mais apertar F5** 🎉

## 📝 Notas Importantes

- Os **triggers do banco de dados** já atualizam os saldos automaticamente
- O backend apenas **notifica** o frontend sobre as mudanças
- O frontend **recarrega os dados** do servidor após a notificação
- Funciona tanto para drag & drop no kanban quanto para atualização via API

## 🎓 Aprendizado

Este problema ocorreu porque tínhamos **dois caminhos diferentes** para atualizar o status de um lead, e apenas um deles estava notificando o indicador corretamente. A solução foi **unificar a lógica de notificação** em ambos os métodos.

---

**Data da Correção:** 29/10/2025  
**Arquivo Modificado:** `backend/src/controllers/leadsController.ts`  
**Status:** ✅ CORRIGIDO
