/**
 * Cron-based scheduler.
 *
 * Runs every minute and calls the web app's internal API to find PENDING
 * schedules whose time has passed, then triggers the batch send via
 * the web app's trigger-batch internal endpoint.
 * No direct database access — entirely API-driven.
 */
import cron from 'node-cron';
import { logger } from './logger';
import type { Schedule } from './types';

const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://localhost:3000';
const SECRET      = process.env.WHATSAPP_SERVICE_SECRET ?? '';

const headers = {
  'Content-Type':    'application/json',
  'X-Internal-Secret': SECRET,
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(url, { ...options, headers: { ...headers, ...(options?.headers ?? {}) }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json() as Promise<T>;
}

let running = false; // guard against concurrent runs

export function startScheduler(): void {
  cron.schedule('* * * * *', async () => {
    if (running) return;
    running = true;

    try {
      const dueSchedules = await fetchJson<Schedule[]>(
        `${WEB_APP_URL}/api/internal/schedules/due`,
      );

      for (const schedule of dueSchedules) {
        logger.info('Executing schedule', { id: schedule.id });

        try {
          await fetchJson(`${WEB_APP_URL}/api/internal/trigger-batch`, {
            method: 'POST',
            body:   JSON.stringify({ scheduleId: schedule.id }),
          });

          logger.info('Schedule triggered', { id: schedule.id });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.error('Schedule trigger failed', { id: schedule.id, error: msg });

          // Mark schedule as FAILED
          await fetch(`${WEB_APP_URL}/api/internal/schedules/${schedule.id}`, {
            method:  'PATCH',
            headers,
            body:    JSON.stringify({ status: 'FAILED' }),
            signal:  AbortSignal.timeout(8_000),
          }).catch(() => {});
        }
      }
    } catch (err) {
      logger.error('Scheduler tick error', { error: err });
    } finally {
      running = false;
    }
  });

  logger.info('Scheduler started — polling every minute');
}

