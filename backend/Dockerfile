# Dockerfile para Backend (Node.js + TypeScript)
FROM node:20-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["npm", "start"]
