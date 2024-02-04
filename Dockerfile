FROM node:18.17.0-alpine

WORKDIR /app

RUN npm install -g pnpm@8.2.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm i

RUN npm run build:atomicals-js

COPY . .

RUN npm run build

EXPOSE 80

CMD ["npm", "start"]
