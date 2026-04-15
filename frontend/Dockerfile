FROM node:20-alpine AS build-env

ARG VITE_API_URL=http://localhost/api
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM node:20-alpine AS production-dependencies-env

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev


FROM node:20-alpine

WORKDIR /app

COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build

RUN npm install -g serve

CMD ["serve", "-s", "build/client", "-l", "3000"]
