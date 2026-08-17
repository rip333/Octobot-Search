import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  AA_NORMAL_TEXT,
  PAGE_BACKGROUND,
  UI_COLOR_PAIRS,
  blend,
  contrastRatio,
  parseHex,
} from './contrast';

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

describe('contrast maths', () => {
  it('matches the WCAG reference extremes', () => {
    expect(contrastRatio(parseHex('#ffffff'), parseHex('#000000'))).toBeCloseTo(21, 5);
    expect(contrastRatio(parseHex('#777777'), parseHex('#777777'))).toBeCloseTo(1, 5);
  });

  it('expands three-digit hex', () => {
    expect(parseHex('#fff')).toEqual(parseHex('#ffffff'));
  });

  it('rejects values that are not colors', () => {
    expect(() => parseHex('nope')).toThrow();
  });

  it('flattens a translucent layer the way a browser composites it', () => {
    expect(blend(parseHex('#ffffff'), 0.5, parseHex('#000000'))).toEqual([128, 128, 128]);
  });
});

describe('UI palette', () => {
  it.each(UI_COLOR_PAIRS)('$name meets its contrast minimum', ({ foreground, background, minimum }) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
  });

  it('tracks the page background actually declared in globals.css', () => {
    const declared = readSource('../globals.css').match(/background-color:\s*(#[0-9a-f]{3,6})/i);

    expect(declared).not.toBeNull();
    expect(parseHex(declared![1])).toEqual(PAGE_BACKGROUND);
  });

  it('no longer uses the #e53e3e red that failed AA against white text', () => {
    const filterStyles = readSource('../components/filters/FilterOptions.module.css');

    expect(contrastRatio(parseHex('#ffffff'), parseHex('#e53e3e'))).toBeLessThan(AA_NORMAL_TEXT);
    expect(filterStyles).not.toContain('#e53e3e');
  });
});
