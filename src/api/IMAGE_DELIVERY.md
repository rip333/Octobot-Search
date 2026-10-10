# Cerebro image delivery

Implemented locally on 2026-10-10. Production remains unchanged until an authorized deployment.

## Contract

`cardImageSource.ts` maps exact Azure/R2 Cerebro URLs and constructed art paths to the stable
same-origin namespace `/api/card-images/v1/`. `CardImage` uses unoptimized images with its existing
lazy/priority behavior. Failed or unsupported art shows the accessible placeholder; there is no
direct-origin retry. Merlin delivery remains direct.

The Pages route is `src/pages/api/card-images/v1/[origin]/[...filename].ts`. `official` accepts one
filename; `unofficial` accepts a filename or a decimal creator folder followed by a filename.
Creator folders have 1–20 digits; filenames have 1–100 ASCII letters/digits/underscores/hyphens plus
a lowercase `jpg`, `jpeg`, `png`, `webp` or `gif` extension. Case and leading zeroes are preserved.
Queries, escaping, traversal, extra folders, Authorization and Range are rejected before origin work.
Only GET and HEAD are supported. Caller headers/cookies are never passed to the source.

`cardImageBinary.ts` uses the fixed R2 root, the Axios Node HTTP adapter, no redirects or retries,
a five-second total deadline, and a streamed two-MiB limit even without a truthful Content-Length.
Extension, raster MIME and container structure must agree. Responses are buffered before becoming
cacheable. `cardImageStructure.ts` requires image data plus complete JPEG markers, PNG chunks/IEND,
GIF blocks/trailer or WebP RIFF/chunks. Header-only files and structurally truncated files return
503/no-store. This is a bounded walk over the already limited bytes, not compressed-pixel validation;
arbitrary corruption inside compressed data may remain undetected. No image decoding/resizing occurs.
Validation work is included in the five-second budget before successful bytes are returned.
HEAD validates the same bytes as GET and returns the same metadata without a body.

| Response | Browser Cache-Control | CDN-Cache-Control |
| --- | --- | --- |
| Valid 200 | `public, max-age=604800` (7 days) | `public, s-maxage=2592000` (30 days) |
| Origin 404 | `public, max-age=0` | `public, s-maxage=60` |
| Validation/method error, timeout, redirect, 429, invalid body, other origin failure | `no-store` | absent |

Cookies, upstream cache directives, authentication and referrer-dependent variants are absent from
responses. Concurrent identical misses share one promise only within a single process; completion
releases it. This is neither a durable cache nor a global lock/rate limit. The shared cache is the
hosting CDN, which can evict entries and fetch independently by region/deployment.

One `[upstream cerebro/image]` line per actual origin fetch records outcome, status class, duration,
consumed bytes and attempts (one). It excludes URLs, card/creator IDs, payloads and error text.
Outcomes distinguish success, missing art, throttling, redirects, upstream errors, invalid bytes,
timeouts and other unavailability, using fixed labels.
CDN hits skip the function; these logs do not provide a CDN hit ratio.

## Verification and release

Local fixtures cover migration, identity, stable source attributes, lazy loading, placeholders, headers,
GET/HEAD, validation, byte limits, deadlines, deduplication and errors. Local HTTP fixture tests exercise
the actual adapter against redirects, chunked bodies and a body that never finishes, without live art.
Component tests use jsdom, not a layout-capable browser or its HTTP cache.

Follow-up regressions cover every incomplete prefix of valid baseline/progressive JPEG, PNG, GIF,
lossy/lossless WebP fixtures, misleading trailers, incomplete blocks/chunks and a normally completed
HTTP response with a truncated JPEG. Success fixtures are locally generated complete images.
Animated GIF/WebP and alpha WebP fixtures guard valid variants. Real HTTP fixture tests also exercise
the full GET/HEAD handler and verify truncated art produces 503/no-store without CDN cache headers.
Container layouts follow [ITU JPEG](https://www.w3.org/Graphics/JPEG/itu-t81.pdf),
[W3C PNG](https://www.w3.org/TR/png/), [GIF89a](https://www.w3.org/Graphics/GIF/spec-gif89a.txt)
and the [WebP container specification](https://developers.google.com/speed/webp/docs/riff_container).

On 2026-10-10, the supplied official `00001.jpg` returned a 264,964-byte JPEG. One real unofficial
sample from Cerebro metadata, `237660307835715585/01001B.jpg`, returned a 315,207-byte JPEG. Both
R2 responses omitted Cache-Control. These observations establish those two paths, not the whole catalog.

Before production rollout:

1. Review the current account-wide transfer/request/function allowance and dependency audit findings.
   Adding same-origin images moves transfer through Vercel; it does not remove bandwidth costs.
2. Obtain owner authorization for a preview deployment. On an approved cacheable surface, use bounded
   requests to establish GET MISS → HIT with identical bytes, second-client reuse, and HEAD → GET
   correctness. Verify browser cache reuse with DevTools “Disable cache” off and normal requests.
   Do not send no-cache directives or add timestamp/query variants for the HIT check.
3. Check a genuine 404's short expiry and cookie/auth/access-policy effects. Do not change preview
   protection to make a test pass. Local headers cannot establish hosted CDN behavior.
4. After separately authorized production rollout, check the first 24 hours of origin fetches, CDN
   hits/misses, transfer, errors and allowance. No bulk crawl, cache warming or automatic plan upgrade.

Vercel documents separate browser and CDN policies in
[cache-control headers](https://vercel.com/docs/caching/cache-control-headers). Those documented
semantics support the configured contract; the actual deployment still needs the checks above.

## Corrected art, source migration and emergency withdrawal

For corrected mutable art, bump `IMAGE_ROUTE` and the matching physical API route namespace together
(for example v1 → v2), update tests, rebuild, and obtain deployment authorization. Retire the old
route; the new URL bypasses existing browser/CDN entries. A provider purge alone cannot clear a
visitor's fresh browser copy, so there is deliberately no `immutable` directive.

For a creator-approved source change, update the fixed root and recognized source origins, preserve
old metadata URL recognition, bump the namespace, and repeat bounded verification. Do not invent a
different source or automatically follow redirects. The creator's `r2.dev` origin may throttle.

If delivery must be withdrawn, make the source resolver return null for Cerebro art and the endpoint
return no-store errors, then request an authorized deployment. Previously cached URLs may remain
fresh until expiry; purge CDN entries if separately authorized. Do not roll back to direct Azure/R2
hotlinking or use a provider quota failure to retry the creator's origin from browsers.
