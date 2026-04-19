/**
 * GET  /api/whatsapp  — proxy to WA service: connection status
 * POST /api/whatsapp  — assemble pending-guest payload and trigger batch send
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGuests, getMessages, addMessage } from '@/lib/data';
import { whatsappClient } from '@/lib/whatsapp-client';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import type { BatchGuestPayload } from '@/types';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await whatsappClient.status();
  if (!result.ok) {
    return NextResponse.json({ status: 'DISCONNECTED', error: result.error }, { status: 200 });
  }
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  if (await rateLimit(ip, 'wa_batch', 3, 60_000)) {
    return NextResponse.json({ error: 'Rate limited — wait before sending again.' }, { status: 429 });
  }

  try {
    const [guests, messages] = await Promise.all([getGuests(), getMessages()]);

    // Guests who have never received a SENT message
    const sentGuestIds = new Set(messages.filter((m) => m.status === 'SENT').map((m) => m.guestId));
    const pending       = guests.filter((g) => !sentGuestIds.has(g.id));

    if (pending.length === 0) {
      return NextResponse.json({ queued: 0, message: 'No pending guests.' });
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    // Pre-create PENDING message records and assemble payload
    const payload: BatchGuestPayload[] = await Promise.all(
      pending.map(async (g) => {
        const msg = await addMessage({ guestId: g.id, status: 'PENDING', sentAt: null, errorMsg: null, retries: 0 });
        return {
          guestId:     g.id,
          messageId:   msg.id,
          name:        g.name,
          mobile:      g.mobile,
          tableNumber: g.tableNumber,
          link:        `${appUrl}/g/${g.token}`,
        };
      }),
    );

    const result = await whatsappClient.sendBatch(payload);

    if (!result.ok) {
      logger.warn('Batch send rejected by WA service', { error: result.error });
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({ queued: payload.length });
  } catch (err) {
    logger.error('Batch trigger error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
