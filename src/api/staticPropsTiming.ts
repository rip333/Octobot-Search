import type { GetStaticProps, GetStaticPropsResult } from 'next';
import type { ParsedUrlQuery } from 'querystring';

/** Fixed route labels only: never log params, props, URLs or error messages. */
export const timeStaticProps = <Props extends object, Params extends ParsedUrlQuery = ParsedUrlQuery>(
  route: '/' | '/card/[id]',
  getProps: GetStaticProps<Props, Params>,
): GetStaticProps<Props, Params> => async context => {
  const started = performance.now();
  let outcome = 'error';
  // Use an allowlist even though Next normally supplies these values.
  const reason = ['build', 'stale', 'on-demand'].includes(context?.revalidateReason ?? '')
    ? context.revalidateReason : 'unknown';
  try {
    const result: GetStaticPropsResult<Props> = await getProps(context);
    outcome = 'notFound' in result ? 'not_found' : 'redirect' in result ? 'redirect' : 'success';
    return result;
  } finally {
    console.info(`[static-props ${route}] outcome=${outcome} reason=${reason} duration_ms=${Math.round(performance.now() - started)}`);
  }
};
