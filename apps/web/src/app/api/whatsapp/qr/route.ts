/**
 * GET /api/whatsapp/qr
 * Returns the WhatsApp QR code as base64 for the admin to scan.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { whatsappClient } from '@/lib/whatsapp-client';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await whatsappClient.qr();
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'QR not available' }, { status: 503 });
  }
  return NextResponse.json(result.data);
}
