# Multi-stage Dockerfile for Gearbox Fintech (Railway-ready)
# 1. Build Stage — install all deps + build Vite frontend
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Runtime Stage — production deps only + tsx for server
FROM node:20-slim
WORKDIR /app

# System deps for TLS (Turso/LibSQL, Stripe, Xero, Twilio, SendGrid)
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install -g tsx

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source (tsx runs TS directly)
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/lib ./src/lib

# Copy static marketing site
COPY --from=builder /app/public-site ./public-site

# Copy migrations + config
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Railway injects PORT at runtime; default to 3000 for local Docker
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "const http=require('http');const r=http.get('http://localhost:'+(process.env.PORT||3000)+'/healthz',res=>{process.exit(res.statusCode===200?0:1)});r.on('error',()=>process.exit(1))"

CMD ["tsx", "src/server/index.ts"]
