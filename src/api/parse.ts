import { UpstreamResult, listResult } from './result';

/** Thrown by `parse*` functions when an upstream payload does not match its narrow schema. */
export class UpstreamDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamDataError';
  }
}

export type UnknownRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Coerces the string-or-number values upstreams use interchangeably. */
export const stringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value.toString();
  return fallback;
};

export const optionalStringValue = (value: unknown): string | undefined => {
  const normalized = stringValue(value);
  return normalized || undefined;
};

export const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new UpstreamDataError(`Missing or non-string "${field}".`);
  }
  return value;
};

export const optionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/**
 * Drops keys whose value is `undefined`.
 *
 * Next refuses to serialize `undefined` in `getStaticProps` props, and an
 * optional field is better represented by an absent key than a present-but-
 * undefined one. Every object that can reach page props goes through this.
 */
export const withoutUndefined = <T extends object>(value: T): T => {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) result[key] = entry;
  }

  return result as T;
};

/**
 * Applies a narrow schema to a transport result. Transport outcomes other than
 * `success` pass through untouched; a schema failure becomes `invalid` with a
 * message that describes the shape problem and never echoes payload contents.
 */
export const parseUpstreamList = <T>(
  endpoint: string,
  raw: UpstreamResult<unknown>,
  parse: (value: unknown) => T[],
): UpstreamResult<T[]> => {
  if (raw.status !== 'success') return raw;

  try {
    return listResult(parse(raw.data));
  } catch (error) {
    const reason = error instanceof UpstreamDataError ? error.message : 'unparseable response';
    console.error(`[upstream ${endpoint}] invalid payload: ${reason}`);
    return { status: 'invalid', reason: `${endpoint}: ${reason}` };
  }
};
