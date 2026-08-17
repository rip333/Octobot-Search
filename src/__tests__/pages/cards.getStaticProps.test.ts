import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetStaticPropsContext } from 'next';
import { Card } from '@/models/Card';
import { MerlinCard } from '@/models/MerlinCard';
import { UpstreamResult } from '@/api/result';
import { parseCerebroCards } from '@/api/cerebro';
import { findUnserializableValues } from '../support/nextSerializable';

const fetchCerebroCards = vi.fn<(query: string) => Promise<UpstreamResult<Card[]>>>();
const fetchMerlinCards = vi.fn<(pack: string) => Promise<UpstreamResult<MerlinCard[]>>>();

// Only the network call is stubbed; the real parser still runs, so these tests
// see the exact card shapes that reach page props in production.
vi.mock('@/api/cerebro', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/cerebro')>()),
  fetchCerebroCards: (query: string) => fetchCerebroCards(query),
}));

vi.mock('@/api/merlin', () => ({
  MERLIN_ORIGIN: 'https://merlin.test',
  fetchMerlinCards: (pack: string) => fetchMerlinCards(pack),
}));

const UUID = '3dd91f75-3cb4-407f-8797-d9fb430cb4ae';

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

const makeMerlinCard = (): MerlinCard => ({
  code: '202801a',
  name: 'Alligator Loki',
  type_name: 'Hero',
  faction_name: 'Hero',
  status: 'released',
  pack_code: 'alligator_loki_by_ripper3',
});

type Context = GetStaticPropsContext<{ filter: string; type: string }>;

let UpstreamUnavailableError: new (reason: string) => Error;
let getStaticProps: (context: Context) => Promise<unknown>;
let getStaticPaths: () => Promise<{ paths: unknown[]; fallback: string | boolean }>;

beforeEach(async () => {
  vi.resetModules();
  ({ UpstreamUnavailableError } = await import('@/api/revalidate'));
  fetchCerebroCards.mockReset();
  fetchMerlinCards.mockReset();
  ({ getStaticProps, getStaticPaths } = await import('@/pages/cards/[filter]/[type]') as unknown as { getStaticProps: typeof getStaticProps; getStaticPaths: typeof getStaticPaths });
});

const run = (filter: unknown, type: unknown) =>
  getStaticProps({ params: { filter, type } } as unknown as Context);

describe('browse route getStaticPaths', () => {
  it('pre-renders nothing rather than a stale hardcoded path', async () => {
    const { paths, fallback } = await getStaticPaths();

    expect(paths).toEqual([]);
    expect(fallback).toBe('blocking');
  });
});

describe('browse route getStaticProps', () => {
  it('serves an official Cerebro set through a built query', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'success', data: [makeCard('1')] });

    const result = await run('si', UUID) as { props: { cards: Card[]; detailsEnabled: boolean; cerebroQuery: string } };

    expect(result.props.cards).toHaveLength(1);
    expect(result.props.detailsEnabled).toBe(true);
    expect(new URLSearchParams(result.props.cerebroQuery).get('input')).toBe(`(si:"${UUID}"&o:"true")`);
  });

  it('queries unofficial Cerebro sets with the official predicate flipped', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'success', data: [makeCard('1')] });

    const result = await run('usi', UUID) as { props: { cerebroQuery: string; detailsEnabled: boolean } };

    expect(new URLSearchParams(result.props.cerebroQuery).get('input')).toBe(`(si:"${UUID}"&o:"false")`);
    expect(result.props.detailsEnabled).toBe(false);
  });

  it('adapts Merlin cards and exposes no Cerebro query', async () => {
    fetchMerlinCards.mockResolvedValue({ status: 'success', data: [makeMerlinCard()] });

    const result = await run('ms', 'alligator_loki_by_ripper3') as {
      props: { cards: Card[]; cerebroQuery: string | null; detailsEnabled: boolean };
    };

    expect(result.props.cards[0].Id).toBe('202801a');
    expect(result.props.cerebroQuery).toBeNull();
    expect(result.props.detailsEnabled).toBe(false);
    expect(fetchCerebroCards).not.toHaveBeenCalled();
  });

  it('returns notFound for unsupported filters without querying anything', async () => {
    for (const filter of ['n', 'ru', 'o', 'unknown']) {
      expect(await run(filter, UUID)).toMatchObject({ notFound: true });
    }

    expect(fetchCerebroCards).not.toHaveBeenCalled();
    expect(fetchMerlinCards).not.toHaveBeenCalled();
  });

  it('returns notFound for values that do not match their filter format', async () => {
    expect(await run('si', 'not-a-uuid')).toMatchObject({ notFound: true });
    expect(await run('ms', UUID.repeat(3))).toMatchObject({ notFound: true });
    expect(fetchCerebroCards).not.toHaveBeenCalled();
  });

  it('returns notFound for a collection that genuinely holds no cards', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'empty' });

    expect(await run('si', UUID)).toMatchObject({ notFound: true });
  });

  it('throws instead of caching an upstream outage', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'unavailable', reason: 'cerebro/query: ETIMEDOUT' });

    await expect(run('si', UUID)).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it('throws when Merlin returns an unusable payload', async () => {
    fetchMerlinCards.mockResolvedValue({ status: 'invalid', reason: 'merlin/cards: bad shape' });

    await expect(run('ms', 'some_pack')).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });
});

/**
 * Regression cover for a live 500 on /cards/pi/<uuid>:
 * "Error serializing `.cards[0].AuthorId` ... `undefined` cannot be serialized".
 */
describe('browse route props are serializable', () => {
  it('survives a Cerebro pack where every optional field is absent', async () => {
    const cards = parseCerebroCards([
      {
        Id: '0001',
        Name: 'Sparse Card',
        Official: true,
        AuthorId: null,
        Attack: null,
        Health: null,
        Resource: null,
        Rules: null,
        Thwart: null,
        Printings: [{ ArtificialId: '0001', PackId: 'pack', PackNumber: '1', Flavor: null }],
      },
      { Id: '0002', Name: 'Barest Card' },
    ]);
    fetchCerebroCards.mockResolvedValue({ status: 'success', data: cards });

    const result = await run('pi', UUID) as { props: unknown };

    expect(findUnserializableValues(result.props)).toEqual([]);
  });

  it('survives a Merlin pack of alter-egos with no cost, attack, or thwart', async () => {
    fetchMerlinCards.mockResolvedValue({
      status: 'success',
      data: [makeMerlinCard(), { ...makeMerlinCard(), code: '202801b', health: 9 }],
    });

    const result = await run('ms', 'alligator_loki_by_ripper3') as { props: unknown };

    expect(findUnserializableValues(result.props)).toEqual([]);
  });
});
