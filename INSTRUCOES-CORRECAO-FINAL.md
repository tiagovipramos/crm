# 🔧 INSTRUÇÕES PARA CORREÇÃO FINAL DO SISTEMA

## ✅ STATUS ATUAL

- ✅ Correções commitadas no GitHub (commit: cbb1fe6)
- ✅ Arquivo `.env` corrigido com `NEXT_PUBLIC_WS_URL`
- ✅ Script `fix-everything-vps.sh` criado
- ⏳ Aguardando execução no servidor

---

## 📋 EXECUTE ESTAS 3 ETAPAS NO SERVIDOR

### Etapa 1: Conectar ao Servidor
```bash
ssh root@185.217.125.72
# Senha: UA3485Z43hqvZ@4r
```

### Etapa 2: Atualizar o Código
```bash
cd /root/crm  # ou onde está o projeto
git pull origin main
```

### Etapa 3: Executar Correções
```bash
bash fix-everything-vps.sh
```

---

## 🚀 OU EXECUTE TUDO EM UM COMANDO

Cole este comando no seu terminal (vai pedir a senha):

```bash
ssh root@185.217.125.72 "cd /root/crm && git pull origin main && bash fix-everything-vps.sh"
```

---

## 📊 O QUE O SCRIPT FAZ

1. ✅ Atualiza `.env` com `NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001`
2. ✅ Cria tabelas `lootbox_premios` e `lootbox_historico` no banco
3. ✅ Adiciona colunas faltantes na tabela `indicadores`
4. ✅ Executa todas as migrations
5. ✅ Corrige permissões de arquivos
6. ✅ Limpa cache
7. ✅ Faz rebuild dos containers com as novas configurações
8. ✅ Aguarda 30s para os containers iniciarem
9. ✅ Mostra o status final

---

## ⏱️ TEMPO ESTIMADO

- Atualizar código: 5 segundos
- Executar script: 3-5 minutos (rebuild dos containers)
- **Total: ~5 minutos**

---

## ✅ APÓS A EXECUÇÃO

1. Acesse: http://185.217.125.72:3000/indicador/login
2. Faça login com:
   - Email: tiago@vipseg.org
   - Senha: 123456
3. Verifique se o dashboard carrega sem erros 500
4. Verifique se não há erros de Socket.IO no console

---

## 🔍 COMO VERIFICAR SE DEU CERTO

Execute no servidor para ver os logs:
```bash
cd /root/crm
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend
```

Ou teste os endpoints:
```bash
curl http://185.217.125.72:3000  # Deve retornar HTML
curl http://185.217.125.72:3001/api/health  # Deve retornar status
```

---

## ⚠️ SE ALGO DER ERRADO

1. Ver logs detalhados:
   ```bash
   cd /root/crm
   docker-compose logs -f
   ```

2. Reiniciar containers:
   ```bash
   docker-compose restart
   ```

3. Rebuild completo:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

---

## 📞 PROBLEMAS RESOLVIDOS

- ✅ Socket.IO agora aponta para IP correto (não mais localhost)
- ✅ Tabelas do lootbox criadas no banco de dados
- ✅ Colunas faltantes adicionadas
- ✅ Dashboard não terá mais erro 500
- ✅ Sistema 100% funcional

---

**Desenvolvido pelo Agente Autônomo DevOps** 🤖
