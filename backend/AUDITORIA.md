# ✅ Bug #20: Documentação de Auditoria e Rastreamento

## Tabelas COM rastreamento de criador

### ✅ Implementado
- `consultores` - coluna `created_by` (rastreia quem cadastrou o vendedor/admin)
- `indicadores` - coluna `created_by` (rastreia quem cadastrou o indicador)
- `followup_sequencias` - coluna `criado_por` (rastreia quem criou a sequência)

## Tabelas SEM rastreamento de criador

### ⚠️ Tabelas que DEVERIAM ter (prioridade ALTA)
- `leads` - **CRÍTICO**: Não rastreia quem criou o lead manualmente
- `tarefas` - Tem `consultor_id` mas não diferencia quem criou vs quem foi atribuído
- `indicacoes` - Não rastreia qual admin/gerente processou a indicação

### ℹ️ Tabelas que NÃO precisam
- `mensagens` - Já tem `consultor_id` (suficiente)
- `transacoes_indicador` - Transações automáticas do sistema
- `lootbox_historico` - Registros automáticos
- `saques_indicador` - Criado pelo próprio indicador
- `followup_leads` - Registros automáticos
- `followup_mensagens` - Parte da sequência (tem na tabela pai)

## Plano de Implementação Futura

### Fase 1: Adicionar colunas (com valores NULL permitidos)
```sql
ALTER TABLE leads ADD COLUMN created_by VARCHAR(36) NULL;
ALTER TABLE tarefas ADD COLUMN created_by VARCHAR(36) NULL;
ALTER TABLE indicacoes ADD COLUMN processed_by VARCHAR(36) NULL;
```

### Fase 2: Atualizar código para preencher
- Modificar INSERTs para incluir `created_by`
- Usar ID do usuário logado da sessão JWT

### Fase 3: Adicionar foreign keys (opcional)
```sql
ALTER TABLE leads 
  ADD CONSTRAINT fk_leads_created_by 
  FOREIGN KEY (created_by) REFERENCES consultores(id);
```

## Benefícios da Implementação

1. **Auditoria**: Saber quem criou cada registro
2. **Responsabilidade**: Rastrear ações de cada usuário
3. **Análise**: Relatórios de produtividade por usuário
4. **Segurança**: Investigar ações suspeitas
5. **Compliance**: Atender requisitos legais

## Notas Técnicas

- Não adicionar `created_by` retroativamente para não quebrar dados existentes
- Sempre permitir NULL inicialmente
- Logs do sistema já rastreiam ações críticas
- Priorizar tabelas com impacto em negócio
