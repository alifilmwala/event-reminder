import { z } from 'zod';

// ─── Indian mobile number ─────────────────────────────────────────────────────

const INDIAN_MOBILE_RE = /^(?:\+?91)?[6-9]\d{9}$/;

export function isValidIndianMobile(raw: string): boolean {
  return INDIAN_MOBILE_RE.test(raw.replace(/[\s\-().]/g, ''));
}

export function normalizeIndianMobile(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('+91')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return cleaned;
}

// ─── Add / Edit guest ────────────────────────────────────────────────────────

export const AddGuestSchema = z.object({
  name:        z.string().trim().min(1, 'Name is required').max(100),
  mobile:      z.string().trim().refine(isValidIndianMobile, { message: 'Invalid Indian mobile number' }),
  tableNumber: z.string().trim().min(1, 'Table number is required').max(20),
});

export type AddGuestInput = z.infer<typeof AddGuestSchema>;

// ─── Bulk add (newline-separated "Name, Mobile, Table") ──────────────────────

export const BulkAddSchema = z.object({
  lines: z.string().min(1, 'Paste at least one line'),
});

/** Parse bulk text: each line → "Name, Mobile, Table" */
export function parseBulkLines(text: string): {
  valid:   Array<{ name: string; mobile: string; tableNumber: string }>;
  invalid: Array<{ line: number; raw: string; error: string }>;
} {
  const valid:   ReturnType<typeof parseBulkLines>['valid']   = [];
  const invalid: ReturnType<typeof parseBulkLines>['invalid'] = [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim());
    if (parts.length < 3) {
      invalid.push({ line: i + 1, raw: lines[i], error: 'Expected: Name, Mobile, TableNumber' });
      continue;
    }
    const [name, mobile, tableNumber] = parts;
    const result = AddGuestSchema.safeParse({ name, mobile, tableNumber });
    if (result.success) {
      valid.push({ ...result.data, mobile: normalizeIndianMobile(result.data.mobile) });
    } else {
      invalid.push({ line: i + 1, raw: lines[i], error: result.error.errors[0]?.message ?? 'Invalid' });
    }
  }

  return { valid, invalid };
}

// ─── Search / pagination ──────────────────────────────────────────────────────

export const SearchGuestSchema = z.object({
  query:    z.string().trim().max(100).optional(),
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status:   z.enum(['ALL', 'PENDING', 'SENT', 'FAILED']).default('ALL'),
});

export type SearchGuestInput = z.infer<typeof SearchGuestSchema>;

// ─── Schedule ────────────────────────────────────────────────────────────────

export const CreateScheduleSchema = z.object({
  scheduledAt: z.string().datetime({ message: 'Must be an ISO 8601 datetime' }),
  type:        z.enum(['REMINDER', 'DAY_BEFORE', 'SAME_DAY_MORNING', 'CUSTOM']).default('REMINDER'),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

// ─── Event ───────────────────────────────────────────────────────────────────

export const UpdateEventSchema = z.object({
  name:        z.string().trim().min(1).max(200).optional(),
  date:        z.string().datetime().optional(),
  venue:       z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
});

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
