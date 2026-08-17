import axios, { AxiosError } from 'axios';
import { UpstreamResult } from './result';

/** Ceiling for any single upstream body. Larger responses are rejected, not buffered. */
export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 300;
const RETRY_MAX_DELAY_MS = 4_000;

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'ERR_BAD_RESPONSE',
  'ERR_NETWORK',
]);

export interface UpstreamRequestOptions {
  /**
   * Log-safe endpoint label such as `cerebro/query`. This is what gets logged;
   * the full URL is not, because it can carry user search text.
   */
  endpoint: string;
  url: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxResponseBytes?: number;
  retries?: number;
  headers?: Record<string, string>;
  /** Status codes the upstream uses to mean "nothing matched" rather than "failed". */
  emptyStatuses?: readonly number[];
}

export const isAbortError = (error: unknown): boolean => {
  if (axios.isCancel(error)) return true;
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) return true;
  return false;
};

const newRequestId = (): string => Math.random().toString(36).slice(2, 10);

const isRetryable = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (typeof status === 'number') return RETRYABLE_STATUS_CODES.has(status);
  return error.code ? RETRYABLE_ERROR_CODES.has(error.code) : true;
};

/** Full jitter: spreads retries so concurrent ISR regenerations do not resonate. */
const retryDelayMs = (attempt: number): number => {
  const ceiling = Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** attempt);
  return Math.random() * ceiling;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const describeError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    if (typeof status === 'number') return `HTTP ${status}`;
    return axiosError.code ?? 'network error';
  }
  return error instanceof Error ? error.name : 'unknown error';
};

/**
 * Performs one upstream GET with bounded time, bounded body size, and jittered
 * retries. Never throws for upstream problems: transport failures become
 * `unavailable` and `emptyStatuses` become `empty`. Aborts are rethrown so
 * callers can distinguish a cancelled request from a failed one.
 */
export const requestJson = async (
  options: UpstreamRequestOptions,
): Promise<UpstreamResult<unknown>> => {
  const {
    endpoint,
    url,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxResponseBytes = MAX_RESPONSE_BYTES,
    retries = DEFAULT_RETRIES,
    headers,
    emptyStatuses = [],
  } = options;

  const requestId = newRequestId();
  const attempts = Math.max(1, retries);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await axios.get<unknown>(url, {
        signal,
        timeout: timeoutMs,
        maxContentLength: maxResponseBytes,
        maxBodyLength: maxResponseBytes,
        headers,
        responseType: 'json',
        // Adapter preference, in order of what enforces `maxContentLength`.
        // Axios picks the first one supported by the runtime: `http` on the
        // server, `fetch` in the browser. The default browser adapter is `xhr`,
        // which silently ignores the limit, so it is listed last as a
        // compatibility fallback for runtimes without fetch.
        adapter: ['http', 'fetch', 'xhr'],
      });

      return { status: 'success', data: response.data };
    } catch (error) {
      if (isAbortError(error)) throw error;
      lastError = error;

      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (typeof status === 'number' && emptyStatuses.includes(status)) {
        return { status: 'empty' };
      }

      const canRetry = isRetryable(error) && attempt < attempts - 1;
      if (!canRetry) break;

      const delay = retryDelayMs(attempt);
      console.warn(
        `[upstream ${endpoint} ${requestId}] ${describeError(error)}; retry ${attempt + 1}/${attempts - 1} in ${Math.round(delay)}ms`,
      );
      await sleep(delay);
    }
  }

  const reason = describeError(lastError);
  console.error(`[upstream ${endpoint} ${requestId}] failed after ${attempts} attempt(s): ${reason}`);
  return { status: 'unavailable', reason: `${endpoint}: ${reason}` };
};
