FROM node:20-alpine

WORKDIR /app

# Copiar código del proyecto necesario
COPY package.json ./
COPY src/api ./src/api
COPY stream-service ./stream-service

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "stream-service/server.js"]
