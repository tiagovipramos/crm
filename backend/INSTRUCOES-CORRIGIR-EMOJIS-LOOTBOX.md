# 🎁 CORRIGIR EMOJIS NA LOOTBOX

## Problema
Os emojis estão aparecendo com caracteres estranhos (­ƒÆ░) ao invés dos emojis corretos (🎁, 💰, 💎, etc).

## Causa
A tabela `lootbox_premios` não está usando o charset UTF8MB4, que é necessário para armazenar emojis corretamente no MySQL.

## Solução

### Passo 1: Executar a Migration

Abra o terminal no diretório `backend` e execute:

```bash
cd backend
executar-migration-charset-lootbox.bat
```

### Passo 2: Verificar se Funcionou

Após executar a migration:
1. Recarregue a página do indicador
2. Abra uma caixinha
3. Os emojis devem aparecer corretamente

## O que a Migration Faz

1. **Converte a tabela** para UTF8MB4
2. **Corrige a coluna emoji** especificamente
3. **Remove prêmios antigos** com encoding errado
4. **Insere novos prêmios** com emojis corretos:
   - 💵 Comum - R$ 5,00
   - 💰 Comum - R$ 10,00
   - 💎 Raro - R$ 50,00
   - 🏆 Épico - R$ 75,00
   - 👑 Lendário - R$ 100,00

## Verificação Manual (Opcional)

Se quiser verificar se a tabela está correta, execute no MySQL:

```sql
SELECT * FROM lootbox_premios;
```

Você deve ver os emojis corretos na coluna `emoji`.

## Importante

⚠️ Esta migration apaga todos os registros antigos da tabela `lootbox_premios` e recria com os valores corretos. O histórico de caixas abertas (`lootbox_historico`) **NÃO** é afetado.
