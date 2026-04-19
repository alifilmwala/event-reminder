/**
 * Express route handlers for the WhatsApp microservice.
 *
 * All mutating routes verify the X-Signature HMAC header to ensure
 * requests originate from the trusted Next.js web app.
 * No database access — data is supplied by the caller or obtained via
 * internal web-app API callbacks.
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { whatsapp, type GuestBatchItem } from './whatsapp';
import { logger } from './logger';

const router = Router();
const SECRET = process.env.WHATSAPP_SERVICE_SECRET ?? '';

// ─── Signature verification ────────────────────────────────────────────────

function verifySignature(body: string, signature: string): boolean {
  if (!SECRET) return true; // dev shortcut when secret not set
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function requireSignature(req: Request, res: Response, next: () => void) {
  const sig = req.headers['x-signature'] as string | undefined;
  if (!sig || !verifySignature((req as Request & { rawBody?: string }).rawBody ?? '', sig)) {
    logger.warn('Invalid or missing X-Signature', { ip: req.ip });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ─── Routes ────────────────────────────────────────────────────────────────

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// WhatsApp connection status
router.get('/status', (_req, res) => {
  res.json(whatsapp.getStatus());
});

// Base64 QR code for scanning
router.get('/qr', (_req, res) => {
  const qr = whatsapp.getQR();
  if (!qr) {
    const { status } = whatsapp.getStatus();
    if (status === 'CONNECTED') {
      res.json({ qr: null, message: 'Already connected — no QR needed.' });
    } else {
      res.status(503).json({ error: 'QR not yet available. Retry in a few seconds.' });
    }
    return;
  }
  res.json({ qr });
});

// Send to a single guest (all data provided by the web app)
router.post('/send/:guestId', requireSignature, async (req, res) => {
  const { guestId } = req.params;
  const { name, tableNumber, link, mobile, messageId } = req.body as {
    name:        string;
    tableNumber: string;
    link:        string;
    mobile:      string;
    messageId:   string;
  };

  if (!name || !tableNumber || !link || !mobile || !messageId) {
    res.status(400).json({ error: 'name, tableNumber, link, mobile, messageId are required' });
    return;
  }

  const result = await whatsapp.sendMessage(mobile, name, tableNumber, link);

  // Status is updated via the internal web-app callback inside sendBatch.
  // For single sends the caller (web app) updates status via /api/internal/message/:id.
  if (result.ok) {
    res.json({ ok: true });
  } else {
    res.status(502).json({ ok: false, error: result.error });
  }
});

// Trigger batch send — web app provides full guest list with pre-created message IDs
router.post('/send-batch', requireSignature, async (req, res) => {
  const { guests } = req.body as { guests?: GuestBatchItem[] };

  if (!Array.isArray(guests) || guests.length === 0) {
    res.status(400).json({ error: 'guests array required' });
    return;
  }

  // Respond immediately — batch processing is fire-and-forget
  res.json({ queued: guests.length });

  // Process in the background
  whatsapp.sendBatch(guests).catch((err) =>
    logger.error('Batch send error', { error: err }),
  );
});

export { router };

