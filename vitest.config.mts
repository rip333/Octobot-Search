import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Next turns a static image import into `{ src, width, height }`; Vite would
 * hand back a bare URL string, which `next/image` rejects. This restores the
 * shape so components that import logos can render under test.
 */
const nextStaticImages = {
  name: 'next-static-images',
  enforce: 'pre' as const,
  load(id: string) {
    const path = id.split('?')[0];
    if (!/\.(png|jpe?g|gif|webp|avif)$/i.test(path)) return null;
    const src = `/_next/static/media/${path.split(/[\\/]/).pop()}`;
    return `export default ${JSON.stringify({ src, width: 320, height: 120, blurDataURL: '' })};`;
  },
};

export default defineConfig({
  plugins: [nextStaticImages, react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Node by default; files that need a DOM opt in with
    // `// @vitest-environment jsdom` so pure logic tests stay fast.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    css: true,
  },
});
