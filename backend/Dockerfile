# Dockerfile para Backend (Node.js + TypeScript)
# Stage 1: Build
FROM node:20-alpine AS builder

# Instalar git e outras ferramentas necessárias
RUN apk add --no-cache git python3 make g++

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Instalar git e outras ferramentas necessárias para dependências nativas
RUN apk add --no-cache git python3 make g++

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar código compilado do stage anterior
COPY --from=builder /app/dist ./dist

# Copiar migrations e outros arquivos necessários
COPY migrations ./migrations

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["npm", "start"]
