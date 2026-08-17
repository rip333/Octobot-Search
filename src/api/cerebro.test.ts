import { describe, expect, it } from 'vitest';
import { CerebroResponseError, parseCerebroCards } from './cerebro';

describe('parseCerebroCards', () => {
  it('normalizes optional fields and valid printings', () => {
    const [card] = parseCerebroCards([{
      Id: 'card-1',
      Name: 'Card',
      Cost: 2,
      Traits: ['Hero', null],
      Printings: [{ ArtificialId: 'art-1', PackNumber: 3, UniqueArt: true }],
    }]);

    expect(card.Cost).toBe('2');
    expect(card.Traits).toEqual(['Hero']);
    expect(card.Printings[0]).toMatchObject({
      ArtificialId: 'art-1',
      PackNumber: '3',
      UniqueArt: true,
    });
  });

  it('rejects non-array and unidentifiable card responses', () => {
    expect(() => parseCerebroCards({})).toThrow(CerebroResponseError);
    expect(() => parseCerebroCards([{ Name: 'Missing ID' }])).toThrow(CerebroResponseError);
  });
});
