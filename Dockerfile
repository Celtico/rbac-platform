# Multi-stage build for Album Manager
# 1. Build Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 2. Build Backend
FROM node:20-alpine AS build-backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# 3. Final Image
FROM node:20-alpine
WORKDIR /app

# Install production dependencies for server
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy built assets
COPY --from=build-backend /app/server/dist ./server/dist
COPY --from=build-frontend /app/client/dist ./client/dist

# Create uploads folder
RUN mkdir -p /app/server/uploads

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# We need a small script to serve both or use NestJS to serve frontend
# Let's modify NestJS slightly to serve the frontend dist in production
# Or just copy the frontend to where Nest can serve it.

CMD ["node", "server/dist/main"]
