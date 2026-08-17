import { describe, expect, it } from 'vitest';
import { parseCerebroCards } from '@/api/cerebro';
import { withoutUndefined } from '@/api/parse';
import { merlinCardToCard } from '@/merlin-adapter';
import { MerlinCard } from '@/models/MerlinCard';
import { findUnserializableValues } from './support/nextSerializable';

/**
 * Regression cover for a live 500:
 *
 *   Error serializing `.cards[0].AuthorId` returned from `getStaticProps`
 *   Reason: `undefined` cannot be serialized as JSON.
 *
 * Optional fields must be absent keys, never present-but-`undefined` ones.
 */

const SPARSE_CEREBRO_CARD = {
  Id: '0001',
  Name: 'Sparse Card',
  Official: true,
  // Everything below is absent upstream, which is what triggered the 500.
  AuthorId: null,
  Attack: null,
  Health: null,
  Resource: null,
  Rules: null,
  Thwart: null,
  Printings: [{ ArtificialId: '0001', PackId: 'pack', PackNumber: '1', Flavor: null }],
};

const sparseMerlinCard = (): MerlinCard => ({
  code: '202801a',
  name: 'Alligator Loki',
  type_name: 'Alter-Ego',
  faction_name: 'Hero',
  status: 'released',
  pack_code: 'alligator_loki_by_ripper3',
});

describe('findUnserializableValues', () => {
  it('names the exact path Next would reject', () => {
    expect(findUnserializableValues({ cards: [{ AuthorId: undefined }] }))
      .toEqual(['props.cards[0].AuthorId is `undefined`']);
  });

  it('accepts nulls, nested arrays, and primitives', () => {
    expect(findUnserializableValues({ a: null, b: [1, 'x', true, { c: null }] })).toEqual([]);
  });

  it('rejects values JSON cannot round-trip', () => {
    expect(findUnserializableValues({ when: new Date() })).toHaveLength(1);
    expect(findUnserializableValues({ run: () => undefined })).toHaveLength(1);
  });
});

describe('withoutUndefined', () => {
  it('drops undefined keys and keeps explicit nulls and falsy values', () => {
    const result = withoutUndefined({ a: undefined, b: null, c: '', d: 0, e: false });

    expect(Object.keys(result).sort()).toEqual(['b', 'c', 'd', 'e']);
    expect('a' in result).toBe(false);
  });
});

describe('parsed Cerebro cards are safe as page props', () => {
  it('omits absent optional fields rather than setting them to undefined', () => {
    const [card] = parseCerebroCards([SPARSE_CEREBRO_CARD]);

    expect(findUnserializableValues({ cards: [card] })).toEqual([]);
    expect('AuthorId' in card).toBe(false);
    expect('Attack' in card).toBe(false);
    expect('Flavor' in card.Printings[0]).toBe(false);
  });

  it('keeps every optional field it does have', () => {
    const [card] = parseCerebroCards([{
      ...SPARSE_CEREBRO_CARD,
      AuthorId: 'author-1',
      Attack: '2 {d}',
      Printings: [{ ArtificialId: '0001', Flavor: 'Words.' }],
    }]);

    expect(card.AuthorId).toBe('author-1');
    expect(card.Attack).toBe('2 {d}');
    expect(card.Printings[0].Flavor).toBe('Words.');
    expect(findUnserializableValues({ cards: [card] })).toEqual([]);
  });

  it('survives a whole list where every card is sparse', () => {
    const cards = parseCerebroCards([
      SPARSE_CEREBRO_CARD,
      { Id: '0002', Name: 'Barest Card' },
      { Id: '0003', Name: 'Also Bare', Printings: [] },
    ]);

    expect(findUnserializableValues({ cards })).toEqual([]);
  });
});

describe('adapted Merlin cards are safe as page props', () => {
  it('omits stats and images Merlin does not provide', () => {
    const card = merlinCardToCard(sparseMerlinCard());

    expect(findUnserializableValues({ cards: [card] })).toEqual([]);
    expect('Attack' in card).toBe(false);
    expect('BackImageUrl' in card).toBe(false);
    expect('Flavor' in card.Printings[0]).toBe(false);
  });

  it('stays serializable with every optional field populated', () => {
    const card = merlinCardToCard({
      ...sparseMerlinCard(),
      cost: 3,
      health: 9,
      attack: 2,
      thwart: 1,
      flavor: 'Words.',
      imagesrc: '/front.webp',
      backimagesrc: '/back.webp',
      double_sided: true,
      creator: 'Ripper3',
    });

    expect(findUnserializableValues({ cards: [card] })).toEqual([]);
    expect(card.BackImageUrl).toContain('/back.webp');
  });
});
