import { describe, expect, it, vi } from 'vitest';
import { CerebroResponseError, parseCerebroCards, parseCerebroPacks, parseCerebroSets } from './cerebro';
import { parseMerlinCards, parseMerlinPacks } from './merlin';
import { UpstreamDataError, parseUpstreamList } from './parse';

/**
 * Contract fixtures. Each upstream is exercised against the payload shapes that
 * have actually caused breakage: absent keys, nulls, wrong types, and future
 * fields we must ignore rather than reject.
 */

describe('Cerebro card contract', () => {
  it('accepts a full card and coerces string-or-number fields', () => {
    const [card] = parseCerebroCards([{
      Id: '04045',
      Name: 'Spider-Man',
      Official: true,
      Cost: 5,
      Attack: '2 {d}',
      Resource: '{m}',
      Traits: ['Avenger', null, 7],
      Printings: [{ ArtificialId: '04045', PackId: 'pack', PackNumber: 45, SetId: null, SetNumber: null, UniqueArt: true }],
    }]);

    expect(card.Cost).toBe('5');
    expect(card.Traits).toEqual(['Avenger']);
    expect(card.Printings[0]).toMatchObject({ PackNumber: '45', SetId: '', UniqueArt: true });
  });

  it('tolerates a null-heavy card', () => {
    const [card] = parseCerebroCards([{
      Id: '1',
      Name: 'Sparse',
      Attack: null,
      Health: null,
      Resource: null,
      Rules: null,
      Traits: null,
      Printings: null,
    }]);

    expect(card.Attack).toBeUndefined();
    expect(card.Traits).toEqual([]);
    expect(card.Printings).toEqual([]);
  });

  it('ignores forward-compatible extra fields', () => {
    const [card] = parseCerebroCards([{ Id: '1', Name: 'Future', SomeNewField: { nested: true } }]);

    expect(card.Name).toBe('Future');
    expect(card).not.toHaveProperty('SomeNewField');
  });

  it('rejects payloads that are not card arrays', () => {
    expect(() => parseCerebroCards({})).toThrow(CerebroResponseError);
    expect(() => parseCerebroCards('nope')).toThrow(CerebroResponseError);
  });

  it('rejects a card missing its identity fields', () => {
    expect(() => parseCerebroCards([{ Name: 'No ID' }])).toThrow(CerebroResponseError);
    expect(() => parseCerebroCards([{ Id: 5, Name: 'Numeric ID' }])).toThrow(CerebroResponseError);
  });

  it('drops malformed printings instead of failing the whole card', () => {
    const [card] = parseCerebroCards([{ Id: '1', Name: 'Mixed', Printings: ['bad', { ArtificialId: 'ok' }] }]);

    expect(card.Printings).toHaveLength(1);
    expect(card.Printings[0].ArtificialId).toBe('ok');
  });
});

describe('Cerebro set and pack contracts', () => {
  it('keeps only the fields the browse UI renders', () => {
    const [set] = parseCerebroSets([{
      Id: 'set-id',
      Name: 'Spider-Man',
      Type: 'Hero Set',
      Official: true,
      CanSimulate: true,
      Modulars: null,
      Requires: null,
    }]);

    expect(set).toEqual({ Id: 'set-id', Name: 'Spider-Man', Type: 'Hero Set' });
  });

  it('rejects a set with no identity', () => {
    expect(() => parseCerebroSets([{ Name: 'Nameless' }])).toThrow(CerebroResponseError);
  });

  it('accepts a pack whose Number is absent', () => {
    const [pack] = parseCerebroPacks([{ Id: 'pack-id', Name: 'Core Set' }]);

    expect(pack).toEqual({ Id: 'pack-id', Name: 'Core Set', Number: '' });
  });
});

describe('Merlin card contract', () => {
  const baseCard = {
    code: '202801a',
    name: 'Alligator Loki',
    type_name: 'Alter-Ego',
    faction_name: 'Hero',
    status: 'released',
    pack_code: 'alligator_loki_by_ripper3',
  };

  it('accepts an alter-ego that omits cost, attack, and thwart entirely', () => {
    const [card] = parseMerlinCards([{ ...baseCard, health: 9, recover: 2 }]);

    expect(card.health).toBe(9);
    expect(card.cost).toBeNull();
    expect(card.attack).toBeNull();
    expect(card.thwart).toBeNull();
  });

  it('accepts nulls and empty strings for optional text', () => {
    const [card] = parseMerlinCards([{ ...baseCard, flavor: '', imagesrc: null, real_traits: '' }]);

    expect(card.flavor).toBeNull();
    expect(card.imagesrc).toBeNull();
    expect(card.real_traits).toBeUndefined();
  });

  it('ignores fields the adapter does not read', () => {
    const [card] = parseMerlinCards([{ ...baseCard, octgn_id: 'x', pack_year: '2025', brand_new: 1 }]);

    expect(card).not.toHaveProperty('octgn_id');
    expect(card).not.toHaveProperty('brand_new');
  });

  it('rejects a card missing a required identifier', () => {
    expect(() => parseMerlinCards([{ ...baseCard, code: undefined }])).toThrow(UpstreamDataError);
    expect(() => parseMerlinCards([{ ...baseCard, pack_code: 42 }])).toThrow(UpstreamDataError);
    expect(() => parseMerlinCards('nope')).toThrow(UpstreamDataError);
  });

  it('names the offending index so diagnostics stay useful', () => {
    expect(() => parseMerlinCards([baseCard, { ...baseCard, name: undefined }]))
      .toThrow(/index 1.*name/i);
  });
});

describe('Merlin pack contract', () => {
  it('accepts a pack without a display name', () => {
    const [pack] = parseMerlinPacks([{ code: 'core', name: 'Core', status: 'Official', pack_type: 'core' }]);

    expect(pack.pack_type_name).toBeUndefined();
  });

  it('rejects a pack with no type', () => {
    expect(() => parseMerlinPacks([{ code: 'x', name: 'X', status: 'released' }])).toThrow(UpstreamDataError);
  });
});

describe('parseUpstreamList', () => {
  it('passes transport outcomes through untouched', () => {
    expect(parseUpstreamList('test', { status: 'empty' }, parseCerebroCards)).toEqual({ status: 'empty' });
    expect(parseUpstreamList('test', { status: 'unavailable', reason: 'HTTP 503' }, parseCerebroCards))
      .toEqual({ status: 'unavailable', reason: 'HTTP 503' });
  });

  it('collapses a healthy but empty list into `empty`', () => {
    expect(parseUpstreamList('test', { status: 'success', data: [] }, parseCerebroCards))
      .toEqual({ status: 'empty' });
  });

  it('turns a schema failure into `invalid` with a safe reason', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = parseUpstreamList('cerebro/query', { status: 'success', data: { oops: true } }, parseCerebroCards);

    expect(result).toMatchObject({ status: 'invalid' });
    expect((result as { reason: string }).reason).toContain('cerebro/query');
    vi.restoreAllMocks();
  });
});
