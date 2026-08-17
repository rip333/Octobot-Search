import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CardPack } from '@/models/CardPack';
import { CardSet } from '@/models/CardSet';
import { UpstreamResult } from '@/api/result';

const fetchCerebroSets = vi.fn<() => Promise<UpstreamResult<CardSet[]>>>();
const fetchCerebroPacks = vi.fn<() => Promise<UpstreamResult<CardPack[]>>>();

vi.mock('@/api/cerebro', () => ({
  CEREBRO_BASE_URL: 'https://cerebro.test',
  fetchCerebroSets: () => fetchCerebroSets(),
  fetchCerebroPacks: () => fetchCerebroPacks(),
}));

const SET: CardSet = { Id: 'set-1', Name: 'Spider-Man', Type: 'Hero Set' };
const PACK: CardPack = { Id: 'pack-1', Name: 'Core Set', Number: '1' };

type Props = {
  sets: CardSet[];
  packs: CardPack[];
  setsUnavailable: boolean;
  packsUnavailable: boolean;
};

let UpstreamUnavailableError: new (reason: string) => Error;
let getStaticProps: () => Promise<{ props: Props; revalidate: number }>;

beforeEach(async () => {
  vi.resetModules();
  ({ UpstreamUnavailableError } = await import('@/api/revalidate'));
  fetchCerebroSets.mockReset();
  fetchCerebroPacks.mockReset();
  ({ getStaticProps } = await import('@/pages/index') as never);
});

describe('homepage getStaticProps', () => {
  it('serializes only the lean fields the browse UI renders', async () => {
    fetchCerebroSets.mockResolvedValue({ status: 'success', data: [SET] });
    fetchCerebroPacks.mockResolvedValue({ status: 'success', data: [PACK] });

    const { props } = await getStaticProps();

    expect(Object.keys(props.sets[0]).sort()).toEqual(['Id', 'Name', 'Type']);
    expect(Object.keys(props.packs[0]).sort()).toEqual(['Id', 'Name', 'Number']);
  });

  it('does not request community data for the default view', async () => {
    fetchCerebroSets.mockResolvedValue({ status: 'success', data: [SET] });
    fetchCerebroPacks.mockResolvedValue({ status: 'success', data: [PACK] });

    await getStaticProps();

    expect(fetchCerebroSets).toHaveBeenCalledTimes(1);
    expect(fetchCerebroPacks).toHaveBeenCalledTimes(1);
  });

  it('keeps rendering sets when only the pack source fails', async () => {
    fetchCerebroSets.mockResolvedValue({ status: 'success', data: [SET] });
    fetchCerebroPacks.mockResolvedValue({ status: 'unavailable', reason: 'cerebro/packs: HTTP 503' });

    const { props, revalidate } = await getStaticProps();

    expect(props.sets).toHaveLength(1);
    expect(props.packs).toEqual([]);
    expect(props.packsUnavailable).toBe(true);
    expect(props.setsUnavailable).toBe(false);
    // Retried far sooner than a healthy page.
    expect(revalidate).toBeLessThanOrEqual(300);
  });

  it('treats a genuinely empty listing as available but empty', async () => {
    fetchCerebroSets.mockResolvedValue({ status: 'empty' });
    fetchCerebroPacks.mockResolvedValue({ status: 'success', data: [PACK] });

    const { props } = await getStaticProps();

    expect(props.sets).toEqual([]);
    expect(props.setsUnavailable).toBe(false);
  });

  it('throws when nothing useful can be rendered', async () => {
    fetchCerebroSets.mockResolvedValue({ status: 'unavailable', reason: 'cerebro/sets: HTTP 503' });
    fetchCerebroPacks.mockResolvedValue({ status: 'unavailable', reason: 'cerebro/packs: HTTP 503' });

    await expect(getStaticProps()).rejects.toBeInstanceOf(UpstreamUnavailableError);
  });

  it('uses a long revalidate when both sources are healthy', async () => {
    fetchCerebroSets.mockResolvedValue({ status: 'success', data: [SET] });
    fetchCerebroPacks.mockResolvedValue({ status: 'success', data: [PACK] });

    const { revalidate } = await getStaticProps();

    expect(revalidate).toBeGreaterThanOrEqual(3600);
  });
});
