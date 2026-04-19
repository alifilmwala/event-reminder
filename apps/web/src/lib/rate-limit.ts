/**
 * In-memory sliding-window rate limiter.
 *
 * For multi-instance / multi-process deployments, swap the `store` Map
 * for a Redis-backed implementation (ioredis + sliding window script).
 *
 * Usage:
 *   const limited = await rateLimit(ip, 'upload', 5, 60_000);
 *   if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 */

interface Window {
  count: number;
  resetAt: number;
}

// key → sliding window
const store = new Map<string, Window>();

// Prune expired entries every 5 minutes to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of Array.from(store.entries())) {
    if (win.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * @param identifier  unique key (e.g. IP address)
 * @param action      logical action name (prevents cross-action collisions)
 * @param max         max requests allowed in the window
 * @param windowMs    window duration in milliseconds
 * @returns           true if the request should be rate-limited (blocked)
 */
export async function rateLimit(
  identifier: string,
  action: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const key = `${action}:${identifier}`;
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  existing.count += 1;
  return existing.count > max;
}

/**
 * Helper to extract the caller IP from a Next.js Request.
 */
export function getClientIp(req: Request): string {
  return (
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
