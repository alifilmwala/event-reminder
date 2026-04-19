/**
 * GET /api/internal/schedules/due
 *
 * Returns all PENDING schedules whose scheduledAt time has passed.
 * Called by the WhatsApp service cron every minute.
 * Protected by X-Internal-Secret header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSchedules } from '@/lib/data';
import { logger } from '@/lib/logger';

const SECRET = process.env.WHATSAPP_SERVICE_SECRET ?? '';

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

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    logger.warn('Internal route: invalid secret', { route: 'schedules/due' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now       = new Date().toISOString();
    const schedules = await getSchedules();
    const due       = schedules.filter((s) => s.status === 'PENDING' && s.scheduledAt <= now);
    return NextResponse.json(due);
  } catch (err) {
    logger.error('Internal due-schedules error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
