/**
 * WhatsApp Microservice — Entry Point
 *
 * Starts an Express HTTP server that:
 *  1. Exposes REST endpoints for the Next.js app to query/trigger
 *  2. Manages the whatsapp-web.js client lifecycle
 *  3. Runs the cron scheduler for timed batch sends
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import { router } from './routes';
import { whatsapp } from './whatsapp';
import { startScheduler } from './scheduler';
import { logger } from './logger';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const app  = express();

// ─── Security / parsing middleware ─────────────────────────────────────────

// Capture raw body for HMAC verification, then parse JSON from it
app.use((req, res, next) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => { chunks.push(chunk); });
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    (req as express.Request & { rawBody: string }).rawBody = raw;
    if (raw && req.headers['content-type']?.includes('application/json')) {
      try {
        req.body = JSON.parse(raw);
      } catch {
        res.status(400).json({ error: 'Invalid JSON' });
        return;
      }
    }
    next();
  });
});

// Rate limit: 60 requests/minute globally
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests' },
  }),
);

// Basic CORS — only allow requests from the Next.js origin
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Signature');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// Remove fingerprinting headers
app.disable('x-powered-by');

// ─── Routes ────────────────────────────────────────────────────────────────

app.use('/', router);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Bootstrap ─────────────────────────────────────────────────────────────

async function bootstrap() {
  // Start WhatsApp client
  await whatsapp.initialize();

  // Start cron scheduler
  startScheduler();

  // Start HTTP server
  app.listen(PORT, () => {
    logger.info(`WhatsApp service listening on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start service', { error: err });
  process.exit(1);
});

// Graceful shutdown
function shutdown(signal: string) {
  logger.info(`Received ${signal} — shutting down…`);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
