import type { GetServerSideProps } from 'next';

/**
 * Creator Drive pages are intentionally disabled and return 404.
 *
 * TODO before restoring this page:
 * - Define whether access is limited to curated public creator roots or may
 *   include private folders shared with the service account.
 * - Keep an allowlist of approved root folder IDs on the server and verify
 *   that every navigated child remains a descendant of its approved root.
 * - Accept only canonical Google Drive folder IDs; never interpolate raw route
 *   or query-string input into a Google Drive search expression.
 * - Add authentication if any non-public content is supported, plus per-client
 *   rate limiting, response caching, request timeouts, and audit logging.
 * - Paginate Drive results instead of silently truncating folders at 1,000
 *   items, and validate Google responses before returning them to the client.
 * - Return generic client errors while retaining detailed server-side logs;
 *   never expose credential or upstream exception details.
 * - Add abortable client requests, accessible keyboard controls/modal focus
 *   management, and tests for authorization, traversal, and invalid IDs.
 */
export default function DisabledCreatorDrivePage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => ({
  notFound: true,
});
