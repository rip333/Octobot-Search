import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isAbortError, requestJson } from './http';

vi.mock('axios');

const mockedAxios = vi.mocked(axios, true);

/** Builds the shape `axios.isAxiosError` recognises. */
const axiosError = (options: { status?: number; code?: string }) => {
  const error = new Error(options.code ?? `HTTP ${options.status}`) as Error & Record<string, unknown>;
  error.isAxiosError = true;
  error.code = options.code;
  error.response = options.status === undefined ? undefined : { status: options.status };
  return error;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedAxios.isAxiosError = ((value: unknown) =>
    typeof value === 'object' && value !== null && 'isAxiosError' in value) as never;
  mockedAxios.isCancel = ((value: unknown) =>
    value instanceof Error && value.name === 'CanceledError') as never;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('requestJson', () => {
  it('stops a stalled server request within five seconds as unavailable', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    mockedAxios.get.mockImplementation((_url, config) => new Promise((_resolve, reject) => {
      config?.signal?.addEventListener?.('abort', () => {
        const error = new Error('cancelled');
        error.name = 'CanceledError';
        reject(error);
      });
    }));
    let result: unknown;
    const pending = requestJson({ endpoint: 'cerebro/query', url: 'https://example.test' })
      .then(value => { result = value; });

    await vi.advanceTimersByTimeAsync(5_000);

    expect(result).toEqual({ status: 'unavailable', reason: 'cerebro/query: deadline exceeded' });
    await pending;
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shares the server deadline across retries rather than restarting it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    mockedAxios.get.mockImplementationOnce(() => new Promise((_resolve, reject) => {
      setTimeout(() => reject(axiosError({ status: 503 })), 4_000);
    })).mockImplementation((_url, config) => new Promise((_resolve, reject) => {
      config?.signal?.addEventListener?.('abort', () => {
        const error = new Error('cancelled');
        error.name = 'CanceledError';
        reject(error);
      });
    }));
    let result: unknown;
    const pending = requestJson({ endpoint: 'test', url: 'https://example.test' })
      .then(value => { result = value; });
    await vi.advanceTimersByTimeAsync(5_000);

    expect(result).toEqual({ status: 'unavailable', reason: 'test: deadline exceeded' });
    await pending;
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get.mock.calls[1][1]?.timeout).toBeLessThanOrEqual(1_000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('lets caller cancellation interrupt retry backoff without another request', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    mockedAxios.get.mockRejectedValue(axiosError({ status: 503 }));
    const controller = new AbortController();
    let rejection: unknown;
    const pending = requestJson({ endpoint: 'test', url: 'https://example.test', signal: controller.signal })
      .catch(error => { rejection = error; });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await vi.advanceTimersByTimeAsync(0);

    expect(isAbortError(rejection)).toBe(true);
    await pending;
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves the browser timeout and does not emit server timing logs', async () => {
    vi.stubGlobal('window', {});
    mockedAxios.get.mockResolvedValue({ data: [] });
    await requestJson({ endpoint: 'test', url: 'https://example.test' });
    expect(mockedAxios.get.mock.calls[0][1]?.timeout).toBe(12_000);
    expect(console.info).not.toHaveBeenCalled();
  });

  it('expires during retry backoff without starting another upstream attempt', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    mockedAxios.get.mockImplementation(() => new Promise((_resolve, reject) => {
      setTimeout(() => reject(axiosError({ status: 503 })), 4_900);
    }));
    const pending = requestJson({ endpoint: 'test', url: 'https://example.test' });
    await vi.advanceTimersByTimeAsync(5_000);
    await expect(pending).resolves.toEqual({ status: 'unavailable', reason: 'test: deadline exceeded' });
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not call the upstream when the caller already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(requestJson({ endpoint: 'test', url: 'https://example.test', signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('logs safe completion timing without response content or query text', async () => {
    mockedAxios.get.mockResolvedValue({ data: ['private response'] });
    await requestJson({ endpoint: 'cerebro/query', url: 'https://example.test?input=private-query' });
    const logged = vi.mocked(console.info).mock.calls.flat().join(' ');
    expect(logged).toContain('cerebro/query');
    expect(logged).toContain('outcome=success');
    expect(logged).toMatch(/duration_ms=\d+/);
    expect(logged).toContain('attempts=1');
    expect(logged).not.toContain('private');
    expect(logged).not.toContain('https://');
  });

  it('returns the parsed body on success', async () => {
    mockedAxios.get.mockResolvedValue({ data: [{ ok: true }] });

    await expect(requestJson({ endpoint: 'test', url: 'https://example.test' }))
      .resolves.toEqual({ status: 'success', data: [{ ok: true }] });
  });

  it('retries retryable statuses and succeeds on a later attempt', async () => {
    mockedAxios.get
      .mockRejectedValueOnce(axiosError({ status: 503 }))
      .mockRejectedValueOnce(axiosError({ status: 502 }))
      .mockResolvedValue({ data: [] });

    const result = await requestJson({ endpoint: 'test', url: 'https://example.test' });

    expect(result).toEqual({ status: 'success', data: [] });
    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
  });

  it('retries a timeout and reports it as unavailable when every attempt fails', async () => {
    mockedAxios.get.mockRejectedValue(axiosError({ code: 'ECONNABORTED' }));

    const result = await requestJson({ endpoint: 'test', url: 'https://example.test', retries: 2 });

    expect(result).toMatchObject({ status: 'unavailable' });
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('does not retry a non-retryable status', async () => {
    mockedAxios.get.mockRejectedValue(axiosError({ status: 400 }));

    const result = await requestJson({ endpoint: 'test', url: 'https://example.test' });

    expect(result).toMatchObject({ status: 'unavailable' });
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('treats a declared empty status as empty rather than failed', async () => {
    mockedAxios.get.mockRejectedValue(axiosError({ status: 404 }));

    const result = await requestJson({
      endpoint: 'test',
      url: 'https://example.test',
      emptyStatuses: [404],
    });

    expect(result).toEqual({ status: 'empty' });
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('rethrows aborts so callers can tell cancellation from failure', async () => {
    const cancelled = new Error('canceled');
    cancelled.name = 'CanceledError';
    mockedAxios.get.mockRejectedValue(cancelled);

    await expect(requestJson({ endpoint: 'test', url: 'https://example.test' })).rejects.toBe(cancelled);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('applies a bounded timeout and response size to every request', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    await requestJson({ endpoint: 'test', url: 'https://example.test' });

    const [, config] = mockedAxios.get.mock.calls[0];
    expect(config?.timeout).toBeGreaterThan(0);
    expect(config?.maxContentLength).toBe(5 * 1024 * 1024);
  });

  /**
   * Regression: the search page calls this client from the browser, where
   * Axios defaults to the `xhr` adapter. `xhr` ignores `maxContentLength`, so
   * the size limit silently did not apply to searches.
   */
  it('prefers adapters that enforce the response-size limit', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    await requestJson({ endpoint: 'test', url: 'https://example.test' });

    const [, config] = mockedAxios.get.mock.calls[0];
    const adapters = config?.adapter as string[];

    expect(Array.isArray(adapters)).toBe(true);
    // `http` (server) and `fetch` (browser) both enforce the limit; `xhr` does
    // not, so it may only ever be the last-resort fallback.
    expect(adapters.slice(0, 2)).toEqual(['http', 'fetch']);
    expect(adapters.indexOf('xhr')).toBe(adapters.length - 1);
  });

  it('logs the endpoint label and never the full URL', async () => {
    mockedAxios.get.mockRejectedValue(axiosError({ status: 500 }));

    await requestJson({
      endpoint: 'cerebro/query',
      url: 'https://example.test/query?input=secret+user+search',
      retries: 1,
    });

    const logged = vi.mocked(console.error).mock.calls.flat().join(' ');
    expect(logged).toContain('cerebro/query');
    expect(logged).not.toContain('secret+user+search');
  });
});

describe('isAbortError', () => {
  it('recognises AbortController-style errors', () => {
    const error = new Error('aborted');
    error.name = 'AbortError';

    expect(isAbortError(error)).toBe(true);
    expect(isAbortError(new Error('other'))).toBe(false);
  });
});
