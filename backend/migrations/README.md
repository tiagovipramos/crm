# 📊 Migrations do CRM Protecar

Este diretório contém todas as migrations do banco de dados MySQL em ordem sequencial.

## 🎯 Ordem de Execução

Execute as migrations na ordem numérica. O script `./scripts/migrate.sh` faz isso automaticamente.

### Migrations Principais (MySQL)

| # | Arquivo | Descrição |
|---|---------|-----------|
| 001 | `001_create-database.sql` | Criação do banco de dados |
| 002 | `002_schema-mysql.sql` | Schema principal (tabelas base) |
| 003 | `003_adicionar-coluna-role.sql` | Adiciona coluna role em consultores |
| 004 | `004_adicionar-coluna-created-by.sql` | Adiciona created_by em leads |
| 005 | `005_adicionar-coluna-numero-whatsapp.sql` | Adiciona numero_whatsapp |
| 006 | `006_adicionar-coluna-whatsapp-message-id.sql` | Adiciona whatsapp_message_id |
| 007 | `007_adicionar-coluna-notas-internas.sql` | Adiciona notas_internas |
| 008 | `008_adicionar-campos-veiculo.sql` | Adiciona campos de veículo |
| 009 | `009_adicionar-coluna-ativo-consultores.sql` | Adiciona coluna ativo |
| 010 | `010_adicionar-coluna-sistema-online.sql` | Adiciona sistema_online |
| 011 | `011_adicionar-tabela-tarefas.sql` | Cria tabela tarefas |
| 012 | `012_corrigir-tabela-tarefas.sql` | Correções na tabela tarefas |
| 013 | `013_schema-followup.sql` | Schema de follow-up |
| 014 | `014_schema-lootbox.sql` | Schema de lootbox/gamificação |
| 015 | `015_adicionar-lootbox-vendas.sql` | Lootbox de vendas |
| 016 | `016_schema-campanhas.sql` | Schema de campanhas |
| 017 | `017_schema-indicadores-mysql.sql` | Schema de indicadores |
| 018 | `018_adicionar-coluna-created-by-indicadores.sql` | created_by em indicadores |
| 019 | `019_adicionar-coluna-avatar-indicadores.sql` | Avatar em indicadores |
| 020 | `020_recriar-registro-audio.sql` | Recria registro de áudio |
| 021 | `021_inserir-admin.sql` | Insere usuário admin inicial |
| 022 | `022_atualizar-senha.sql` | Atualiza senhas (se necessário) |
| 023 | `023_fix-admin-login.sql` | Fix de login admin |

### Migrations de Manutenção

- `LIMPAR-DUPLICATAS-MANUALMENTE.sql` - Limpeza manual de duplicatas (executar quando necessário)
- `remover-campanhas.sql` - Remover campanhas (se necessário)

### Migrations Arquivadas (PostgreSQL)

Movidas para `archived/postgresql/`:
- `schema.sql` - Schema PostgreSQL original
- `schema-indicadores.sql` - Schema PostgreSQL de indicadores
- `adicionar-coluna-notas-internas-simples.sql` - Versão PostgreSQL

## 📝 Como Executar

### Todas as Migrations
```bash
./scripts/migrate.sh
```

### Migration Específica
```bash
./scripts/migrate.sh 001_create-database.sql
```

## ⚠️ Importante

1. **Ordem:** Sempre execute na ordem numérica
2. **Idempotência:** Migrations usam `IF NOT EXISTS` quando possível
3. **Backup:** Faça backup antes de executar migrations em produção
4. **Teste:** Teste em desenvolvimento antes de produção

## 🔧 Criando Nova Migration

1. Crie arquivo com prefixo numérico sequencial: `024_descricao.sql`
2. Use `IF NOT EXISTS`, `IF EXISTS` para idempotência
3. Adicione comentários explicativos
4. Teste em desenvolvimento
5. Documente neste README

### Template
```sql
-- Migration 024: Descrição da mudança
-- Data: YYYY-MM-DD
-- Autor: Nome

-- Verificar se já foi executada
-- CREATE TABLE IF NOT EXISTS ...
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...

-- Sua migration aqui
```

## 🗑️ Migrations Obsoletas

Migrations que foram substituídas ou não são mais necessárias devem ser movidas para `archived/obsolete/`.

## 📚 Referências

- Documentação MySQL: https://dev.mysql.com/doc/
- Guia de Migrations: ../docs/MIGRATIONS.md (criar se necessário)

---

**Última atualização:** 2025-02-01
