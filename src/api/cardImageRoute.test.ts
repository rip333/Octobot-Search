import type { NextApiRequest, NextApiResponse } from 'next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '@/pages/api/card-images/v1/[origin]/[...filename]';
import { fetchCardImage } from './cardImageBinary';
import { images } from './__fixtures__/cardImages';
vi.mock('./cardImageBinary', () => ({ fetchCardImage: vi.fn() }));
const fetchImage = vi.mocked(fetchCardImage);
beforeEach(() => fetchImage.mockReset());

async function call(overrides = {}) {
  const req = { method: 'GET', url: '/api/card-images/v1/official/00001.jpg',
    query: { origin: 'official', filename: '00001.jpg' }, headers: {}, ...overrides };
  const headers: Record<string, unknown> = {};
  const res = { setHeader: vi.fn((key, value) => { headers[key] = value; }),
    status: vi.fn(), end: vi.fn() };
  res.status.mockReturnValue(res);
  await handler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);
  return { headers, status: res.status.mock.calls[0][0], end: res.end };
}

describe('image cache endpoint', () => {
  it('accepts canonical catch-all official and creator-scoped unofficial paths', async () => {
    fetchImage.mockResolvedValue({ status: 200, body: images.jpeg.body, contentType: 'image/jpeg' });
    expect((await call({ query: { origin: 'official', filename: ['00001.jpg'] } })).status).toBe(200);
    expect((await call({ url: '/api/card-images/v1/unofficial/237660307835715585/01001B.jpg',
      query: { origin: 'unofficial', filename: ['237660307835715585', '01001B.jpg'] } })).status).toBe(200);
    expect(fetchImage).toHaveBeenLastCalledWith('unofficial/237660307835715585/01001B.jpg');
  });
  it('returns byte-identical GET and metadata-only HEAD with the same cache headers', async () => {
    const body = images.jpeg.body;
    fetchImage.mockResolvedValue({ status: 200, body, contentType: 'image/jpeg' });
    const get = await call();
    const head = await call({ method: 'HEAD' });
    expect(get.status).toBe(200);
    expect(get.headers).toMatchObject({ 'Cache-Control': 'public, max-age=604800',
      'CDN-Cache-Control': 'public, s-maxage=2592000', 'Content-Length': body.length, 'Content-Type': 'image/jpeg' });
    expect(get.end).toHaveBeenCalledWith(body);
    expect(head.headers).toEqual(get.headers);
    expect(head.end).toHaveBeenCalledWith(undefined);
    expect(get.headers).not.toHaveProperty('Set-Cookie');
  });
  it.each([
    { method: 'POST' }, { headers: { range: 'bytes=0-1' } }, { headers: { authorization: 'Bearer fake' } },
    { url: '/api/card-images/v1/official/%30%30%30%30%31.jpg' },
    { url: '/api/card-images/v1/official/00001.jpg?x=1' },
    { query: { origin: 'official', filename: '../00001.jpg' } },
    { query: { origin: 'other', filename: '00001.jpg' } },
    { query: { origin: 'official', filename: '00001.jpg', url: 'https://evil.test' } },
  ])('rejects origin-amplifying requests before network access', async overrides => {
    const result = await call(overrides);
    expect([400, 405]).toContain(result.status);
    expect(result.headers['Cache-Control']).toBe('no-store');
    expect(fetchImage).not.toHaveBeenCalled();
  });
  it('uses short negative caching only for genuine 404s', async () => {
    fetchImage.mockResolvedValue({ status: 404 });
    expect((await call()).headers['CDN-Cache-Control']).toBe('public, s-maxage=60');
    fetchImage.mockResolvedValue({ status: 503 });
    const result = await call();
    expect(result.headers['Cache-Control']).toBe('no-store');
    expect(result.headers).not.toHaveProperty('CDN-Cache-Control');
  });
});
