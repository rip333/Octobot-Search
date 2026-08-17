import { describe, expect, it } from 'vitest';
import { tokenizeCardRules } from './cardRules';

describe('tokenizeCardRules', () => {
  it('styles only explicit single-character icon tokens', () => {
    expect(tokenizeCardRules('A{x}B')).toEqual([
      { type: 'text', value: 'A' },
      { type: 'icon', value: 'x' },
      { type: 'text', value: 'B' },
    ]);
  });

  it('preserves multi-character and malformed braces as text', () => {
    expect(tokenizeCardRules('Use {wild} and {x')).toEqual([
      { type: 'text', value: 'Use {wild} and {x' },
    ]);
  });

  it('does not treat one-character plain text as an icon', () => {
    expect(tokenizeCardRules('A')).toEqual([{ type: 'text', value: 'A' }]);
  });
});
