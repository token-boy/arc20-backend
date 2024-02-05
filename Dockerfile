FROM node:18.17.0-alpine

WORKDIR /app

ARG NPM_REGISTRY

RUN npm set registry $NPM_REGISTRY
RUN npm set strict-ssl false
RUN npm install -g pnpm@8.2.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm i

COPY atomicals-js ./atomicals-js
RUN npm run build:atomicals-js

COPY . .
RUN npm run build

EXPOSE 80

CMD ["npm", "start"]
