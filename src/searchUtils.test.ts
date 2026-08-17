import { describe, expect, it } from 'vitest';
import { createSearchQuery } from './searchUtils';

const getInputExpression = (query: string): string =>
  new URLSearchParams(query).get('input') ?? '';

describe('createSearchQuery', () => {
  it('encodes once and always applies the official predicate', () => {
    const query = createSearchQuery('A&B', 'and');
    const parameters = new URLSearchParams(query);

    expect(parameters.getAll('input')).toHaveLength(1);
    expect(parameters.get('input')).toContain('n:"A&B"');
    expect(parameters.get('input')).toContain('o:"true"');
  });

  it('keeps quoted phrases together and joins tokens with AND', () => {
    const expression = getInputExpression(createSearchQuery('"Spider Man" web', 'and'));

    expect(expression).toContain('n:"Spider Man"');
    expect(expression).toContain(')&(');
  });

  it('omits empty trait clauses for numeric and punctuation-only terms', () => {
    const expression = getInputExpression(createSearchQuery('42 !!!', 'or'));

    expect(expression).toContain('n:"42"');
    expect(expression).not.toContain('tr:""');
  });

  it('preserves Unicode text and multiple quoted phrases', () => {
    const expression = getInputExpression(
      createSearchQuery('"Doctor Strange" café "Spider Man"', 'or'),
    );

    expect(expression).toContain('n:"Doctor Strange"');
    expect(expression).toContain('n:"café"');
    expect(expression).toContain('tr:"café"');
    expect(expression).toContain('n:"Spider Man"');
  });

  it('escapes quotes that are part of an unquoted token', () => {
    const expression = getInputExpression(createSearchQuery('say"hello', 'or'));

    expect(expression).toContain('n:"say\\"hello"');
  });
});
