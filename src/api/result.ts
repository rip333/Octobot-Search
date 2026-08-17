/**
 * One result model for every external call.
 *
 * `success` and `empty` are both healthy outcomes: `empty` means the upstream
 * answered and genuinely has nothing, which callers must be able to cache
 * differently from `unavailable` (transient outage) and `invalid` (the upstream
 * answered with a shape we do not understand).
 */
export type UpstreamResult<T> =
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'unavailable'; reason: string }
  | { status: 'invalid'; reason: string };

export type UpstreamFailure = Extract<UpstreamResult<never>, { reason: string }>;

export const isUpstreamFailure = <T>(
  result: UpstreamResult<T>,
): result is UpstreamFailure => result.status === 'unavailable' || result.status === 'invalid';

/** Collapses a list into `empty` when the upstream answered with nothing. */
export const listResult = <T>(items: T[]): UpstreamResult<T[]> =>
  items.length > 0 ? { status: 'success', data: items } : { status: 'empty' };

/** Returns the list for healthy results and `[]` for failures. */
export const listOrEmpty = <T>(result: UpstreamResult<T[]>): T[] =>
  result.status === 'success' ? result.data : [];
