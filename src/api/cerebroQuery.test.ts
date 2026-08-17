import { describe, expect, it } from 'vitest';
import {
  OFFICIAL_ONLY,
  all,
  any,
  officialFieldQuery,
  predicate,
  serializeCerebroQuery,
} from './cerebroQuery';

const inputOf = (query: string): string => new URLSearchParams(query).get('input') ?? '';

describe('serializeCerebroQuery', () => {
  it('escapes quotes and backslashes in values', () => {
    const expression = predicate('name', 'say "hi" \\ there');

    expect(inputOf(serializeCerebroQuery(expression))).toBe('n:"say \\"hi\\" \\\\ there"');
  });

  it('strips control characters that Cerebro cannot represent', () => {
    const expression = predicate('name', 'we\u0000ird\u001ftext');

    expect(inputOf(serializeCerebroQuery(expression))).toBe('n:"weirdtext"');
  });

  it('keeps ampersands and pipes inside quoted values instead of treating them as operators', () => {
    expect(inputOf(serializeCerebroQuery(predicate('name', 'A&B|C')))).toBe('n:"A&B|C"');
  });

  it('drops empty groups and unwraps single-operand groups', () => {
    expect(inputOf(serializeCerebroQuery(all(any(), predicate('id', '1'))))).toBe('id:"1"');
  });

  it('joins groups with the operator their kind implies', () => {
    const expression = all(any(predicate('name', 'a'), predicate('subname', 'b')), OFFICIAL_ONLY);

    expect(inputOf(serializeCerebroQuery(expression))).toBe('((n:"a"|sn:"b")&o:"true")');
  });

  it('encodes the input exactly once', () => {
    const parameters = new URLSearchParams(serializeCerebroQuery(predicate('name', 'A&B')));

    expect(parameters.getAll('input')).toHaveLength(1);
    expect(parameters.get('input')).toBe('n:"A&B"');
  });
});

describe('officialFieldQuery', () => {
  it('builds the browse-route shape for official and unofficial collections', () => {
    expect(inputOf(officialFieldQuery('setId', 'set-1', true))).toBe('(si:"set-1"&o:"true")');
    expect(inputOf(officialFieldQuery('setId', 'set-1', false))).toBe('(si:"set-1"&o:"false")');
    expect(inputOf(officialFieldQuery('packId', 'pack-1', true))).toBe('(pi:"pack-1"&o:"true")');
  });

  it('cannot be escaped by a hostile collection ID', () => {
    const input = inputOf(officialFieldQuery('setId', 'x"&o:"false"&si:"y', true));

    expect(input).toBe('(si:"x\\"&o:\\"false\\"&si:\\"y"&o:"true")');
  });
});
