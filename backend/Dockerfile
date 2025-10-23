# Backend Dockerfile
FROM node:18-alpine

# Install necessary tools
RUN apk add --no-cache bash

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install
RUN npx prisma generate

# Copy wait-for-it script
COPY wait-for-it.sh ./
RUN chmod +x wait-for-it.sh

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# The command will be provided by docker-compose.yml
