import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, it, vi } from 'vitest';
import { requestJson } from './http';

it('aborts a real HTTP connection that never sends response headers', async () => {
  const server = createServer(() => { /* Deliberately never answer. */ });
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const started = performance.now();
    const result = await requestJson({
      endpoint: 'test/stalled',
      url: `http://127.0.0.1:${port}`,
      totalTimeoutMs: 100,
    });
    expect(result).toEqual({ status: 'unavailable', reason: 'test/stalled: deadline exceeded' });
    expect(performance.now() - started).toBeLessThan(1_000);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    info.mockRestore();
    error.mockRestore();
  }
});
