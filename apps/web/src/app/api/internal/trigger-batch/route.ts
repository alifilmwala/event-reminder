/**
 * POST /api/internal/trigger-batch
 *
 * Called by the WhatsApp service scheduler to kick off a scheduled batch.
 * The web app marks the schedule as RUNNING, builds the guest payload,
 * pre-creates message records, and calls the WA service /send-batch endpoint.
 * Protected by X-Internal-Secret header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getGuests, addMessage, updateSchedule } from '@/lib/data';
import { whatsappClient } from '@/lib/whatsapp-client';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import type { BatchGuestPayload } from '@/types';

const SECRET = process.env.WHATSAPP_SERVICE_SECRET ?? '';

const BodySchema = z.object({
  scheduleId: z.string().min(1),
});

function verifySecret(req: NextRequest): boolean {
  if (!SECRET) return true;
  const provided = req.headers.get('x-internal-secret') ?? '';
  if (provided.length !== SECRET.length) return false;
  let diff = 0;
  for (let i = 0; i < SECRET.length; i++) {
    diff |= provided.charCodeAt(i) ^ SECRET.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    logger.warn('Internal route: invalid secret', { route: 'trigger-batch' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'scheduleId required' }, { status: 400 });
  }

  const { scheduleId } = parsed.data;

  // Mark schedule as RUNNING
  await updateSchedule(scheduleId, { status: 'RUNNING' });

  const guests = await getGuests();

  if (guests.length === 0) {
    await updateSchedule(scheduleId, { status: 'COMPLETED' });
    return NextResponse.json({ queued: 0 });
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  const payload: BatchGuestPayload[] = await Promise.all(
    guests.map(async (g) => {
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
    logger.warn('Scheduled batch rejected by WA service', { scheduleId, error: result.error });
    await updateSchedule(scheduleId, { status: 'FAILED' });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ queued: payload.length, scheduleId });
}
