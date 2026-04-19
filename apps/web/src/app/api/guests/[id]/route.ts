/**
 * GET    /api/guests/[id]  — fetch single guest with recent messages
 * PATCH  /api/guests/[id]  — update name / tableNumber
 * DELETE /api/guests/[id]  — permanently delete guest and their messages
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGuestById, getMessages, updateGuest, deleteGuest } from '@/lib/data';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const UpdateSchema = z.object({
  name:        z.string().trim().min(1).max(100).optional(),
  tableNumber: z.string().trim().min(1).max(20).optional(),
});

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const guest = await getGuestById(params.id);
  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

  const allMessages = await getMessages();
  const messages = allMessages
    .filter((m) => m.guestId === params.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return NextResponse.json({ ...guest, messages });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body   = await req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    const guest = await updateGuest(params.id, parsed.data);
    if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    return NextResponse.json(guest);
  } catch (err) {
    logger.error('Patch guest error', { error: err, id: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const ok = await deleteGuest(params.id);
    if (!ok) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    logger.error('Delete guest error', { error: err, id: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
