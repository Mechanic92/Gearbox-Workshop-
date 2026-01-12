# Multi-stage Dockerfile for Gearbox Fintech
# 1. Build Stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Runtime Stage
FROM node:20-slim
WORKDIR /app

# Install system dependencies for SQLite/libsql if needed
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev && npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/public-site ./public-site
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application using tsx to avoid compilation headaches in production
CMD ["tsx", "src/server/index.ts"]
