/**
 * GET /api/public/guests
 * Public endpoint — returns guest names, mobile numbers, table numbers, and card tokens.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const guests = await prisma.guest.findMany({
    select: { id: true, name: true, mobile: true, tableNumber: true, token: true },
    orderBy: [{ tableNumber: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json(guests);
}
