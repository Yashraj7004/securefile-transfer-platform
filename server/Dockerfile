FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p storage/encrypted storage/temp

EXPOSE 5000

CMD ["node", "src/server.js"]
