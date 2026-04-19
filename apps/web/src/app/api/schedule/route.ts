/**
 * GET  /api/schedule  — list all schedules
 * POST /api/schedule  — create a new schedule
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSchedules, addSchedule } from '@/lib/data';
import { CreateScheduleSchema } from '@/lib/validators';
import { logger } from '@/lib/logger';
import type { Schedule } from '@/types';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const schedules = await getSchedules();
  // Newest first
  schedules.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body   = await req.json();
    const parsed = CreateScheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
    }

    const scheduledAt = new Date(parsed.data.scheduledAt);
    if (scheduledAt <= new Date()) {
      return NextResponse.json({ error: 'Schedule time must be in the future.' }, { status: 400 });
    }

    const schedule = await addSchedule({
      scheduledAt: scheduledAt.toISOString(),
      type:        parsed.data.type as Schedule['type'],
      status:      'PENDING',
    });

    logger.info('Schedule created', { scheduleId: schedule.id, scheduledAt });
    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    logger.error('Create schedule error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
