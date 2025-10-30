# 🔧 INSTRUÇÕES - CORREÇÃO ERRO CORS INDICADOR

## 📋 Problema Identificado

O erro de CORS no sistema de indicadores ocorre porque falta a variável `NEXT_PUBLIC_WS_URL` no arquivo `.env`.

O Socket.IO está tentando conectar em `localhost:3001` em vez de `185.217.125.72:3001`, causando:
- ❌ Cross-Origin Request Blocked
- ❌ Internal Server Error 500
- ❌ Falha na conexão WebSocket

## ✅ Solução Automática

### Passo 1: No VPS, fazer pull do repositório

```bash
cd /root/crm
git pull origin main
```

### Passo 2: Dar permissão de execução ao script

```bash
chmod +x fix-cors-indicador-vps.sh
```

### Passo 3: Executar o script

```bash
./fix-cors-indicador-vps.sh
```

## 📝 O que o script faz automaticamente:

1. ✅ Adiciona `NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001` ao arquivo `.env`
2. ✅ Para os containers Docker
3. ✅ Rebuild do frontend (necessário para variáveis NEXT_PUBLIC_*)
4. ✅ Rebuild do backend
5. ✅ Inicia os containers novamente
6. ✅ Mostra os logs para verificação

## 🧪 Como Testar

Após executar o script:

1. Acesse: http://185.217.125.72:3000/indicador
2. Faça login com suas credenciais
3. Abra o Console do navegador (F12)
4. Deve aparecer: `✅ Socket.IO Indicador CONECTADO!`

## 🔍 Verificar Logs

Para acompanhar os logs em tempo real:

```bash
# Logs do frontend
docker-compose logs -f frontend

# Logs do backend
docker-compose logs -f backend

# Todos os logs
docker-compose logs -f
```

## 📊 Status dos Containers

```bash
docker-compose ps
```

## 🆘 Em Caso de Problemas

Se após executar o script ainda houver problemas:

```bash
# Ver logs completos
docker-compose logs

# Reiniciar containers
docker-compose restart

# Ou refazer todo o processo
docker-compose down
docker-compose up -d --build
```

## 📌 Notas Importantes

- O rebuild do frontend é **obrigatório** quando alteramos variáveis `NEXT_PUBLIC_*`
- Essas variáveis são compiladas no build time do Next.js
- O script aguarda 10 segundos após iniciar os containers para dar tempo de inicialização
- Os logs são exibidos automaticamente no final para verificação imediata
