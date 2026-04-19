/**
 * GET /api/stats
 *
 * Returns dashboard counters computed from the JSON data store.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStats } from '@/lib/data';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stats = await getStats();
  return NextResponse.json(stats);
}
