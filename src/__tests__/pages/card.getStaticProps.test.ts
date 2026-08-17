import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetStaticPropsContext } from 'next';
import { Card } from '@/models/Card';
import { UpstreamResult } from '@/api/result';
import { parseCerebroCards } from '@/api/cerebro';
import { findUnserializableValues } from '../support/nextSerializable';

const fetchCerebroCards = vi.fn<() => Promise<UpstreamResult<Card[]>>>();

// Only the network call is stubbed; the real parser still runs.
vi.mock('@/api/cerebro', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/cerebro')>()),
  fetchCerebroCards: () => fetchCerebroCards(),
}));

const makeCard = (Id: string): Card => ({
  Deleted: false,
  Id,
  Official: true,
  Classification: 'Justice',
  Cost: '1',
  Name: 'Card',
  Printings: [],
  Subname: '',
  Traits: [],
  Type: 'Event',
  Unique: false,
  ImageUrl: '',
});

type Context = GetStaticPropsContext<{ id: string }>;

let UpstreamUnavailableError: new (reason: string) => Error;
let getStaticProps: (context: Context) => Promise<unknown>;

beforeEach(async () => {
  vi.resetModules();
  ({ UpstreamUnavailableError } = await import('@/api/revalidate'));
  fetchCerebroCards.mockReset();
  ({ getStaticProps } = await import('@/pages/card/[id]') as unknown as { getStaticProps: typeof getStaticProps });
});

const run = (id: unknown) => getStaticProps({ params: { id } } as unknown as Context);

describe('card page getStaticProps', () => {
  it('returns the card for a valid ID', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'success', data: [makeCard('04045')] });

    const result = await run('04045') as { props: { card: Card }; revalidate: number };

    expect(result.props.card.Id).toBe('04045');
    expect(result.revalidate).toBeGreaterThan(0);
  });

  it('returns notFound with a short revalidate when the card does not exist', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'empty' });

    const result = await run('99999') as { notFound: true; revalidate: number };

    expect(result.notFound).toBe(true);
    // Short enough that a newly published card becomes reachable.
    expect(result.revalidate).toBeLessThanOrEqual(3600);
  });

  it('rejects malformed IDs without touching the upstream', async () => {
    for (const id of ['../secret', '1"&o:"false', 'abc', '', undefined]) {
      const result = await run(id) as { notFound: true };
      expect(result.notFound).toBe(true);
    }

    expect(fetchCerebroCards).not.toHaveBeenCalled();
  });

  it('throws rather than caching an upstream outage as a page', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'unavailable', reason: 'cerebro/query: HTTP 503' });

    await expect(run('04045')).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it('throws rather than caching an unusable payload', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'invalid', reason: 'cerebro/query: bad shape' });

    await expect(run('04045')).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });
});

/**
 * Regression cover for the `undefined` serialization 500: a card whose
 * optional fields are all absent upstream must still cross into page props.
 */
describe('card page props are serializable', () => {
  it('omits absent optional fields instead of serializing undefined', async () => {
    const cards = parseCerebroCards([{
      Id: '04045',
      Name: 'Sparse Card',
      Official: true,
      AuthorId: null,
      Attack: null,
      Health: null,
      Resource: null,
      Rules: null,
      Thwart: null,
      Printings: [{ ArtificialId: '04045', Flavor: null }],
    }]);
    fetchCerebroCards.mockResolvedValue({ status: 'success', data: cards });

    const result = await run('04045') as { props: unknown };

    expect(findUnserializableValues(result.props)).toEqual([]);
  });
});
