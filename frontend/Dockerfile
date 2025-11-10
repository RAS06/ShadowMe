# Development stage - includes all dependencies for hot reload
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
# Default dev command (can be overridden by docker-compose)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]

# Production build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage - serves static files
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.js ./server.js
EXPOSE 3001
CMD ["node", "server.js"]
