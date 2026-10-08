import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return ['.ts', '.tsx', '.js', '.jsx', '.css'].includes(extname(full)) ? [full] : [];
  });

describe('no-Tailwind styling contract', () => {
  it('has no Tailwind config file', () => {
    for (const name of ['tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs', 'tailwind.config.cjs']) {
      expect(existsSync(join(root, name)), name).toBe(false);
    }
  });

  it('has no Tailwind PostCSS plugin', () => {
    expect(read('postcss.config.js')).not.toMatch(/tailwind/i);
  });

  it('has no Tailwind dependency or locked package', () => {
    const pkg = JSON.parse(read('package.json'));
    const declared = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies };
    expect(Object.keys(declared).filter(name => /tailwind/i.test(name))).toEqual([]);

    const lock = JSON.parse(read('package-lock.json'));
    expect(
      Object.keys(lock.packages).filter(name => /node_modules\/(@tailwindcss\/|tailwindcss)/.test(name)),
    ).toEqual([]);
  });

  it('has no Tailwind directives or utility class strings in source', () => {
    const directive = /@tailwind\b|@apply\b/;
    // className="..." or className='...' containing common utility tokens.
    const utility =
      /className=(?:"[^"]*|'[^']*)\b(?:flex|grid|text-(?:center|white|sm|xs|lg|yellow-\d+|gray-\d+)|bg-[a-z]+-\d+(?:\/\d+)?|px-\d+|py-\d+|mt-\d+|mb-\d+|gap-\d+|rounded(?:-\w+)?|font-(?:sans|medium|bold)|border-[a-z]+-\d+(?:\/\d+)?|items-center|justify-center|flex-col)\b/;

    const offenders = sourceFiles(join(root, 'src'))
      .filter(file => !file.endsWith('noTailwind.test.ts'))
      .filter(file => {
        const text = readFileSync(file, 'utf8');
        return directive.test(text) || utility.test(text);
      });
    expect(offenders).toEqual([]);
  });
});
