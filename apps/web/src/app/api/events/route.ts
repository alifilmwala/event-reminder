/**
 * GET   /api/events  — return the single event configuration
 * PATCH /api/events  — update event name / date / venue / description
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEvent, updateEvent } from '@/lib/data';
import { UpdateEventSchema } from '@/lib/validators';
import { logger } from '@/lib/logger';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await getEvent();
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body   = await req.json();
    const parsed = UpdateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const event = await updateEvent(parsed.data);
    return NextResponse.json(event);
  } catch (err) {
    logger.error('Update event error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
