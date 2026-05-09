FROM node:22-bookworm-slim

WORKDIR /app

# Instalar dependencias primero (cache de Docker).
# Usamos node:22-bookworm-slim (no alpine) porque sharp trae libvips precompilada
# para glibc; en alpine requeriría compilar libvips manualmente.
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# Carpeta para fotos (montada como volumen Docker; los archivos persisten fuera del contenedor).
RUN mkdir -p /app/uploads/pacientes && chown -R node:node /app/uploads

EXPOSE 5009

CMD ["node", "src/server.js"]
