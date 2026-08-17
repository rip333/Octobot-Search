/**
 * WCAG 2.1 relative-luminance contrast, used to catch palette regressions.
 *
 * Colors are given as hex; translucent layers are flattened with `blend` first,
 * because contrast is a property of what the eye actually sees.
 */

export type Rgb = readonly [number, number, number];

export const parseHex = (hex: string): Rgb => {
  const normalized = hex.replace('#', '').trim();
  const expanded = normalized.length === 3
    ? normalized.split('').map(character => character + character).join('')
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    throw new Error(`Not a hex color: ${hex}`);
  }

  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ];
};

/** Flattens `foreground` at `alpha` over `background`, as a browser would. */
export const blend = (foreground: Rgb, alpha: number, background: Rgb): Rgb => [
  Math.round(foreground[0] * alpha + background[0] * (1 - alpha)),
  Math.round(foreground[1] * alpha + background[1] * (1 - alpha)),
  Math.round(foreground[2] * alpha + background[2] * (1 - alpha)),
];

const channelLuminance = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = ([r, g, b]: Rgb): number =>
  0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);

export const contrastRatio = (a: Rgb, b: Rgb): number => {
  const luminanceA = relativeLuminance(a);
  const luminanceB = relativeLuminance(b);
  const [lighter, darker] = luminanceA > luminanceB
    ? [luminanceA, luminanceB]
    : [luminanceB, luminanceA];

  return (lighter + 0.05) / (darker + 0.05);
};

/** WCAG AA: 4.5:1 for body text, 3:1 for large text and UI boundaries. */
export const AA_NORMAL_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;

export const PAGE_BACKGROUND = parseHex('#001126');
export const TEXT_ON_DARK = parseHex('#ffffff');

/**
 * Every foreground/background pair the UI declares, so a palette edit that
 * breaks contrast fails a test rather than shipping.
 *
 * Each entry names the stylesheet it mirrors; update both together.
 */
export const UI_COLOR_PAIRS: ReadonlyArray<{
  name: string;
  foreground: Rgb;
  background: Rgb;
  minimum: number;
}> = [
  {
    name: 'body text on page background (globals.css)',
    foreground: TEXT_ON_DARK,
    background: PAGE_BACKGROUND,
    minimum: AA_NORMAL_TEXT,
  },
  {
    name: 'results count, white 70% (Results.module.css .resultsCount)',
    foreground: blend(TEXT_ON_DARK, 0.7, PAGE_BACKGROUND),
    background: PAGE_BACKGROUND,
    minimum: AA_NORMAL_TEXT,
  },
  {
    name: 'filter hint, white 80% (FilterOptions.module.css .filterHint)',
    foreground: blend(TEXT_ON_DARK, 0.8, PAGE_BACKGROUND),
    background: PAGE_BACKGROUND,
    minimum: AA_NORMAL_TEXT,
  },
  {
    name: 'chip label (FilterOptions.module.css .chip)',
    foreground: TEXT_ON_DARK,
    background: parseHex('#2d3748'),
    minimum: AA_NORMAL_TEXT,
  },
  {
    name: 'active chip label (FilterOptions.module.css .chipActive)',
    foreground: TEXT_ON_DARK,
    background: parseHex('#4a5568'),
    minimum: AA_NORMAL_TEXT,
  },
  {
    name: 'filter badge and clear-all (FilterOptions.module.css)',
    foreground: TEXT_ON_DARK,
    background: parseHex('#c53030'),
    minimum: AA_NORMAL_TEXT,
  },
  {
    name: 'browse link label (Shared.module.css .redButton over page)',
    foreground: TEXT_ON_DARK,
    background: blend(parseHex('#ed1d24'), 0x79 / 255, PAGE_BACKGROUND),
    minimum: AA_NORMAL_TEXT,
  },
  {
    name: 'unavailable notice (Browse.module.css .unavailable)',
    foreground: parseHex('#ffd873'),
    background: blend(parseHex('#000000'), 0.35, PAGE_BACKGROUND),
    minimum: AA_NORMAL_TEXT,
  },
  {
    name: 'focus ring against page background',
    foreground: TEXT_ON_DARK,
    background: PAGE_BACKGROUND,
    minimum: AA_LARGE_TEXT,
  },
];
