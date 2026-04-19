/**
 * POST /api/guests/bulk
 *
 * Bulk-import guests from a newline-separated text payload.
 * Each line: "Name, Mobile, TableNumber"
 * Existing mobiles are updated (upsert), new ones are inserted.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addGuestsBulk } from '@/lib/data';
import { BulkAddSchema, parseBulkLines } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  if (await rateLimit(ip, 'guests_bulk', 5, 60_000)) {
    return NextResponse.json({ error: 'Too many bulk import requests.' }, { status: 429 });
  }

  try {
    const body   = await req.json();
    const parsed = BulkAddSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const { valid, invalid } = parseBulkLines(parsed.data.lines);

    if (valid.length === 0) {
      return NextResponse.json({
        error:   'No valid guest lines found.',
        invalid: invalid.slice(0, 5), // return first few errors for debugging
      }, { status: 400 });
    }

    const result = await addGuestsBulk(valid);

    logger.info('Bulk import complete', { added: result.added, updated: result.updated, invalid: invalid.length });
    return NextResponse.json({ added: result.added, skipped: result.updated, invalidLines: invalid.length }, { status: 201 });
  } catch (err) {
    logger.error('Bulk import error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
