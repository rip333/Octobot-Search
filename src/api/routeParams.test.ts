import { describe, expect, it } from 'vitest';
import { BROWSE_FILTERS, isCerebroCardId, parseBrowseRoute } from './routeParams';

const UUID = '3dd91f75-3cb4-407f-8797-d9fb430cb4ae';

describe('parseBrowseRoute', () => {
  it('accepts every supported filter with a correctly shaped value', () => {
    expect(parseBrowseRoute('si', UUID)).toEqual({ filter: 'si', type: UUID });
    expect(parseBrowseRoute('pi', UUID)).toEqual({ filter: 'pi', type: UUID });
    expect(parseBrowseRoute('usi', UUID)).toEqual({ filter: 'usi', type: UUID });
    expect(parseBrowseRoute('ms', 'alligator_loki_by_ripper3'))
      .toEqual({ filter: 'ms', type: 'alligator_loki_by_ripper3' });
  });

  it('rejects filters outside the supported set', () => {
    for (const filter of ['n', 'ru', 'tr', 'o', '', 'SI', 'si;drop']) {
      expect(parseBrowseRoute(filter, UUID)).toBeNull();
    }
    expect(BROWSE_FILTERS).toEqual(['si', 'pi', 'usi', 'ms']);
  });

  it('rejects Cerebro collection IDs that are not UUIDs', () => {
    for (const value of ['core', '../../etc', `${UUID}x`, '', 'a'.repeat(200)]) {
      expect(parseBrowseRoute('si', value)).toBeNull();
    }
  });

  /**
   * These five codes are live on Merlin and are linked from the unofficial
   * browse view. Rejecting `&` 404'd every one of them before reaching Merlin.
   */
  it.each([
    'ms_marvel_by_cptscorp_&_rycoran',
    'rom_by_alias_&_merlin',
    'ghost_rider_by_swept_&_jiub',
    'stature_by_captain_corp_&_hax',
    'infinity_stones_by_merlin_&_co',
  ])('accepts the co-authored pack code %s', code => {
    expect(parseBrowseRoute('ms', code)).toEqual({ filter: 'ms', type: code });
  });

  it('accepts a pack code at the longest length Merlin currently publishes', () => {
    expect(parseBrowseRoute('ms', 'a'.repeat(45))).not.toBeNull();
  });

  it('rejects Merlin pack codes with query-language or path characters', () => {
    for (const value of ['pack"&o:"true', 'pack/../other', 'pack code', '', 'x'.repeat(80), '&leading']) {
      expect(parseBrowseRoute('ms', value)).toBeNull();
    }
  });

  it('still rejects an ampersand code for Cerebro filters, where & is an operator', () => {
    expect(parseBrowseRoute('si', 'set_a_&_b')).toBeNull();
    expect(parseBrowseRoute('pi', 'pack_a_&_b')).toBeNull();
  });

  it('rejects non-string route values', () => {
    expect(parseBrowseRoute('si', undefined)).toBeNull();
    expect(parseBrowseRoute('si', ['a', 'b'])).toBeNull();
    expect(parseBrowseRoute(undefined, UUID)).toBeNull();
  });
});

describe('isCerebroCardId', () => {
  it('accepts numeric IDs with an optional variant letter', () => {
    expect(isCerebroCardId('04045')).toBe(true);
    expect(isCerebroCardId('01001a')).toBe(true);
  });

  it('rejects anything that could widen a query or the cache', () => {
    for (const value of ['', 'abc', '1"&o:"false', '../01001', '1'.repeat(20), '01001ab']) {
      expect(isCerebroCardId(value)).toBe(false);
    }
    expect(isCerebroCardId(undefined)).toBe(false);
  });
});
