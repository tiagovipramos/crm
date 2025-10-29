# 📋 Instruções para Migração de Leads Sem WhatsApp

## 🎯 Objetivo

Este script irá **mover automaticamente** todos os leads que foram indicados mas **não possuem WhatsApp** para a nova coluna **"Sem WhatsApp"** no funil.

---

## ⚠️ IMPORTANTE - Antes de Executar

### Pré-requisitos:

1. ✅ **WhatsApp deve estar CONECTADO** no CRM
   - Faça login no CRM
   - Certifique-se que o WhatsApp está conectado (bolinha verde)

2. ✅ **Servidor do CRM deve estar RODANDO**
   - Certifique-se que o backend está ativo na porta 3001

3. ✅ **Banco de dados deve estar ACESSÍVEL**
   - MySQL/MariaDB deve estar rodando

---

## 🚀 Como Executar

### Opção 1: Arquivo .bat (Windows)

1. Navegue até a pasta `backend`
2. Clique duas vezes no arquivo: **`executar-migracao-leads-sem-whatsapp.bat`**
3. Leia as informações na tela
4. Pressione qualquer tecla para continuar
5. Aguarde o processamento (pode demorar dependendo da quantidade de leads)

### Opção 2: Terminal/CMD

```bash
cd backend
node migrar-leads-sem-whatsapp.js
```

---

## 📊 O Que o Script Faz

1. **Busca** todos os leads com origem "Indicação" na coluna "Indicação"
2. **Valida** se cada lead possui WhatsApp ativo
3. **Mantém** os leads COM WhatsApp na coluna "Indicação" ✅
4. **Move** os leads SEM WhatsApp para coluna "Sem WhatsApp" ⚠️
5. **Atualiza** a data de modificação dos leads movidos

---

## 📈 Exemplo de Saída

```
🚀 Iniciando migração de leads sem WhatsApp...

📊 Total de leads com origem "Indicação" encontrados: 15

🔍 Verificando lead 1: João Silva (5511999999999)
   ✅ TEM WhatsApp - Mantém na coluna "Indicação"

🔍 Verificando lead 2: Maria Santos (5511888888888)
   ❌ SEM WhatsApp - Movendo para "Sem WhatsApp"
   ✅ Lead 2 migrado com sucesso!

...

============================================================
📊 RESUMO DA MIGRAÇÃO:
============================================================
✅ Leads COM WhatsApp (mantidos): 10
⚠️  Leads SEM WhatsApp (migrados): 5
❌ Erros: 0
📋 Total processado: 15
============================================================

🎉 Migração concluída! 5 leads movidos para "Sem WhatsApp".
```

---

## 🔧 Resolução de Problemas

### Erro: "WhatsApp não está conectado"
- **Solução:** Faça login no CRM e conecte o WhatsApp antes de executar

### Erro: "Banco de dados não acessível"
- **Solução:** Verifique se o MySQL/MariaDB está rodando
- **Solução:** Verifique as credenciais no arquivo `.env`

### Script muito lento
- **Normal:** O script valida cada número no WhatsApp (1 por segundo)
- **Exemplo:** 50 leads = aproximadamente 1 minuto

### Erro: "Cannot find module"
- **Solução:** Execute `npm install` na pasta `backend` primeiro

---

## ℹ️ Informações Adicionais

- **Tempo de execução:** ~1 segundo por lead (devido ao delay intencional)
- **Segurança:** O script NÃO deleta nenhum lead, apenas move entre colunas
- **Reversível:** Você pode mover os leads de volta manualmente se necessário
- **Idempotente:** Pode ser executado múltiplas vezes sem problemas

---

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Leia atentamente as mensagens de erro
2. Verifique os pré-requisitos acima
3. Tire screenshot da tela de erro
4. Entre em contato com o suporte

---

## ✅ Após a Migração

1. Atualize a página do CRM (F5)
2. Navegue até o Funil de Vendas
3. Verifique a nova coluna "Sem WhatsApp" (cor laranja)
4. Os leads sem WhatsApp estarão lá!

**Bom trabalho! 🎉**
