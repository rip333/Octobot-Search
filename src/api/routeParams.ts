/**
 * Route-parameter contracts for the dynamic card routes.
 *
 * Two jobs: keep unvalidated route text out of upstream queries, and bound how
 * many ISR cache entries a crawler can create. Anything that fails these checks
 * must produce `notFound` before a single upstream request is made.
 */

/** Every browse source the `/cards/[filter]/[type]` route supports. */
export const BROWSE_FILTERS = ['si', 'pi', 'usi', 'ms'] as const;

export type BrowseFilter = (typeof BROWSE_FILTERS)[number];

export const isBrowseFilter = (value: unknown): value is BrowseFilter =>
  typeof value === 'string' && (BROWSE_FILTERS as readonly string[]).includes(value);

/** Cerebro set and pack identifiers are UUIDs. */
const CEREBRO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Merlin pack codes are lowercase slugs such as `alligator_loki_by_ripper3`.
 *
 * Co-authored packs join their creators with `&`, as in
 * `ms_marvel_by_cptscorp_&_rycoran`, so the alphabet must include it. That is
 * safe here: a pack code only ever reaches Merlin as a percent-encoded path
 * segment, never a Cerebro query where `&` would be an operator.
 *
 * Longest live code is 45 characters; the cap leaves room without letting a
 * crawler mint unbounded cache entries.
 */
const MERLIN_PACK_CODE = /^[a-z0-9][a-z0-9_&-]{0,63}$/i;

/** Cerebro card identifiers are a numeric run with an optional variant letter, e.g. `04045`, `01001a`. */
const CEREBRO_CARD_ID = /^[0-9]{1,10}[a-z]?$/i;

export const isCerebroCardId = (value: unknown): value is string =>
  typeof value === 'string' && CEREBRO_CARD_ID.test(value);

/** Validates `type` against the format its `filter` implies. */
export const isValidBrowseType = (filter: BrowseFilter, type: unknown): type is string => {
  if (typeof type !== 'string') return false;

  switch (filter) {
    case 'si':
    case 'pi':
    case 'usi':
      return CEREBRO_UUID.test(type);
    case 'ms':
      return MERLIN_PACK_CODE.test(type);
  }
};

export interface BrowseRoute {
  filter: BrowseFilter;
  type: string;
}

/** Returns the validated route, or `null` when the combination is unsupported. */
export const parseBrowseRoute = (filter: unknown, type: unknown): BrowseRoute | null => {
  if (!isBrowseFilter(filter)) return null;
  if (!isValidBrowseType(filter, type)) return null;
  return { filter, type };
};
