FROM node:18.17.0-alpine

WORKDIR /app

RUN npm config set registry https://registry.npm.taobao.org
RUN npm install -g pnpm@8.2.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm i

COPY . .

RUN pnpm build:atomicals-js
RUN pnpm build

EXPOSE 80

CMD ["npm", "start"]
