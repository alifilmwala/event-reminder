# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY apps/whatsapp-service/package*.json ./
COPY package-lock.json ./
# Install all deps (including devDeps for tsc)
RUN npm ci --legacy-peer-deps

COPY apps/whatsapp-service/tsconfig.json ./
COPY apps/whatsapp-service/src ./src
RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner

# Install Chromium (apt resolves all deps automatically)
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/whatsapp-service/package*.json ./
COPY package-lock.json ./
# Production deps only
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

# Tell the app where to find Chromium
ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production
# WhatsApp session is stored under WA_SESSION_PATH.
# In Railway: add a Volume mounted at /data and set WA_SESSION_PATH=/data
ENV WA_SESSION_PATH=/data

VOLUME ["/data"]

EXPOSE 3001

CMD ["node", "dist/index.js"]
