import Head from 'next/head';
import React from 'react';

export const SITE_NAME = 'Octobot Search';
const DEFAULT_DESCRIPTION =
  'Search and browse official Marvel Champions cards, sets, and packs.';

interface PageMetaProps {
  /** Page-specific title. Omit on the homepage to use the site name alone. */
  title?: string;
  description?: string;
  /** Set for pages that must never be indexed, such as error states. */
  noIndex?: boolean;
}

/** Shared title/description defaults plus per-route overrides. */
const PageMeta: React.FC<PageMetaProps> = ({ title, description, noIndex }) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const resolvedDescription = description ?? DEFAULT_DESCRIPTION;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:type" content="website" />
      {noIndex && <meta name="robots" content="noindex" />}
    </Head>
  );
};

export default PageMeta;
