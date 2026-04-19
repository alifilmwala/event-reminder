/**
 * POST /api/guests/import-groups
 *
 * Fetches WhatsApp groups from the WA microservice, extracts table numbers
 * from group names, and bulk-upserts participants as guests.
 *
 * Group name format (flexible): anything containing a number, e.g.
 *   "Table 1", "T-3", "Thaal 5", "Group 12"
 * The first number found in the group name becomes the tableNumber.
 *
 * Participants are imported with their mobile number. Name defaults to
 * the mobile number until manually updated.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addGuestsBulk } from '@/lib/data';
import { whatsappClient } from '@/lib/whatsapp-client';
import { logger } from '@/lib/logger';

/** Extract the first integer found in a string, or null */
function extractTableNumber(groupName: string): string | null {
  const match = groupName.match(/\d+/);
  return match ? match[0] : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Optional: caller can pass { onlyGroups: ["Table 1", "Table 3"] } to limit scope
  let onlyGroups: string[] | undefined;
  try {
    const body = await req.json().catch(() => ({})) as { onlyGroups?: string[] };
    if (Array.isArray(body.onlyGroups)) onlyGroups = body.onlyGroups;
  } catch { /* ignore */ }

  const result = await whatsappClient.getGroups();
  if (!result.ok || !result.data) {
    logger.warn('import-groups: WA service unavailable', { error: result.error });
    return NextResponse.json({ error: result.error ?? 'WhatsApp service unavailable' }, { status: 502 });
  }

  const { groups } = result.data;

  const toImport: Array<{ name: string; mobile: string; tableNumber: string }> = [];
  const skippedGroups: string[] = [];

  for (const group of groups) {
    if (onlyGroups && !onlyGroups.includes(group.name)) continue;

    const tableNumber = extractTableNumber(group.name);
    if (!tableNumber) {
      skippedGroups.push(group.name);
      continue;
    }

    for (const p of group.participants) {
      // Skip numbers that look like short-codes or are too short
      if (p.mobile.length < 7) continue;
      toImport.push({
        name:        p.mobile,   // placeholder name; admin can update later
        mobile:      `+${p.mobile}`,
        tableNumber,
      });
    }
  }

  if (toImport.length === 0) {
    return NextResponse.json({
      added:         0,
      updated:       0,
      skippedGroups,
      message:       'No participants found to import.',
    });
  }

  const imported = await addGuestsBulk(toImport);

  logger.info('import-groups complete', {
    added:         imported.added,
    updated:       imported.updated,
    skippedGroups: skippedGroups.length,
  });

  return NextResponse.json({
    added:         imported.added,
    updated:       imported.updated,
    skippedGroups,
  }, { status: 201 });
}

/** GET — preview groups without importing */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await whatsappClient.getGroups();
  if (!result.ok || !result.data) {
    return NextResponse.json({ error: result.error ?? 'WhatsApp service unavailable' }, { status: 502 });
  }

  const preview = result.data.groups.map((g) => ({
    name:        g.name,
    tableNumber: extractTableNumber(g.name),
    memberCount: g.participants.length,
  }));

  return NextResponse.json({ groups: preview });
}
