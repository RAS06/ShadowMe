# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create directory for seed-token.json
RUN mkdir -p /app/frontend/public

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
