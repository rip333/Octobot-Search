/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    // Cerebro art uses our same-origin cache endpoint; Merlin stays direct.
    remotePatterns: [
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
