/**
 * High-level CRUD layer backed by Prisma / PostgreSQL.
 * All API routes import from here.
 */
import { prisma } from './prisma';
import { generateGuestToken } from './token';
import type {
  Guest,
  Message,
  EventConfig,
  Schedule,
  DashboardStats,
} from '@/types';

// helpers

function mapGuest(r: {
  id: string; name: string; mobile: string; tableNumber: string;
  token: string; linkVisited: boolean; visitedAt: Date | null; createdAt: Date;
}): Guest {
  return { ...r, visitedAt: r.visitedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() };
}

function mapMessage(r: {
  id: string; guestId: string; status: string; sentAt: Date | null;
  errorMsg: string | null; retries: number; createdAt: Date;
}): Message {
  return { ...r, status: r.status as Message['status'], sentAt: r.sentAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() };
}

function mapSchedule(r: {
  id: string; scheduledAt: Date; type: string; status: string; createdAt: Date;
}): Schedule {
  return { ...r, type: r.type as Schedule['type'], status: r.status as Schedule['status'], scheduledAt: r.scheduledAt.toISOString(), createdAt: r.createdAt.toISOString() };
}

// Guests

export async function getGuests(): Promise<Guest[]> {
  const rows = await prisma.guest.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(mapGuest);
}

export async function getGuestById(id: string): Promise<Guest | null> {
  const row = await prisma.guest.findUnique({ where: { id } });
  return row ? mapGuest(row) : null;
}

export async function getGuestByToken(token: string): Promise<Guest | null> {
  const row = await prisma.guest.findUnique({ where: { token } });
  return row ? mapGuest(row) : null;
}

export async function addGuest(input: { name: string; mobile: string; tableNumber: string }): Promise<{ guest: Guest; isNew: boolean }> {
  const existing = await prisma.guest.findUnique({ where: { mobile: input.mobile } });
  if (existing) {
    const updated = await prisma.guest.update({ where: { id: existing.id }, data: { name: input.name, tableNumber: input.tableNumber } });
    return { guest: mapGuest(updated), isNew: false };
  }
  const guest = await prisma.guest.create({ data: { name: input.name, mobile: input.mobile, tableNumber: input.tableNumber, token: generateGuestToken(), messages: { create: { status: 'PENDING' } } } });
  return { guest: mapGuest(guest), isNew: true };
}

export async function addGuestsBulk(inputs: Array<{ name: string; mobile: string; tableNumber: string }>): Promise<{ added: number; updated: number; guests: Guest[] }> {
  let added = 0; let updated = 0; const resultGuests: Guest[] = [];
  for (const input of inputs) {
    const existing = await prisma.guest.findUnique({ where: { mobile: input.mobile } });
    if (existing) {
      const row = await prisma.guest.update({ where: { id: existing.id }, data: { name: input.name, tableNumber: input.tableNumber } });
      updated++; resultGuests.push(mapGuest(row));
    } else {
      const row = await prisma.guest.create({ data: { name: input.name, mobile: input.mobile, tableNumber: input.tableNumber, token: generateGuestToken(), messages: { create: { status: 'PENDING' } } } });
      added++; resultGuests.push(mapGuest(row));
    }
  }
  return { added, updated, guests: resultGuests };
}

export async function updateGuest(id: string, data: Partial<Pick<Guest, 'name' | 'tableNumber' | 'linkVisited' | 'visitedAt'>>): Promise<Guest | null> {
  try {
    const row = await prisma.guest.update({ where: { id }, data: { ...data, visitedAt: data.visitedAt !== undefined ? (data.visitedAt ? new Date(data.visitedAt) : null) : undefined } });
    return mapGuest(row);
  } catch { return null; }
}

export async function deleteGuest(id: string): Promise<boolean> {
  try { await prisma.guest.delete({ where: { id } }); return true; } catch { return false; }
}

// Messages

export async function getMessages(): Promise<Message[]> {
  const rows = await prisma.message.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(mapMessage);
}

export async function getMessagesByGuestId(guestId: string): Promise<Message[]> {
  const rows = await prisma.message.findMany({ where: { guestId }, orderBy: { createdAt: 'asc' } });
  return rows.map(mapMessage);
}

export async function addMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
  const row = await prisma.message.create({ data: { guestId: data.guestId, status: data.status, sentAt: data.sentAt ? new Date(data.sentAt) : null, errorMsg: data.errorMsg ?? null, retries: data.retries ?? 0 } });
  return mapMessage(row);
}

export async function updateMessage(id: string, data: Partial<Omit<Message, 'id' | 'createdAt' | 'guestId'>>): Promise<Message | null> {
  try {
    const row = await prisma.message.update({ where: { id }, data: { ...data, sentAt: data.sentAt !== undefined ? (data.sentAt ? new Date(data.sentAt) : null) : undefined } });
    return mapMessage(row);
  } catch { return null; }
}

// Event

const DEFAULT_EVENT_DATA = {
  name:        process.env.EVENT_NAME  ?? 'Our Special Event',
  date:        process.env.EVENT_DATE  ?? '2026-12-31T19:00:00.000Z',
  venue:       process.env.EVENT_VENUE ?? '',
  description: '',
};

export async function getEvent(): Promise<EventConfig> {
  const row = await prisma.eventConfig.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default', ...DEFAULT_EVENT_DATA, date: new Date(DEFAULT_EVENT_DATA.date) } });
  return { ...row, date: row.date.toISOString() };
}

export async function updateEvent(data: Partial<Omit<EventConfig, 'id'>>): Promise<EventConfig> {
  const row = await prisma.eventConfig.upsert({ where: { id: 'default' }, update: { ...data, date: data.date ? new Date(data.date) : undefined }, create: { id: 'default', ...DEFAULT_EVENT_DATA, ...data, date: data.date ? new Date(data.date) : new Date(DEFAULT_EVENT_DATA.date) } });
  return { ...row, date: row.date.toISOString() };
}

// Schedules

export async function getSchedules(): Promise<Schedule[]> {
  const rows = await prisma.schedule.findMany({ orderBy: { scheduledAt: 'asc' } });
  return rows.map(mapSchedule);
}

export async function addSchedule(data: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
  const row = await prisma.schedule.create({ data: { scheduledAt: new Date(data.scheduledAt), type: data.type ?? 'REMINDER', status: data.status ?? 'PENDING' } });
  return mapSchedule(row);
}

export async function updateSchedule(id: string, data: Partial<Pick<Schedule, 'status'>>): Promise<Schedule | null> {
  try { const row = await prisma.schedule.update({ where: { id }, data }); return mapSchedule(row); } catch { return null; }
}

export async function deleteSchedule(id: string): Promise<boolean> {
  try { await prisma.schedule.delete({ where: { id } }); return true; } catch { return false; }
}

// Stats

export async function getStats(): Promise<DashboardStats & { recentActivity: { day: string; sent: number }[] }> {
  const [totalGuests, linkVisitedCount] = await Promise.all([prisma.guest.count(), prisma.guest.count({ where: { linkVisited: true } })]);
  const sentGuestRows = await prisma.message.findMany({ where: { status: 'SENT' }, select: { guestId: true }, distinct: ['guestId'] });
  const sentSet = new Set(sentGuestRows.map((r) => r.guestId));
  const sentCount = sentSet.size;
  const pendingCount = totalGuests - sentCount;
  const latestMsgs = await prisma.$queryRaw<{ guestId: string; status: string }[]>`SELECT DISTINCT ON ("guestId") "guestId", status FROM messages ORDER BY "guestId", "createdAt" DESC`;
  const failedCount = latestMsgs.filter((m) => m.status === 'FAILED' && !sentSet.has(m.guestId)).length;
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentMsgs = await prisma.message.findMany({ where: { status: 'SENT', sentAt: { gte: cutoff } }, select: { sentAt: true } });
  const activityMap = new Map<string, number>();
  for (const msg of recentMsgs) { if (msg.sentAt) { const day = msg.sentAt.toISOString().slice(0, 10); activityMap.set(day, (activityMap.get(day) ?? 0) + 1); } }
  const recentActivity = Array.from(activityMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([day, sent]) => ({ day, sent }));
  return { totalGuests, sentCount, pendingCount, failedCount, linkVisitedCount, recentActivity };
}
