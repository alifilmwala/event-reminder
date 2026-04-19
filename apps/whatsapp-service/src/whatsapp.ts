/**
 * WhatsApp Client Manager
 *
 * Wraps whatsapp-web.js with:
 *  - Persistent session storage (LocalAuth)
 *  - QR generation as base64 PNG via the `qrcode` library
 *  - Connection state tracking
 *  - Single-message send with retry logic
 *  - Batch send (fire-and-forget; calls back to web API for status updates)
 */
import path from 'path';
import os from 'os';
import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { logger } from './logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WAStatus = 'INITIALIZING' | 'QR_PENDING' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

export interface GuestBatchItem {
  guestId:     string;
  messageId:   string;
  name:        string;
  mobile:      string;
  tableNumber: string;
  link:        string;
}

export interface GroupParticipant {
  id:      string;
  mobile:  string;
  isAdmin: boolean;
}

export interface GroupInfo {
  id:           string;
  name:         string;
  participants: GroupParticipant[];
}

// ─── Web-API callbacks ────────────────────────────────────────────────────────

const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://localhost:3000';
const SECRET      = process.env.WHATSAPP_SERVICE_SECRET ?? '';

export async function updateMessageStatus(
  messageId: string,
  status: 'SENDING' | 'SENT' | 'FAILED',
  sentAt: string | null,
  errorMsg: string | null,
): Promise<void> {
  try {
    await fetch(`${WEB_APP_URL}/api/internal/message/${messageId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': SECRET },
      body:    JSON.stringify({ status, sentAt, errorMsg }),
      signal:  AbortSignal.timeout(8_000),
    });
  } catch (err) {
    logger.warn('Failed to update message status', { messageId, error: err });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── WhatsApp Manager ─────────────────────────────────────────────────────────

class WhatsAppManager {
  private client: Client;
  private status: WAStatus  = 'INITIALIZING';
  private qrBase64: string | null = null;
  private phone: string | null    = null;

  constructor() {
    const chromePath = process.env.CHROME_EXECUTABLE_PATH
      || (process.platform === 'win32'
          ? path.join(os.homedir(), '.cache', 'puppeteer', 'chrome', 'win64-147.0.7727.56', 'chrome-win64', 'chrome.exe')
          : '/usr/bin/chromium');

    logger.info('Using Chromium', { chromePath });

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'event-reminder' }),
      puppeteer: {
        headless: true,
        executablePath: chromePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu',
          '--disable-features=site-per-process',
        ],
      },
    });

    this.attachEvents();
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  private attachEvents() {
    this.client.on('qr', async (qr) => {
      logger.info('QR code received — waiting for scan');
      this.status = 'QR_PENDING';
      try {
        const dataUrl  = await QRCode.toDataURL(qr);
        this.qrBase64  = dataUrl.replace(/^data:image\/png;base64,/, '');
      } catch (err) {
        logger.error('Failed to generate QR image', { error: err });
      }
    });

    this.client.on('loading_screen', (percent) => {
      logger.info(`WhatsApp loading: ${percent}%`);
      this.status = 'CONNECTING';
    });

    this.client.on('authenticated', () => {
      logger.info('WhatsApp authenticated');
      this.qrBase64 = null;
    });

    this.client.on('ready', async () => {
      this.status   = 'CONNECTED';
      this.qrBase64 = null;
      try {
        this.phone = this.client.info.wid.user;
        logger.info('WhatsApp ready', { phone: this.phone });
      } catch {
        logger.info('WhatsApp ready');
      }
    });

    this.client.on('disconnected', (reason) => {
      logger.warn('WhatsApp disconnected', { reason });
      this.status = 'DISCONNECTED';
      this.phone  = null;
      setTimeout(() => void this.initialize(), 10_000);
    });

    this.client.on('auth_failure', (msg) => {
      logger.error('WhatsApp auth failure', { msg });
      this.status = 'DISCONNECTED';
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    logger.info('Initializing WhatsApp client…');
    this.status = 'INITIALIZING';
    try {
      await this.client.initialize();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const cause = err instanceof Error && (err as Error & { cause?: unknown }).cause;
      logger.error('Failed to initialize WhatsApp client', { error: msg, cause });
      this.status = 'DISCONNECTED';
    }
  }

  // ── Public getters ────────────────────────────────────────────────────────

  getStatus(): { status: WAStatus; phone: string | null } {
    return { status: this.status, phone: this.phone };
  }

  getQR(): string | null {
    return this.qrBase64;
  }

  isReady(): boolean {
    return this.status === 'CONNECTED';
  }

  /**
   * Fetch all WhatsApp groups and their participants.
   * Returns groups whose names look like table references (contain a number).
   */
  async getGroups(): Promise<{ ok: boolean; groups?: GroupInfo[]; error?: string }> {
    if (!this.isReady()) {
      return { ok: false, error: 'WhatsApp client not connected.' };
    }
    try {
      // getChats() can hang indefinitely if the browser is unresponsive — cap at 20s
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getChats() timed out after 20s')), 20_000),
      );

      const chats = await Promise.race([this.client.getChats(), timeoutPromise]);
      const groups: GroupInfo[] = [];

      for (const chat of chats) {
        if (!chat.isGroup) continue;
        const groupChat = chat as import('whatsapp-web.js').GroupChat;
        const participants = groupChat.participants ?? [];

        groups.push({
          id:           groupChat.id._serialized,
          name:         groupChat.name,
          participants: participants.map((p) => ({
            id:     p.id._serialized,
            mobile: p.id.user,
            isAdmin: p.isAdmin ?? false,
          })),
        });
      }

      return { ok: true, groups };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('getGroups failed', { error: msg });
      return { ok: false, error: msg };
    }
  }

  // ── Messaging ─────────────────────────────────────────────────────────────

  private buildMessage(name: string, tableNumber: string, link: string): string {
    return (
      `Hello *${name}* 👋\n\n` +
      `We look forward to seeing you at our upcoming event!\n\n` +
      `🪑 *Your Thaal Number: ${tableNumber}*\n\n` +
      `Open your personalized reminder card:\n` +
      `${link}\n\n` +
      `_Please save this message for reference at the venue._`
    );
  }

  /**
   * Send a WhatsApp message to a single mobile number.
   * Retries up to maxRetries times with exponential back-off.
   */
  async sendMessage(
    mobile:      string,
    name:        string,
    tableNumber: string,
    link:        string,
    maxRetries = 2,
  ): Promise<{ ok: boolean; error?: string }> {
    if (!this.isReady()) {
      return { ok: false, error: 'WhatsApp client not connected.' };
    }

    const chatId = `${mobile.replace('+', '')}@c.us`;
    const text   = this.buildMessage(name, tableNumber, link);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.client.sendMessage(chatId, text);
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt < maxRetries) {
          await sleep((attempt + 1) * 2_000);
        } else {
          return { ok: false, error: msg };
        }
      }
    }

    return { ok: false, error: 'Max retries exceeded.' };
  }

  /**
   * Send messages to a list of guests (provided by the web app).
   * Each guest already has a pre-created messageId.
   * Status is synced back to the web app via internal API callbacks.
   * Processes sequentially to avoid WhatsApp rate limits.
   */
  async sendBatch(guests: GuestBatchItem[], delayMs = 3_000): Promise<{ sent: number; failed: number }> {
    logger.info('Starting batch send', { total: guests.length });

    let sent   = 0;
    let failed = 0;

    for (const guest of guests) {
      await updateMessageStatus(guest.messageId, 'SENDING', null, null);

      const result = await this.sendMessage(guest.mobile, guest.name, guest.tableNumber, guest.link);

      if (result.ok) {
        await updateMessageStatus(guest.messageId, 'SENT', new Date().toISOString(), null);
        sent++;
        logger.info('Message sent', { guestId: guest.guestId });
      } else {
        await updateMessageStatus(guest.messageId, 'FAILED', null, result.error ?? null);
        failed++;
        logger.warn('Message failed', { guestId: guest.guestId, error: result.error });
      }

      if (guests.indexOf(guest) < guests.length - 1) {
        await sleep(delayMs);
      }
    }

    logger.info('Batch send complete', { sent, failed });
    return { sent, failed };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const whatsapp = new WhatsAppManager();

