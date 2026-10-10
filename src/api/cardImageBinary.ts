import axios from 'axios';
import type { Readable } from 'node:stream';
import { imageKey, R2_IMAGE_ROOT } from './cardImageSource';
import { hasCompleteImageStructure } from './cardImageStructure';

export const IMAGE_LIMIT_BYTES = 2 * 1024 * 1024;
export const IMAGE_DEADLINE_MS = 5000;
export type ImageResult = { status: 200; body: Buffer; contentType: string } | { status: 404 | 503 };
const pending = new Map<string, Promise<ImageResult>>();

async function readImage(key: string): Promise<ImageResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
    stream?.destroy(new Error('Image deadline exceeded'));
  }, IMAGE_DEADLINE_MS);
  const started = performance.now();
  let stream: Readable | undefined;
  let bytes = 0;
  let statusClass = 'none';
  let outcome = 'unavailable';
  try {
    const response = await axios.get<Readable>(`${R2_IMAGE_ROOT}${key}`, {
      adapter: 'http', responseType: 'stream', signal: controller.signal,
      timeout: IMAGE_DEADLINE_MS, maxRedirects: 0, validateStatus: () => true,
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif' },
    });
    stream = response.data;
    statusClass = `${Math.floor(response.status / 100)}xx`;
    if (response.status === 404) { outcome = 'not_found'; return { status: 404 }; }
    if (response.status !== 200) {
      outcome = response.status === 429 ? 'throttled' : response.status >= 300 && response.status < 400 ? 'redirect' : 'upstream_error';
      return { status: 503 };
    }
    const mime = String(response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
    const expected: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
    if (mime !== expected[key.split('.').pop()!] || Number(response.headers['content-length']) > IMAGE_LIMIT_BYTES) {
      outcome = 'invalid'; return { status: 503 };
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.length;
      if (controller.signal.aborted) { outcome = 'timeout'; return { status: 503 }; }
      if (bytes > IMAGE_LIMIT_BYTES) { outcome = 'invalid'; return { status: 503 }; }
      chunks.push(buffer);
    }
    const body = Buffer.concat(chunks, bytes);
    if (controller.signal.aborted) { outcome = 'timeout'; return { status: 503 }; }
    if (!hasCompleteImageStructure(body, mime)) { outcome = 'invalid'; return { status: 503 }; }
    // The bounded synchronous container walk also belongs to the total deadline.
    if (controller.signal.aborted || performance.now() - started >= IMAGE_DEADLINE_MS) {
      outcome = 'timeout'; return { status: 503 };
    }
    outcome = 'success';
    return { status: 200, body, contentType: mime };
  } catch {
    if (controller.signal.aborted) outcome = 'timeout';
    return { status: 503 };
  } finally {
    stream?.destroy();
    clearTimeout(timer);
    console.info(`[upstream cerebro/image] outcome=${outcome} status_class=${statusClass} duration_ms=${Math.round(performance.now() - started)} bytes=${bytes} attempts=1`);
  }
}

/** Coalesces only concurrent misses within this process; neither durable cache nor global lock. */
export function fetchCardImage(key: string): Promise<ImageResult> {
  const [origin, ...filename] = key.split('/');
  if (imageKey(origin, filename) !== key) return Promise.resolve({ status: 503 });
  const existing = pending.get(key);
  if (existing) return existing;
  const request = readImage(key).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
