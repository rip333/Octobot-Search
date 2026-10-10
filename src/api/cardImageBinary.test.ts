import { Readable } from 'node:stream';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCardImage, IMAGE_LIMIT_BYTES } from './cardImageBinary';
import { images } from './__fixtures__/cardImages';
vi.mock('axios', () => ({ default: { get: vi.fn() } }));
const jpeg = images.jpeg.body;
const get = vi.mocked(axios.get);
function response(status = 200, body = jpeg, headers = {}) {
  return { status, data: Readable.from([body]), headers: { 'content-type': 'image/jpeg', ...headers } };
}
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); vi.useRealTimers(); });

describe('bounded image origin reads', () => {
  it.each(Object.entries(images))('accepts complete %s bytes without changing them', async (_name, image) => {
    get.mockResolvedValue(response(200, image.body, { 'content-type': image.mime }));
    expect(await fetchCardImage(`official/fixture.${image.extension}`))
      .toEqual({ status: 200, contentType: image.mime, body: image.body });
  });
  it.each<[string, string, Buffer]>([
    ['jpg', 'image/jpeg', Buffer.from([255, 216, 255, 0])],
    ['png', 'image/png', images.png.body.subarray(0, 8)],
    ['gif', 'image/gif', Buffer.from('GIF89a')],
    ['webp', 'image/webp', Buffer.from('524946460400000057454250', 'hex')],
    ...Object.values(images).map(image => [image.extension, image.mime, image.body.subarray(0, image.body.length - 1)] as [string, string, Buffer]),
  ])('rejects normally completed truncated %s responses', async (extension, mime, body) => {
    get.mockResolvedValue(response(200, body, { 'content-type': mime, 'content-length': String(body.length) }));
    expect(await fetchCardImage(`official/fixture.${extension}`)).toEqual({ status: 503 });
  });
  it('coalesces concurrent reads, preserves bytes, and discards completed entries', async () => {
    get.mockResolvedValue(response());
    const first = fetchCardImage('official/00001.jpg');
    expect(fetchCardImage('official/00001.jpg')).toBe(first);
    expect(await first).toEqual({ status: 200, contentType: 'image/jpeg', body: jpeg });
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toContain('r2.dev/cerebro-cards/official/00001.jpg');
    expect(get.mock.calls[0][1]).toMatchObject({ maxRedirects: 0, adapter: 'http' });
    get.mockResolvedValue(response());
    await fetchCardImage('official/00001.jpg');
    expect(get).toHaveBeenCalledTimes(2);
  });
  it.each([301, 302, 429, 500, 503])('does not follow or retry HTTP %s', async status => {
    get.mockResolvedValue(response(status));
    expect(await fetchCardImage('official/1.jpg')).toEqual({ status: 503 });
    expect(get).toHaveBeenCalledTimes(1);
  });
  it('recognizes genuine missing art without reading the body', async () => {
    get.mockResolvedValue(response(404));
    expect(await fetchCardImage('official/1.jpg')).toEqual({ status: 404 });
  });
  it.each([
    [Buffer.from('<html>'), {}],
    [jpeg, { 'content-type': 'image/png' }],
    [jpeg, { 'content-length': String(IMAGE_LIMIT_BYTES + 1) }],
    [Buffer.alloc(IMAGE_LIMIT_BYTES + 1), {}],
    [Buffer.alloc(IMAGE_LIMIT_BYTES + 1), { 'content-length': '4' }],
  ])('rejects invalid or oversized bodies', async (body, headers) => {
    get.mockResolvedValue(response(200, body, headers));
    expect(await fetchCardImage('official/1.jpg')).toEqual({ status: 503 });
  });
  it('aborts a stalled request at the total deadline and emits only safe metadata', async () => {
    vi.useFakeTimers();
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    get.mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener?.('abort', () => reject(new Error('private URL')), { once: true });
    }));
    const result = fetchCardImage('official/00001.jpg');
    await vi.advanceTimersByTimeAsync(5000);
    expect(await result).toEqual({ status: 503 });
    expect(String(log.mock.calls)).not.toMatch(/00001|https|private/);
    expect(String(log.mock.calls)).toContain('outcome=timeout');
    expect(get).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid keys before network access', async () => {
    expect(await fetchCardImage('official/../secret')).toEqual({ status: 503 });
    expect(get).not.toHaveBeenCalled();
  });
  it('does not return cacheable success when validation exhausts the total budget', async () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValue(5001);
    get.mockResolvedValue(response());
    expect(await fetchCardImage('official/00001.jpg')).toEqual({ status: 503 });
  });
  it('also bounds a stalled body after headers arrive and releases the pending key', async () => {
    vi.useFakeTimers();
    const stream = new Readable({ read() {} });
    get.mockResolvedValue({ ...response(), data: stream });
    const result = fetchCardImage('official/00001.jpg');
    await vi.advanceTimersByTimeAsync(5000);
    expect(await result).toEqual({ status: 503 });
    expect(stream.destroyed).toBe(true);
    get.mockResolvedValue(response());
    expect((await fetchCardImage('official/00001.jpg')).status).toBe(200);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
