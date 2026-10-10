/** Canonical keys are case-sensitive; never normalize art IDs or leading zeroes. */
export const R2_IMAGE_ROOT = 'https://pub-d27e6715f4ba4529bc9d8fd13938a5a1.r2.dev/cerebro-cards/';
const CEREBRO_ORIGINS = new Set([
  'https://cerebrodatastorage.blob.core.windows.net',
  new URL(R2_IMAGE_ROOT).origin,
]);
const MERLIN_ORIGINS = new Set(['https://mc4db.merlindumesnil.net', 'https://db.merlindumesnil.net']);
export const IMAGE_ROUTE = '/api/card-images/v1/';

export function imageKey(origin: unknown, filename: unknown): string | null {
  if (origin !== 'official' && origin !== 'unofficial') return null;
  const parts = typeof filename === 'string' ? filename.split('/') : filename;
  if (!Array.isArray(parts) || !parts.every(part => typeof part === 'string')) return null;
  // Unofficial IDs can be creator/card; official IDs never have a creator folder.
  if (parts.length !== 1 && !(origin === 'unofficial' && parts.length === 2 && /^[0-9]{1,20}$/.test(parts[0]))) return null;
  if (!/^[A-Za-z0-9_-]{1,100}\.(jpg|jpeg|png|webp|gif)$/.test(parts[parts.length - 1])) return null;
  return `${origin}/${parts.join('/')}`;
}

export function canonicalImageSource(source: string): string | null {
  try {
    const url = new URL(source);
    if (url.username || url.password || url.search || url.hash || url.port) return null;
    if (MERLIN_ORIGINS.has(url.origin)) return source;
    if (!CEREBRO_ORIGINS.has(url.origin)) return null;
    // Match the raw path as well, rejecting URL normalization of dot segments and escaped keys.
    const path = source.slice(url.origin.length);
    const match = /^\/cerebro-cards\/(official|unofficial)\/(.+)$/.exec(path);
    const key = match ? imageKey(match[1], match[2]) : null;
    return key ? `${IMAGE_ROUTE}${key}` : null;
  } catch {
    return null;
  }
}
