/**
 * PATCH /api/internal/message/[id]
 *
 * Called by the WhatsApp service to update the delivery status of a
 * pre-created message record. Protected by X-Internal-Secret header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateMessage } from '@/lib/data';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const SECRET = process.env.WHATSAPP_SERVICE_SECRET ?? '';

const UpdateSchema = z.object({
  status:   z.enum(['PENDING', 'SENDING', 'SENT', 'FAILED', 'SKIPPED']),
  sentAt:   z.string().datetime().nullable().optional(),
  errorMsg: z.string().max(500).nullable().optional(),
});

function verifySecret(req: NextRequest): boolean {
  if (!SECRET) return true; // dev shortcut when secret is not configured
  const provided = req.headers.get('x-internal-secret') ?? '';
  // Constant-time comparison to prevent timing attacks
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
    logger.warn('Internal route: invalid secret', { route: 'message/[id]', id: params.id });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body   = await req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const updated = await updateMessage(params.id, {
      status:   parsed.data.status,
      sentAt:   parsed.data.sentAt ?? null,
      errorMsg: parsed.data.errorMsg ?? null,
    });

    if (!updated) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    logger.error('Internal message update error', { error: err, id: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
