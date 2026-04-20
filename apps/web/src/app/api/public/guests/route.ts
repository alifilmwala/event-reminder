/**
 * GET /api/public/guests
 * Public endpoint — returns guest names, table numbers, and card tokens.
 * Mobile numbers are intentionally excluded.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const guests = await prisma.guest.findMany({
    select: { id: true, name: true, tableNumber: true, token: true },
    orderBy: [{ tableNumber: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json(guests);
}
