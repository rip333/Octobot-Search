import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchCerebroSets } from '@/api/cerebro';
import { fetchMerlinPacks } from '@/api/merlin';
import { isUpstreamFailure, listOrEmpty } from '@/api/result';
import { merlinPackToCardSet } from '@/merlin-adapter';
import { UnofficialCardSet } from '@/models/CardSet';

export interface UnofficialBrowseResponse {
  sets: UnofficialCardSet[];
  /** True when at least one source failed and the list is incomplete. */
  partial: boolean;
}

/**
 * Community sets, loaded on demand.
 *
 * These live behind an API route rather than in the homepage's static props so
 * the default (official) view does not pay for data most visitors never open.
 */
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<UnofficialBrowseResponse | { error: string }>,
) {
  const [cerebroResult, merlinResult] = await Promise.all([
    fetchCerebroSets(false),
    fetchMerlinPacks(),
  ]);

  const cerebroFailed = isUpstreamFailure(cerebroResult);
  const merlinFailed = isUpstreamFailure(merlinResult);

  if (cerebroFailed && merlinFailed) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: 'Community card sources are temporarily unavailable.' });
  }

  const sets: UnofficialCardSet[] = [
    ...listOrEmpty(merlinResult)
      .filter(pack => pack.status !== 'Official')
      .map(pack => ({ ...merlinPackToCardSet(pack), Source: 'ms' as const })),
    ...listOrEmpty(cerebroResult).map(set => ({ ...set, Source: 'usi' as const })),
  ];

  const partial = cerebroFailed || merlinFailed;
  res.setHeader(
    'Cache-Control',
    partial
      ? 'public, s-maxage=120, stale-while-revalidate=600'
      : 'public, s-maxage=3600, stale-while-revalidate=86400',
  );

  return res.status(200).json({ sets, partial });
}
