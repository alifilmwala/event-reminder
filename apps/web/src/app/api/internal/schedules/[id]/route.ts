/**
 * PATCH /api/internal/schedules/[id]
 *
 * Called by the WhatsApp service to update a schedule's status
 * (RUNNING → COMPLETED / FAILED). Protected by X-Internal-Secret header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateSchedule } from '@/lib/data';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const SECRET = process.env.WHATSAPP_SERVICE_SECRET ?? '';

const UpdateSchema = z.object({
  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']),
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

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!verifySecret(req)) {
    logger.warn('Internal route: invalid secret', { route: 'schedules/[id]', id: params.id });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body   = await req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const updated = await updateSchedule(params.id, { status: parsed.data.status });
    if (!updated) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error('Internal schedule update error', { error: err, id: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
