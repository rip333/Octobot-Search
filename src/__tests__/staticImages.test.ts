import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Image declarations must come from a committed file, not the generated
// next-env.d.ts, which only exists locally after a build.

const SOURCE_ROOT = path.join(process.cwd(), 'src');
const DECLARATION_FILE = path.join(SOURCE_ROOT, 'types', 'static-images.d.ts');
const NEXT_IMAGE_TYPES = path.join(process.cwd(), 'node_modules', 'next', 'image-types', 'global.d.ts');

const IMAGE_IMPORT = /(?:from|import)\s+['"][^'"]+\.([a-z0-9]+)['"]/gi;
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp']);

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
  });

const importedImageExtensions = (): Set<string> => {
  const found = new Set<string>();
  for (const file of sourceFiles(SOURCE_ROOT)) {
    const contents = readFileSync(file, 'utf8');
    for (const match of contents.matchAll(IMAGE_IMPORT)) {
      const extension = match[1].toLowerCase();
      if (IMAGE_EXTENSIONS.has(extension)) found.add(extension);
    }
  }
  return found;
};

describe('static image type declarations', () => {
  it('are supplied by a committed file, not by generated next-env.d.ts', () => {
    // Reading it is the assertion: a missing file throws here, not only in CI.
    const declaration = readFileSync(DECLARATION_FILE, 'utf8');
    expect(declaration).toContain('next/image-types/global');
  });

  it('cover every image extension the source actually imports', () => {
    const declared = readFileSync(NEXT_IMAGE_TYPES, 'utf8');
    const used = importedImageExtensions();

    // Reverse direction: importing a format Next does not declare type-checks nowhere.
    expect(used.size).toBeGreaterThan(0);
    for (const extension of used) {
      expect(declared, `no declaration for *.${extension}`).toContain(`declare module '*.${extension}'`);
    }
  });
});
