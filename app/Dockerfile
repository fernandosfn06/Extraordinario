FROM node:18-alpine

RUN apk add --no-cache qpdf

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p uploads/originals uploads/qr uploads/with-qr

EXPOSE 3000

CMD ["node", "server.js"]
