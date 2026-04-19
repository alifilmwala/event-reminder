/**
 * GET  /api/guests  — paginated guest list with search & status filter
 * POST /api/guests  — create a single guest manually
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGuests, getMessages, addGuest } from '@/lib/data';
import { SearchGuestSchema, AddGuestSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import type { GuestWithStats, Message } from '@/types';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = SearchGuestSchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query params', details: parsed.error.flatten() }, { status: 400 });
  }

  const { query, page, pageSize, status } = parsed.data;

  const [allGuests, allMessages] = await Promise.all([getGuests(), getMessages()]);

  // Build latest-message map
  const latestByGuest = new Map<string, Message>();
  for (const msg of allMessages) {
    const prev = latestByGuest.get(msg.guestId);
    if (!prev || msg.createdAt > prev.createdAt) latestByGuest.set(msg.guestId, msg);
  }

  // Filter
  let filtered = allGuests as GuestWithStats[];
  filtered = filtered.map((g) => ({ ...g, latestMessage: latestByGuest.get(g.id) ?? null }));

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (g) => g.name.toLowerCase().includes(q) || g.mobile.includes(q),
    );
  }

  if (status !== 'ALL') {
    filtered = filtered.filter((g) => g.latestMessage?.status === status);
  }

  // Sort newest first
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total      = filtered.length;
  const skip       = (page - 1) * pageSize;
  const paginated  = filtered.slice(skip, skip + pageSize);

  return NextResponse.json({
    data:       paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  if (await rateLimit(ip, 'guests_create', 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body   = await req.json();
    const parsed = AddGuestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { guest, isNew } = await addGuest(parsed.data);
    return NextResponse.json(guest, { status: isNew ? 201 : 200 });
  } catch (err) {
    logger.error('Create guest error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
