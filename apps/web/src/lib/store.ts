/**
 * JSON file store — sole persistence layer.
 *
 * All data lives in DATA_DIR (default: <project-root>/apps/web/data/).
 * Uses a per-file async write-mutex so concurrent Next.js API calls
 * never corrupt a file with overlapping writes.
 *
 * DATA_DIR can be overridden via the DATA_DIR env variable.
 * Both the web app and the WhatsApp service should point to the same path.
 */
import fs from 'fs/promises';
import path from 'path';

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');

// ─── Per-file write queue ─────────────────────────────────────────────────────
// Each file gets its own promise chain so writes serialize per-file.
const writeQueue = new Map<string, Promise<void>>();

function fp(name: string): string {
  return path.join(DATA_DIR, `${name}.json`);
}

/** Read a JSON file; returns defaultValue when the file doesn't exist yet. */
export async function readJson<T>(name: string, defaultValue: T): Promise<T> {
  try {
    const raw = await fs.readFile(fp(name), 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return defaultValue;
    throw err;
  }
}

/** Write a JSON file, serializing concurrent writes to the same file. */
export async function writeJson<T>(name: string, data: T): Promise<void> {
  // Append to the per-file queue so we never write in parallel
  const prev = writeQueue.get(name) ?? Promise.resolve();

  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  writeQueue.set(name, current);

  await prev; // wait for previous write to finish
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(fp(name), JSON.stringify(data, null, 2), 'utf-8');
  } finally {
    writeQueue.delete(name);
    release();
  }
}
