import { Head, Html, Main, NextScript } from 'next/document';

/**
 * Global document markup. Page-specific metadata lives in `PageMeta`; only
 * things that must be identical on every route belong here.
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#111111" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
