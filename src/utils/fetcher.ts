import axios from 'axios';

/**
 * Robust fetcher with automatic exponential backoff retries for transient 503/502/504 Heroku/network errors.
 */
export const fetcherWithRetry = async (url: string, retries = 3, delayMs = 600): Promise<any> => {
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, { timeout: 12000 });
      return res.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const isRetryable =
        status === 503 ||
        status === 502 ||
        status === 504 ||
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ERR_BAD_RESPONSE';

      if (isRetryable && attempt < retries) {
        console.warn(
          `[API Retry ${attempt}/${retries}] Received ${status || err?.code || 'error'} from ${url}. Retrying in ${currentDelay}ms...`
        );
        await new Promise((r) => setTimeout(r, currentDelay));
        currentDelay *= 2;
      } else {
        throw err;
      }
    }
  }
};
