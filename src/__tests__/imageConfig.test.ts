import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const nextConfig = require(path.join(process.cwd(), 'next.config.js'));

describe('next image config', () => {
  it('does not route images through the metered optimizer', () => {
    expect(nextConfig.images?.unoptimized).toBe(true);
  });

  it('retains Merlin hosts and removes the old Cerebro origin', () => {
    const hosts = (nextConfig.images?.remotePatterns ?? []).map(
      (pattern: { hostname: string }) => pattern.hostname,
    );

    expect(hosts).not.toContain('cerebrodatastorage.blob.core.windows.net');
    expect(hosts).toContain('mc4db.merlindumesnil.net');
    expect(hosts).toContain('db.merlindumesnil.net');
  });
});
