# 📖 COMO USAR O PROMPT DE ORGANIZAÇÃO

## 🎯 Objetivo

Este guia explica como usar o arquivo `PROMPT-ORGANIZACAO-VPS.md` com Claude via API no VSCode (extensão Cline) para organizar automaticamente seu projeto CRM para deploy em VPS Linux.

## 📋 Pré-requisitos

1. ✅ Extensão **Cline** instalada no VSCode
2. ✅ Chave API da Anthropic (Claude) configurada
3. ✅ Projeto CRM aberto no VSCode
4. ✅ Git configurado (para controlar versões)

## 🚀 Passo a Passo

### 1. Fazer Backup

**IMPORTANTE**: Antes de começar, faça backup do projeto atual!

```bash
# Commit tudo antes de começar
git add .
git commit -m "backup: antes da refatoração para VPS"

# Ou faça cópia da pasta inteira
cp -r crm/ crm-backup/
```

### 2. Abrir o Cline no VSCode

1. Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
2. Digite "Cline: Open In New Tab"
3. Ou clique no ícone do Cline na barra lateral

### 3. Enviar o Prompt

**Opção A - Copiar e Colar** (Recomendado)

1. Abra o arquivo `PROMPT-ORGANIZACAO-VPS.md`
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no chat do Cline
4. Pressione Enter

**Opção B - Referenciar o Arquivo**

No chat do Cline, digite:

```
@PROMPT-ORGANIZACAO-VPS.md

Por favor, execute todas as tarefas descritas neste arquivo.
Comece pela FASE 1 e me informe após completar cada fase.
```

### 4. Acompanhar a Execução

Claude vai começar a trabalhar nas tarefas. Você verá:

- ✅ Arquivos sendo criados/modificados
- 📝 Explicações do que está sendo feito
- ❓ Perguntas quando precisar de confirmação
- 📊 Progresso de cada fase

### 5. Revisar e Aprovar

A cada 5 tarefas completadas, Claude vai:
1. Pausar e apresentar um resumo
2. Pedir sua revisão
3. Aguardar aprovação para continuar

**Você deve**:
- ✅ Revisar as mudanças feitas
- ✅ Testar se não quebrou nada
- ✅ Aprovar ou pedir ajustes

### 6. Após Conclusão

Quando todas as 10 fases estiverem completas:

1. **Revisar arquivos criados**:
   - `docker-compose.yml`
   - `DEPLOY.md`
   - Scripts em `scripts/`
   - Documentação em `docs/`

2. **Testar localmente**:
   ```bash
   # Dar permissão aos scripts
   chmod +x scripts/*.sh
   
   # Iniciar projeto
   ./scripts/start.sh
   
   # Ver logs
   ./scripts/logs.sh
   
   # Testar acesso
   curl http://localhost:3000
   curl http://localhost:3001/api/health
   ```

3. **Fazer commit final**:
   ```bash
   git add .
   git commit -m "refactor: organização completa para deploy VPS"
   git tag v1.0-vps-ready
   ```

## 🎯 Fases do Processo

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| 1 | Padronização do Banco de Dados | 10-15 min |
| 2 | Dockerização Completa | 20-30 min |
| 3 | Scripts Linux | 15-20 min |
| 4 | Organização de Migrations | 15-20 min |
| 5 | Configuração de Ambiente | 10-15 min |
| 6 | Documentação de Deploy | 20-30 min |
| 7 | Otimizações para Produção | 15-25 min |
| 8 | Scripts de Manutenção | 10-15 min |
| 9 | Segurança | 15-20 min |
| 10 | Testes e Validação | 20-30 min |

**Total Estimado**: 2h30min - 4h (depende da complexidade dos bugs encontrados)

## ⚠️ Pontos de Atenção

### Durante o Processo

1. **Não interrompa no meio de uma fase**: Deixe completar a fase atual
2. **Revise cada mudança**: Claude pode pedir sua confirmação
3. **Mantenha backups**: Se algo der errado, você pode reverter
4. **Teste incrementalmente**: Teste após cada fase se possível

### Possíveis Problemas

**Claude parar de responder**:
- Pode ter atingido limite de tokens
- Recarregue a página e continue da última fase completada
- Use: "Continue da FASE X onde paramos"

**Mudanças não aplicadas**:
- Verifique se aprovou as mudanças no Cline
- Verifique se não há conflitos de arquivo
- Recarregue o VSCode se necessário

**Erros de permissão**:
- Em Linux, pode precisar de `sudo` para alguns comandos
- Garanta que seu usuário tem permissões na pasta

## 📊 Checklist de Validação Final

Após tudo concluído, verifique:

```
✅ Projeto inicia com: ./scripts/start.sh
✅ MySQL funcionando (não PostgreSQL)
✅ Backend conecta ao banco
✅ Frontend carrega corretamente
✅ Uploads funcionam
✅ Migrations organizadas (001_, 002_, etc.)
✅ Arquivos .bat removidos ou movidos
✅ Docker Compose configurado
✅ Documentação DEPLOY.md criada
✅ Scripts Linux funcionais
✅ .env.example atualizado
✅ Sem erros no console
✅ Todas as rotas API funcionando
```

## 🆘 Se Algo Der Errado

### Reverter Mudanças

```bash
# Se fez commit antes
git reset --hard HEAD~1

# Se fez backup da pasta
rm -rf crm/
cp -r crm-backup/ crm/
```

### Pedir Ajuda ao Claude

No chat do Cline:

```
Encontrei um erro após a FASE X:
[descreva o erro aqui]

Os sintomas são:
[o que não está funcionando]

Pode me ajudar a corrigir?
```

## 💡 Dicas Pro

1. **Use modo Plan primeiro**: Peça ao Claude para revisar tudo antes de executar
2. **Faça commits por fase**: Mais fácil de reverter se necessário
3. **Teste em ambiente de dev primeiro**: Não teste direto em produção
4. **Documente mudanças customizadas**: Se você mudar algo, anote

## 🎓 Aprendizado

Após o processo, você terá:

- ✅ Projeto 100% compatível com Linux
- ✅ Dockerizado profissionalmente
- ✅ Scripts de automação
- ✅ Documentação completa
- ✅ Pronto para deploy em VPS
- ✅ Código mais organizado e mantível

## 📚 Próximos Passos

Depois que o projeto estiver organizado:

1. **Seguir o DEPLOY.md**: Fazer deploy na VPS
2. **Configurar CI/CD**: Automatizar deploys futuros
3. **Monitoramento**: Adicionar ferramentas de monitoramento
4. **Backup automático**: Configurar backups periódicos

---

## 🤝 Precisa de Ajuda?

Se tiver dúvidas durante o processo:

1. Consulte o arquivo `PROMPT-ORGANIZACAO-VPS.md`
2. Verifique a documentação gerada em `docs/`
3. Consulte o `TROUBLESHOOTING.md` (será criado)
4. Pergunte ao Claude no Cline

**Boa sorte com a organização do seu projeto! 🚀**
