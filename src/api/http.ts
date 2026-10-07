import axios, { AxiosError } from 'axios';
import { UpstreamResult } from './result';

/** Ceiling for any single upstream body. Larger responses are rejected, not buffered. */
export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

const DEFAULT_TIMEOUT_MS = 12_000;
/** Half the deployed 10s limit, reserving time for startup, parsing and rendering. */
export const SERVER_UPSTREAM_BUDGET_MS = 5_000;
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
  /** Total wall-clock budget including all attempts and retry backoff. */
  totalTimeoutMs?: number;
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

const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) {
    reject(signal.reason);
    return;
  }
  const timer = setTimeout(() => {
    signal.removeEventListener('abort', onAbort);
    resolve();
  }, ms);
  const onAbort = () => {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
    reject(signal.reason);
  };
  signal.addEventListener('abort', onAbort, { once: true });
});

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
    signal: callerSignal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    totalTimeoutMs = typeof window === 'undefined' ? SERVER_UPSTREAM_BUDGET_MS : Infinity,
    maxResponseBytes = MAX_RESPONSE_BYTES,
    retries = DEFAULT_RETRIES,
    headers,
    emptyStatuses = [],
  } = options;

  const requestId = newRequestId();
  const attempts = Math.max(1, retries);
  const started = performance.now();
  const controller = new AbortController();
  const forwardAbort = () => controller.abort(callerSignal?.reason);
  callerSignal?.addEventListener('abort', forwardAbort, { once: true });
  if (callerSignal?.aborted) forwardAbort();
  let deadlineExceeded = false;
  const timer = Number.isFinite(totalTimeoutMs) ? setTimeout(() => {
    deadlineExceeded = true;
    controller.abort();
  }, totalTimeoutMs) : undefined;
  const signal = controller.signal;
  let outcome = 'unavailable';
  let attemptCount = 0;
  let upstreamMs = 0;
  let lastError: unknown;

  try {
    for (let attempt = 0; attempt < attempts; attempt++) {
      signal.throwIfAborted();
      const remainingMs = totalTimeoutMs - (performance.now() - started);
      if (remainingMs <= 0) {
        deadlineExceeded = true;
        break;
      }
      const attemptStarted = performance.now();
      attemptCount++;
      let delay: number | undefined;
      try {
        const response = await axios.get<unknown>(url, {
          signal,
          timeout: Math.min(timeoutMs, Math.ceil(remainingMs)),
          maxContentLength: maxResponseBytes,
          maxBodyLength: maxResponseBytes,
          headers,
          responseType: 'json',
          // Prefer adapters that enforce maxContentLength. Browser xhr is
          // only a compatibility fallback because it ignores this limit.
          adapter: ['http', 'fetch', 'xhr'],
        });

        outcome = 'success';
        return { status: 'success', data: response.data };
      } catch (error) {
        if (callerSignal?.aborted) throw error;
        if (deadlineExceeded) break;
        if (isAbortError(error)) throw error;
        lastError = error;

        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (typeof status === 'number' && emptyStatuses.includes(status)) {
          outcome = 'empty';
          return { status: 'empty' };
        }

        const canRetry = isRetryable(error) && attempt < attempts - 1;
        if (!canRetry) break;

        delay = retryDelayMs(attempt);
        console.warn(
          `[upstream ${endpoint} ${requestId}] ${describeError(error)}; attempt_ms=${Math.round(performance.now() - attemptStarted)}; retry ${attempt + 1}/${attempts - 1} in ${Math.round(delay)}ms`,
        );
      } finally {
        upstreamMs += performance.now() - attemptStarted;
      }
      if (delay !== undefined) await sleep(delay, signal);
    }

    const reason = deadlineExceeded ? 'deadline exceeded' : describeError(lastError);
    console.error(`[upstream ${endpoint} ${requestId}] failed after ${attemptCount} attempt(s): ${reason}`);
    return { status: 'unavailable', reason: `${endpoint}: ${reason}` };
  } catch (error) {
    if (deadlineExceeded && !callerSignal?.aborted) {
      console.error(`[upstream ${endpoint} ${requestId}] failed after ${attemptCount} attempt(s): deadline exceeded`);
      return { status: 'unavailable', reason: `${endpoint}: deadline exceeded` };
    }
    outcome = 'cancelled';
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    callerSignal?.removeEventListener('abort', forwardAbort);
    if (typeof window === 'undefined') {
      console.info(`[upstream ${endpoint} ${requestId}] outcome=${outcome} duration_ms=${Math.round(performance.now() - started)} upstream_ms=${Math.round(upstreamMs)} attempts=${attemptCount}`);
    }
  }
};
