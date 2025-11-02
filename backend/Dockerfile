# ==============================================
# MULTI-STAGE BUILD - BACKEND CRM PROTECAR
# ==============================================
# Stage 1: Base - Dependências comuns
# Stage 2: Development - Para desenvolvimento
# Stage 3: Builder - Compilação TypeScript
# Stage 4: Production - Imagem final otimizada

# ==============================================
# STAGE 1: BASE
# ==============================================
FROM node:20-alpine AS base

# Instalar dependências do sistema necessárias
# - ffmpeg: para processamento de áudio do WhatsApp
# - wget: para healthchecks
RUN apk add --no-cache \
    ffmpeg \
    wget \
    python3 \
    make \
    g++

WORKDIR /app

# Copiar package files
COPY package*.json ./

# ==============================================
# STAGE 2: DEVELOPMENT
# ==============================================
FROM base AS development

# Instalar TODAS as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3001

# Comando para desenvolvimento (com nodemon para hot reload)
CMD ["npm", "run", "dev"]

# ==============================================
# STAGE 3: BUILDER
# ==============================================
FROM base AS builder

# Instalar TODAS as dependências para build
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Limpar devDependencies
RUN npm prune --production

# ==============================================
# STAGE 4: PRODUCTION
# ==============================================
FROM node:20-alpine AS production

# Instalar apenas dependências runtime necessárias
RUN apk add --no-cache \
    ffmpeg \
    wget \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Copiar apenas arquivos necessários do builder
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations

# Criar diretórios necessários
RUN mkdir -p uploads/audios uploads/images uploads/videos uploads/documents \
    && chown -R nodejs:nodejs uploads

# Usar usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Comando para produção
CMD ["node", "dist/server.js"]
