// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Card } from '@/models/Card';
import { UpstreamResult } from '@/api/result';

const routerState = {
  isReady: false,
  query: {} as Record<string, string>,
  push: vi.fn(),
  pathname: '/search',
};

vi.mock('next/router', () => ({
  useRouter: () => routerState,
}));

const fetchCerebroCards = vi.fn<(query: string, signal?: AbortSignal) => Promise<UpstreamResult<Card[]>>>();

vi.mock('@/api/cerebro', () => ({
  CEREBRO_BASE_URL: 'https://cerebro.test',
  fetchCerebroCards: (query: string, signal?: AbortSignal) => fetchCerebroCards(query, signal),
}));

const makeCard = (Id: string, Name: string): Card => ({
  Deleted: false,
  Id,
  Official: true,
  Classification: 'Justice',
  Cost: '1',
  Name,
  Printings: [],
  Subname: '',
  Traits: [],
  Type: 'Event',
  Unique: false,
  ImageUrl: '',
});

/** A promise whose resolution this test controls. */
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
};

let Search: React.ComponentType;

beforeEach(async () => {
  vi.resetModules();
  routerState.isReady = false;
  routerState.query = {};
  fetchCerebroCards.mockReset();
  Search = (await import('@/pages/search')).default;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('search page', () => {
  it('shows an idle prompt and never flashes an empty state before results arrive', async () => {
    const pending = deferred<UpstreamResult<Card[]>>();
    fetchCerebroCards.mockReturnValue(pending.promise);

    routerState.isReady = false;
    routerState.query = { query: 'spider' };
    const { rerender } = render(<Search />);

    // Nothing has been requested yet: the router has not settled.
    expect(fetchCerebroCards).not.toHaveBeenCalled();
    expect(screen.queryByText(/NO RESULTS FOUND/i)).toBeNull();
    expect(screen.getByText(/Enter a card name/i)).toBeDefined();

    routerState.isReady = true;
    rerender(<Search />);

    await waitFor(() => expect(fetchCerebroCards).toHaveBeenCalled());
    // Still loading, so still no empty state.
    expect(screen.queryByText(/NO RESULTS FOUND/i)).toBeNull();

    pending.resolve({ status: 'success', data: [makeCard('1', 'Spider-Man')] });
    await screen.findByText('1 card');
    expect(screen.queryByText(/NO RESULTS FOUND/i)).toBeNull();
  });

  it('reports an empty state only once the upstream confirms no matches', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'empty' });

    routerState.isReady = true;
    routerState.query = { query: 'zzzzz' };
    render(<Search />);

    await screen.findByText(/NO RESULTS FOUND/i);
    // Exact query, then the partial-match fallback.
    expect(fetchCerebroCards).toHaveBeenCalledTimes(2);
  });

  it('does not let a slow earlier search overwrite a newer one', async () => {
    const slowFirst = deferred<UpstreamResult<Card[]>>();
    fetchCerebroCards.mockReturnValueOnce(slowFirst.promise);

    routerState.isReady = true;
    routerState.query = { query: 'first' };
    const { rerender } = render(<Search />);
    await waitFor(() => expect(fetchCerebroCards).toHaveBeenCalledTimes(1));

    // Second search starts and finishes while the first is still in flight.
    fetchCerebroCards.mockResolvedValue({ status: 'success', data: [makeCard('2', 'Second Result')] });
    routerState.query = { query: 'second' };
    rerender(<Search />);

    await screen.findByText('1 card');
    expect(screen.getByLabelText('Second Result')).toBeDefined();

    // The stale response lands last and must be discarded.
    slowFirst.resolve({ status: 'success', data: [makeCard('1', 'Stale Result'), makeCard('3', 'Also Stale')] });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('1 card')).toBeDefined();
    expect(screen.queryByLabelText('Stale Result')).toBeNull();
  });

  it('aborts the in-flight request when the query changes', async () => {
    const signals: Array<AbortSignal | undefined> = [];
    fetchCerebroCards.mockImplementation((_query, signal) => {
      signals.push(signal);
      return new Promise(() => { /* never settles */ });
    });

    routerState.isReady = true;
    routerState.query = { query: 'first' };
    const { rerender } = render(<Search />);
    await waitFor(() => expect(signals).toHaveLength(1));

    routerState.query = { query: 'second' };
    rerender(<Search />);
    await waitFor(() => expect(signals).toHaveLength(2));

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('offers a retry when the upstream is unavailable', async () => {
    fetchCerebroCards.mockResolvedValue({ status: 'unavailable', reason: 'cerebro/query: HTTP 503' });

    routerState.isReady = true;
    routerState.query = { query: 'spider' };
    render(<Search />);

    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: /try again/i })).toBeDefined();
    expect(screen.queryByText(/NO RESULTS FOUND/i)).toBeNull();
  });
});
