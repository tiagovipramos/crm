# CORREÇÃO MANUAL - ERRO CORS INDICADOR

## Problema Identificado
O erro de CORS ocorre porque falta a variável `NEXT_PUBLIC_WS_URL` no arquivo `.env` do VPS.
O Socket.IO está tentando conectar em `localhost:3001` em vez de `185.217.125.72:3001`.

## Solução Rápida (3 comandos)

### 1. Conecte ao VPS via SSH:
```bash
ssh root@185.217.125.72
```

### 2. Execute este comando único para corrigir tudo:
```bash
cd /root/crm && \
echo "" >> .env && \
echo "# Socket.IO WebSocket URL" >> .env && \
echo "NEXT_PUBLIC_WS_URL=http://185.217.125.72:3001" >> .env && \
docker-compose down && \
docker-compose build --no-cache frontend && \
docker-compose build --no-cache backend && \
docker-compose up -d && \
sleep 10 && \
docker-compose logs --tail=30 frontend && \
docker-compose logs --tail=30 backend
```

### 3. Teste o resultado:
- Acesse: http://185.217.125.72:3000/indicador
- Faça login
