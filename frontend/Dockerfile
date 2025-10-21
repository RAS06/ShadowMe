FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.js ./server.js
RUN npm install -g serve
EXPOSE 3001
CMD ["node", "server.js"]
