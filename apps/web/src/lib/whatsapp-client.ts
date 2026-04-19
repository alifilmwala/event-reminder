/**
 * HTTP client that talks to the WhatsApp microservice.
 * All requests are signed with an HMAC-SHA256 header so the service
 * can reject forged calls from other origins.
 */
import { signPayload } from './token';
import { logger } from './logger';
import type { BatchGuestPayload } from '@/types';

const BASE_URL = process.env.WHATSAPP_SERVICE_URL ?? 'http://localhost:3001';
const SECRET   = process.env.WHATSAPP_SERVICE_SECRET ?? '';

interface ServiceResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function call<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<ServiceResponse<T>> {
  const url     = `${BASE_URL}${path}`;
  const bodyStr = body ? JSON.stringify(body) : '';
  const sig     = signPayload(bodyStr, SECRET);

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Signature': sig },
      body: bodyStr || undefined,
      signal: AbortSignal.timeout(15_000),
    });

    const json = await res.json() as T & { error?: string };

    if (!res.ok) {
      logger.warn('WhatsApp service error', { path, status: res.status });
      return { ok: false, error: (json as { error?: string }).error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: json };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('WhatsApp service unreachable', { path, error: msg });
    return { ok: false, error: msg };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const whatsappClient = {
  status(): Promise<ServiceResponse<{ status: string; phone?: string }>> {
    return call('GET', '/status');
  },

  qr(): Promise<ServiceResponse<{ qr: string }>> {
    return call('GET', '/qr');
  },

  /** Send to a single guest (used by the resend button). */
  sendToGuest(
    guestId: string,
    payload: { name: string; tableNumber: string; link: string; mobile: string; messageId: string },
  ): Promise<ServiceResponse<{ ok: boolean }>> {
    return call('POST', `/send/${guestId}`, payload);
  },

  /**
   * Trigger a batch send.
   * The web app resolves guest data and pre-creates message records,
   * then passes the full payload to the WA service so it needs no DB access.
   */
  sendBatch(guests: BatchGuestPayload[]): Promise<ServiceResponse<{ queued: number }>> {
    return call('POST', '/send-batch', { guests });
  },
};
