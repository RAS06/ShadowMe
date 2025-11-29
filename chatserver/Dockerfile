FROM node:18-alpine
WORKDIR /app

# install deps first (leverage Docker cache)
COPY package*.json ./
RUN npm install --production

# copy the rest of the source so patched files are included
COPY . .

EXPOSE 4000
CMD ["node", "server.js"]
