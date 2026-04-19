/**
 * POST /api/guests/[id]/resend
 *
 * Triggers a WhatsApp re-send for a specific guest.
 * Pre-creates a message record and calls the WA service synchronously.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGuestById, addMessage, updateMessage } from '@/lib/data';
import { whatsappClient } from '@/lib/whatsapp-client';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  if (await rateLimit(ip, 'resend', 20, 60_000)) {
    return NextResponse.json({ error: 'Too many resend requests.' }, { status: 429 });
  }

  try {
    const guest = await getGuestById(params.id);
    if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

    // Pre-create message record in PENDING state
    const message  = await addMessage({ guestId: guest.id, status: 'PENDING', sentAt: null, errorMsg: null, retries: 0 });
    const appUrl   = process.env.APP_URL ?? 'http://localhost:3000';
    const guestLink = `${appUrl}/g/${guest.token}`;

    const result = await whatsappClient.sendToGuest(guest.id, {
      name:        guest.name,
      tableNumber: guest.tableNumber,
      link:        guestLink,
      mobile:      guest.mobile,
      messageId:   message.id,
    });

    if (result.ok) {
      // Railway responds immediately with { queued: true } — status will be
      // updated asynchronously via the internal callback from the service.
      return NextResponse.json({ queued: true, messageId: message.id });
    } else {
      await updateMessage(message.id, { status: 'FAILED', errorMsg: result.error });
      logger.warn('WhatsApp resend failed', { guestId: params.id, error: result.error });
      return NextResponse.json({ sent: false, error: result.error }, { status: 502 });
    }
  } catch (err) {
    logger.error('Resend route error', { error: err, guestId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
