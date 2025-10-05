# Multi-stage build
FROM node:18-alpine AS builder

# Frontend build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Backend setup
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Copy built frontend and backend
COPY server-simple.js ./
COPY --from=builder /app/client/build ./client/build

# Production dependencies
RUN npm install express cors bcryptjs jsonwebtoken socket.io

EXPOSE 5000

CMD ["node", "server-simple.js"]