/**
 * ISR revalidation policy, in seconds.
 *
 * The three values encode one rule: cache good content for a long time, cache
 * "this does not exist" only long enough to stay cheap, and never let a
 * transient upstream failure sit in the cache.
 */

/** Card and collection content changes on set-release cadence. */
export const CONTENT_REVALIDATE_SECONDS = 604_800; // 7 days

/** Browse listings gain new packs more often than card text changes. */
export const LISTING_REVALIDATE_SECONDS = 3_600; // 1 hour

/** A 404 must expire soon enough that a newly published card becomes reachable. */
export const NOT_FOUND_REVALIDATE_SECONDS = 900; // 15 minutes

/**
 * Applied when a page rendered usefully but one of its sections is missing.
 * Short enough that a partial outage heals itself without a deploy.
 */
export const PARTIAL_FAILURE_REVALIDATE_SECONDS = 120; // 2 minutes

/**
 * Thrown when an upstream is unavailable or returned an unusable payload.
 *
 * `getStaticProps` throws this instead of returning props so Next keeps serving
 * the last successfully generated page and retries on the next request. Caching
 * an outage as content is the failure mode this exists to prevent.
 */
export class UpstreamUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'UpstreamUnavailableError';
  }
}
