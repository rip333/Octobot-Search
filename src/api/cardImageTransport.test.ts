import { createServer, type Server, type ServerResponse } from 'node:http';
import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCardImage, IMAGE_LIMIT_BYTES } from './cardImageBinary';
import { images } from './__fixtures__/cardImages';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/card-images/v1/[origin]/[...filename]';

let server: Server;
let serve: (res: ServerResponse) => void;
let requests = 0;

beforeEach(async () => {
  requests = 0;
  server = createServer((_req, res) => { requests++; serve(res); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing test address');
  const local = `http://127.0.0.1:${address.port}/image`;
  const realGet = axios.get.bind(axios);
  // Only substitute the destination: use the actual HTTP adapter and production options.
  vi.spyOn(axios, 'get').mockImplementation((_url, options) => realGet(local, { ...options, proxy: false }));
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  vi.restoreAllMocks();
});

describe('real image HTTP transport with a local origin fixture', () => {
  it('returns the original bytes without forwarding origin cookies or caching policy', async () => {
    const body = images.jpeg.body;
    serve = res => { res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Set-Cookie': 'fixture=1', 'Cache-Control': 'no-store' }); res.end(body); };
    expect(await fetchCardImage('official/00001.jpg')).toEqual({ status: 200, body, contentType: 'image/jpeg' });
    expect(requests).toBe(1);
  });

  it('does not follow redirects with the real adapter', async () => {
    serve = res => { res.writeHead(302, { Location: '/elsewhere' }); res.end(); };
    expect(await fetchCardImage('official/00001.jpg')).toEqual({ status: 503 });
    expect(requests).toBe(1);
  });

  it('rejects an HTTP-complete response whose image file is truncated', async () => {
    const body = images.jpeg.body.subarray(0, images.jpeg.body.length - 1);
    serve = res => { res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': body.length }); res.end(body); };
    expect(await fetchCardImage('official/00001.jpg')).toEqual({ status: 503 });
    expect(requests).toBe(1);
  });

  it.each(['GET', 'HEAD'])('returns no-store 503 for truncated art through the %s endpoint', async method => {
    const body = Buffer.from([255, 216, 255, 0]);
    serve = res => { res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': body.length }); res.end(body); };
    const headers: Record<string, unknown> = {};
    const res = { setHeader: vi.fn((name, value) => { headers[name] = value; }), status: vi.fn(), end: vi.fn() };
    res.status.mockReturnValue(res);
    await handler({ method, url: '/api/card-images/v1/official/00001.jpg',
      query: { origin: 'official', filename: ['00001.jpg'] }, headers: {} } as unknown as NextApiRequest,
    res as unknown as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(headers['Cache-Control']).toBe('no-store');
    expect(headers).not.toHaveProperty('CDN-Cache-Control');
    expect(requests).toBe(1);
  });

  it('bounds chunked bodies without Content-Length', async () => {
    serve = res => {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.write(Buffer.from([255, 216, 255]));
      res.end(Buffer.alloc(IMAGE_LIMIT_BYTES));
    };
    expect(await fetchCardImage('official/00001.jpg')).toEqual({ status: 503 });
    expect(requests).toBe(1);
  });

  it('cancels an actual body stream that never finishes', async () => {
    serve = res => { res.writeHead(200, { 'Content-Type': 'image/jpeg' }); res.write(Buffer.from([255, 216, 255])); };
    const started = performance.now();
    expect(await fetchCardImage('official/00001.jpg')).toEqual({ status: 503 });
    expect(performance.now() - started).toBeLessThan(6500);
    expect(requests).toBe(1);
  }, 10000);
});
