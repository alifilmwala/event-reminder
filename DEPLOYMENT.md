# Deployment Guide & Production Hardening Checklist

## Table of Contents
1. [Local Development Setup](#1-local-development-setup)
2. [Database Setup](#2-database-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Deploying to Production (VPS + Vercel)](#4-deploying-to-production)
5. [WhatsApp Session Pairing](#5-whatsapp-session-pairing)
6. [Production Hardening Checklist](#6-production-hardening-checklist)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)

---

## 1. Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Git

### Steps

```bash
# 1. Clone & install
git clone https://github.com/yourorg/event-reminder.git
cd event-reminder
npm install

# 2. Set up environment variables
cp apps/web/.env.example apps/web/.env
cp apps/whatsapp-service/.env.example apps/whatsapp-service/.env
# Edit both .env files with real values

# 3. Start PostgreSQL
# Install from https://www.postgresql.org/download/ then:
sudo -u postgres psql -c "CREATE DATABASE event_reminder;"
sudo -u postgres psql -c "CREATE USER app_user WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE event_reminder TO app_user;"

# 4. Run database migrations
npm run db:push         # dev: push schema without migration files
# OR
npm run db:migrate      # creates migration files (use in CI/CD)

# 5. Seed default admin + sample event
npm run db:seed

# 6. Start both services
npm run dev
# Web app  → http://localhost:3000
# WA service → http://localhost:3001

# 7. Open http://localhost:3000/login
#    Email: admin@example.com  (or SEED_ADMIN_EMAIL)
#    Password: Admin@12345!    (or SEED_ADMIN_PASSWORD)
```

---

## 2. Database Setup

### Schema Migration (Production)

```bash
cd apps/web
# First time
npx prisma migrate deploy

# After schema changes
npx prisma migrate dev --name describe_change
npx prisma migrate deploy   # run on server
```

### Recommended PostgreSQL settings for production

```sql
-- In postgresql.conf
max_connections = 100
shared_buffers = 256MB
work_mem = 16MB
```

Add a connection pooler (PgBouncer) if you expect > 20 concurrent connections.

---

## 3. Environment Configuration

### apps/web/.env (production values)

```ini
APP_URL=https://yourdomain.com
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
AUTH_SECRET=<openssl rand -base64 32>      # MUST be 32+ chars
DATABASE_URL=postgresql://user:pass@host:5432/event_reminder?sslmode=require
WHATSAPP_SERVICE_URL=http://localhost:3001
WHATSAPP_SERVICE_SECRET=<openssl rand -hex 32>
EVENT_NAME="Your Event 2026"
EVENT_DATE=2026-12-31T19:00:00.000Z
EVENT_VENUE="The Grand Hall"
LOG_LEVEL=warn
```

### apps/whatsapp-service/.env

```ini
DATABASE_URL=postgresql://user:pass@host:5432/event_reminder?sslmode=require
PORT=3001
APP_URL=https://yourdomain.com
WHATSAPP_SERVICE_SECRET=<same value as web>
ALLOWED_ORIGINS=https://yourdomain.com
LOG_LEVEL=warn
NODE_ENV=production
```

---

## 4. Deploying to Production (VPS + Vercel)

### Architecture
```
Vercel (Next.js web app)
    │
    │  HTTP (internal)
    ▼
VPS (Ubuntu 22.04)
 ├── whatsapp-service (Node.js + Puppeteer)
 ├── PostgreSQL 16
 └── Nginx reverse proxy
```

### Step 1: VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql

# Create DB
sudo -u postgres psql -c "CREATE DATABASE event_reminder;"
sudo -u postgres psql -c "CREATE USER app_user WITH PASSWORD 'strong_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE event_reminder TO app_user;"
```

### Step 2: Deploy WhatsApp Service

```bash
# Clone repo on VPS
git clone https://github.com/yourorg/event-reminder.git /opt/event-reminder
cd /opt/event-reminder/apps/whatsapp-service

# Install dependencies
npm ci --legacy-peer-deps

# Run DB migrations (from web app)
cd ../web && npx prisma migrate deploy && cd ../whatsapp-service

# Build
npm run build

# Configure environment
cp .env.example .env && nano .env   # fill in real values

# Start with PM2
pm2 start dist/index.js --name "wa-service" --instances 1
pm2 save
pm2 startup
```

### Step 3: Nginx Configuration

```nginx
# /etc/nginx/sites-available/wa-service
server {
    listen 80;
    server_name api.yourdomain.com;

    # Only allow requests from Vercel IPs
    # (add Vercel's IP ranges here for additional security)

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/wa-service /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.yourdomain.com   # SSL with Let's Encrypt
sudo nginx -t && sudo systemctl reload nginx
```

### Step 4: Deploy Web App to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd apps/web
vercel --prod

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → add all from .env
```

---

## 5. WhatsApp Session Pairing

After the service starts for the first time:

1. Open the Admin Panel → **WhatsApp** tab
2. Click **Show QR Code**
3. On your phone: **WhatsApp → Linked Devices → Link a Device**
4. Scan the QR code
5. Status changes to **CONNECTED**

The session is persisted in `.wwebjs_auth/` — backed up alongside your app directory.
Re-scanning is only required if the session expires or is logged out.

---

## 6. Production Hardening Checklist

### Security
- [ ] `AUTH_SECRET` is 32+ random characters (never reused)
- [ ] `WHATSAPP_SERVICE_SECRET` is a strong random hex string
- [ ] Database password is strong; DB not exposed to public internet
- [ ] All secrets stored in environment variables, never in code
- [ ] HTTPS enabled on all public-facing endpoints (Let's Encrypt)
- [ ] Nginx configured to only allow Vercel's IP ranges to call the WA service
- [ ] Guest links are unguessable (256-bit token) and marked `noindex`
- [ ] File uploads restricted to CSV/XLS/XLSX, max 5 MB
- [ ] Rate limiting active on all mutation endpoints
- [ ] Input validated with Zod on every API route
- [ ] SQL injection impossible (Prisma parameterized queries)
- [ ] XSS prevented (React auto-escapes, CSP headers in next.config.js)
- [ ] CSRF protected (NextAuth CSRF token for credential login)
- [ ] Admin routes protected by session middleware
- [ ] Logs do not contain raw mobile numbers or tokens

### Database
- [ ] Automated daily backups configured (pg_dump + S3/R2)
- [ ] Backup restoration tested
- [ ] Connection pooling (PgBouncer) if > 20 concurrent clients
- [ ] Database user has minimum privileges (only the event_reminder DB)

### WhatsApp Service
- [ ] Runs on internal network only (not publicly accessible)
- [ ] PM2 restart policy: `pm2 start ... --restart-delay=5000`
- [ ] `.wwebjs_auth/` directory backed up regularly
- [ ] VPS has sufficient RAM (≥ 2 GB) for Chromium/Puppeteer
- [ ] Delay between messages ≥ 3 seconds to avoid WhatsApp bans

### Reliability
- [ ] PM2 cluster mode disabled for WA service (session is stateful)
- [ ] Health check endpoint `/health` monitored by uptime service (e.g. UptimeRobot)
- [ ] Alert on `failed` message count spike
- [ ] Log rotation configured via PM2 logrotate (`pm2 install pm2-logrotate`)

### Performance
- [ ] PostgreSQL indexes verified with `EXPLAIN ANALYZE`
- [ ] Static assets served via CDN (Vercel handles this automatically)

### Compliance
- [ ] Privacy policy informing guests their WhatsApp number is used for event reminders
- [ ] Opt-out mechanism documented (not sending to guests who request removal)
- [ ] Guest data deleted after event lifecycle (add a retention policy)

---

## 7. Monitoring & Maintenance

### PM2 commands
```bash
pm2 status                  # service status
pm2 logs wa-service         # tail logs
pm2 restart wa-service      # restart
pm2 monit                   # live CPU/memory dashboard
```

### Database maintenance
```bash
# Backup
pg_dump event_reminder > backup_$(date +%F).sql

# Restore
psql event_reminder < backup_2026-01-01.sql

# Prisma Studio (GUI)
cd apps/web && npx prisma studio
```

### Updating the application
```bash
git pull origin main
cd apps/web && npx prisma migrate deploy
pm2 restart wa-service
# Re-deploy Next.js: vercel --prod (or push to Vercel-linked branch)
```
