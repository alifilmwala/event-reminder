/**
 * DELETE /api/schedule/[id]  — cancel a PENDING schedule
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSchedules, updateSchedule } from '@/lib/data';
import { logger } from '@/lib/logger';

type Params = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const schedules = await getSchedules();
    const schedule  = schedules.find((s) => s.id === params.id);

    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    if (schedule.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel a schedule with status ${schedule.status}.` },
        { status: 409 },
      );
    }

    await updateSchedule(params.id, { status: 'CANCELLED' });
    return NextResponse.json({ cancelled: true });
  } catch (err) {
    logger.error('Cancel schedule error', { error: err, id: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
