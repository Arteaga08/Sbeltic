FROM node:22-alpine

WORKDIR /app

# Instalar dependencias primero (cache de Docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

EXPOSE 5009

CMD ["node", "src/server.js"]
