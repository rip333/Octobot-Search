import { describe, expect, it } from 'vitest';
import { CardPack } from '@/models/CardPack';
import { CardSet } from '@/models/CardSet';
import { compareCardPacks, compareCardSets } from './cardCollections';

const makeSet = (Id: string, Name: string, Type: string): CardSet => ({ Id, Name, Type });

const makePack = (Id: string, Name: string, Number: string): CardPack => ({ Id, Name, Number });

describe('card collection comparators', () => {
  it('places Hero and Leader sets before known later and unknown types', () => {
    const sets = Object.freeze([
      makeSet('x', 'Unknown', 'Custom Set'),
      makeSet('v', 'Villain', 'Villain Set'),
      makeSet('l', 'Leader', 'Leader Set'),
      makeSet('h', 'Hero', 'Hero Set'),
    ]);

    expect([...sets].sort(compareCardSets).map(set => set.Id)).toEqual(['h', 'l', 'v', 'x']);
    expect(sets.map(set => set.Id)).toEqual(['x', 'v', 'l', 'h']);
  });

  it('orders numbered packs first and uses stable name/id fallbacks', () => {
    const packs = Object.freeze([
      makePack('z', 'Zulu', '0'),
      makePack('b', 'Beta', 'invalid'),
      makePack('two', 'Two', '2'),
      makePack('one', 'One', '1'),
    ]);

    expect([...packs].sort(compareCardPacks).map(pack => pack.Id)).toEqual(['one', 'two', 'b', 'z']);
    expect(packs.map(pack => pack.Id)).toEqual(['z', 'b', 'two', 'one']);
  });
});
