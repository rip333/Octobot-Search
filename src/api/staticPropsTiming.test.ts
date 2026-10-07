import type { GetStaticPropsContext } from 'next';
import { afterEach, expect, it, vi } from 'vitest';
import { timeStaticProps } from './staticPropsTiming';

afterEach(() => vi.restoreAllMocks());

const context = { params: { id: 'private-id' }, revalidateReason: 'stale' } as GetStaticPropsContext;

it('returns props unchanged and logs only fixed labels and timing', async () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const result = { props: { card: 'private-card-content' }, revalidate: 604_800 };
  const timed = timeStaticProps('/card/[id]', async () => result);
  await expect(timed(context)).resolves.toBe(result);
  expect(info).toHaveBeenCalledTimes(1);
  const logged = info.mock.calls.flat().join(' ');
  expect(logged).toMatch(/\[static-props \/card\/\[id\]\] outcome=success reason=stale duration_ms=\d+/);
  expect(logged).not.toContain('private');
});

it('rethrows the same failure so ISR retains the last good page', async () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const error = new Error('private error content');
  const timed = timeStaticProps('/', async () => { throw error; });
  await expect(timed(context)).rejects.toBe(error);
  expect(info.mock.calls.flat().join(' ')).toContain('outcome=error');
  expect(info.mock.calls.flat().join(' ')).not.toContain('private');
});

it('records not-found outcomes without trusting arbitrary context text', async () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const timed = timeStaticProps('/card/[id]', async () => ({ notFound: true as const }));
  await expect(timed({ revalidateReason: 'private-context' } as unknown as GetStaticPropsContext))
    .resolves.toEqual({ notFound: true });
  expect(info.mock.calls.flat().join(' ')).toContain('outcome=not_found reason=unknown');
  expect(info.mock.calls.flat().join(' ')).not.toContain('private');
});
