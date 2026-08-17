/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Card art is served from the two upstream card databases only.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cerebrodatastorage.blob.core.windows.net',
        pathname: '/cerebro-cards/**',
      },
      {
        protocol: 'https',
        hostname: 'mc4db.merlindumesnil.net',
        pathname: '/bundles/**',
      },
      {
        protocol: 'https',
        hostname: 'db.merlindumesnil.net',
        pathname: '/bundles/**',
      },
    ],
  },
};

module.exports = nextConfig;
