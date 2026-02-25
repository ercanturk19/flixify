# Flixify React SPA Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Package files'ı kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci

# Source kodu kopyala
COPY . .

# Production build al
RUN npm run build

# Production stage - Nginx
FROM nginx:alpine

# Nginx config'i kopyala
COPY nginx-flixify-final.conf /etc/nginx/conf.d/default.conf

# Build edilmiş dosyaları kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Port expose
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
