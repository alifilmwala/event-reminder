# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
# Install all deps (including devDeps for tsc)
RUN npm ci --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner

# Install Chromium + all Puppeteer dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
# Production deps only
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

# Tell the app where to find Chromium
ENV CHROME_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# Persist WhatsApp session across restarts (mount a Railway volume here)
VOLUME ["/app/.wwebjs_auth"]

EXPOSE 3001

CMD ["node", "dist/index.js"]
