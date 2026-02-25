# IPTV Proxy Server Dockerfile
FROM node:20-alpine

WORKDIR /app

# Package files'ı kopyala
COPY package*.json ./

# Bağımlılıkları yükle (production)
RUN npm ci --only=production

# Source kodu kopyala
COPY server.js ./

# Port expose
EXPOSE 3001

CMD ["node", "server.js"]
