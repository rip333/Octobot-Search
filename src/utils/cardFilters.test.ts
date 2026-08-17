import { describe, expect, it } from 'vitest';
import { Card } from '@/models/Card';
import {
  EMPTY_CARD_FILTERS,
  PLAYER_CLASSIFICATION,
  deriveCardFacets,
  filterAndSortCards,
  toggleClassification,
  toggleValue,
} from './cardFilters';

const makeCard = (overrides: Partial<Card> & { Id: string }): Card => ({
  Deleted: false,
  Official: true,
  Classification: 'Justice',
  Cost: '1',
  Name: `Card ${overrides.Id}`,
  Printings: [],
  Subname: '',
  Traits: [],
  Type: 'Event',
  Unique: false,
  ImageUrl: '',
  ...overrides,
});

const withFilters = (overrides: Partial<typeof EMPTY_CARD_FILTERS>) => ({
  ...EMPTY_CARD_FILTERS,
  ...overrides,
});

describe('filterAndSortCards', () => {
  it('never mutates the input array', () => {
    const cards = Object.freeze([makeCard({ Id: '3' }), makeCard({ Id: '1' })]) as unknown as Card[];

    expect(filterAndSortCards(cards, EMPTY_CARD_FILTERS).map(card => card.Id)).toEqual(['1', '3']);
    expect(cards.map(card => card.Id)).toEqual(['3', '1']);
  });

  it('sorts card IDs numerically with variant letters as a tie-break', () => {
    const cards = [
      makeCard({ Id: '10' }),
      makeCard({ Id: '2b' }),
      makeCard({ Id: '2a' }),
      makeCard({ Id: '9' }),
    ];

    expect(filterAndSortCards(cards, EMPTY_CARD_FILTERS).map(card => card.Id))
      .toEqual(['2a', '2b', '9', '10']);
  });

  it('sorts missing stats last whichever direction the sort runs', () => {
    const cards = [
      makeCard({ Id: '1', Cost: '3', Attack: '3 {d}' }),
      makeCard({ Id: '2', Cost: undefined, Attack: undefined }),
      makeCard({ Id: '3', Cost: '1', Attack: '1 {d}' }),
    ];

    expect(filterAndSortCards(cards, withFilters({ sortBy: 'cost' })).map(card => card.Id))
      .toEqual(['3', '1', '2']);
    expect(filterAndSortCards(cards, withFilters({ sortBy: 'attack' })).map(card => card.Id))
      .toEqual(['1', '3', '2']);
  });

  it('treats variable stats like "X {d}" as missing', () => {
    const cards = [
      makeCard({ Id: '1', Attack: 'X {d}' }),
      makeCard({ Id: '2', Attack: '2 {d}' }),
    ];

    expect(filterAndSortCards(cards, withFilters({ sortBy: 'attack' })).map(card => card.Id))
      .toEqual(['2', '1']);
  });

  it('groups by resource icon in game order rather than comparing them numerically', () => {
    const cards = [
      makeCard({ Id: '1', Resource: '{w}' }),
      makeCard({ Id: '2', Resource: undefined }),
      makeCard({ Id: '3', Resource: '{p}' }),
      makeCard({ Id: '4', Resource: '{m}' }),
    ];

    expect(filterAndSortCards(cards, withFilters({ sortBy: 'resource' })).map(card => card.Id))
      .toEqual(['3', '4', '1', '2']);
  });

  it('matches any selected value within a group', () => {
    const cards = [
      makeCard({ Id: '1', Type: 'Ally' }),
      makeCard({ Id: '2', Type: 'Event' }),
      makeCard({ Id: '3', Type: 'Support' }),
    ];

    expect(filterAndSortCards(cards, withFilters({ types: ['Ally', 'Support'] })).map(card => card.Id))
      .toEqual(['1', '3']);
  });

  it('requires every filtered group to match', () => {
    const cards = [
      makeCard({ Id: '1', Type: 'Ally', Traits: ['Avenger'] }),
      makeCard({ Id: '2', Type: 'Ally', Traits: ['X-Men'] }),
    ];

    expect(filterAndSortCards(cards, withFilters({ types: ['Ally'], traits: ['Avenger'] })).map(card => card.Id))
      .toEqual(['1']);
  });

  it('treats the Player classification as everything that is not Encounter', () => {
    const cards = [
      makeCard({ Id: '1', Classification: 'Justice' }),
      makeCard({ Id: '2', Classification: 'Encounter' }),
      makeCard({ Id: '3', Classification: 'Aggression' }),
    ];

    expect(filterAndSortCards(cards, withFilters({ classifications: ['Player'] })).map(card => card.Id))
      .toEqual(['1', '3']);
  });
});

describe('deriveCardFacets', () => {
  it('offers a Player option only when both player and encounter cards are present', () => {
    const mixed = deriveCardFacets([
      makeCard({ Id: '1', Classification: 'Justice' }),
      makeCard({ Id: '2', Classification: 'Encounter' }),
    ]);
    const playerOnly = deriveCardFacets([makeCard({ Id: '1', Classification: 'Justice' })]);

    expect(mixed.classifications).toContain('Player');
    expect(playerOnly.classifications).not.toContain('Player');
  });

  it('collects sorted unique types and traits', () => {
    const facets = deriveCardFacets([
      makeCard({ Id: '1', Type: 'Support', Traits: ['X-Men', 'Avenger'] }),
      makeCard({ Id: '2', Type: 'Ally', Traits: ['Avenger'] }),
    ]);

    expect(facets.types).toEqual(['Ally', 'Support']);
    expect(facets.traits).toEqual(['Avenger', 'X-Men']);
  });
});

describe('filter toggles', () => {
  it('adds and removes plain values', () => {
    expect(toggleValue([], 'Ally')).toEqual(['Ally']);
    expect(toggleValue(['Ally'], 'Ally')).toEqual([]);
  });

  it('keeps Player and named classifications mutually exclusive', () => {
    expect(toggleClassification(['Justice'], 'Player')).toEqual(['Player']);
    expect(toggleClassification(['Player'], 'Justice')).toEqual(['Justice']);
    expect(toggleClassification(['Player'], 'Encounter')).toEqual(['Encounter']);
  });

  // Player means "not Encounter", so the two together match every card while
  // still showing two active filters. This has to hold in both orders.
  it('keeps Player and Encounter exclusive whichever is selected first', () => {
    expect(toggleClassification(['Encounter'], 'Player')).toEqual(['Player']);
    expect(toggleClassification(['Player'], 'Encounter')).toEqual(['Encounter']);
  });

  /**
   * `Player` is a negation ("not Encounter"), not a real classification, so
   * pairing it with anything makes the filter a no-op that still shows chips.
   * A union of real classifications matching everything is fine — that is what
   * selecting them all means. Only Player's exclusivity is the invariant.
   */
  it('never leaves Player selected alongside another classification', () => {
    const startingPoints = [[], ['Player'], ['Encounter'], ['Justice'], ['Encounter', 'Justice']];

    for (const start of startingPoints) {
      for (const next of ['Player', 'Encounter', 'Justice']) {
        const selection = toggleClassification(start, next);

        if (selection.includes(PLAYER_CLASSIFICATION)) {
          expect(
            selection,
            `toggling ${next} on ${JSON.stringify(start)} left Player with company`,
          ).toEqual([PLAYER_CLASSIFICATION]);
        }
      }
    }
  });

  it('does not turn a Player selection into a filter that matches every card', () => {
    const cards = [
      makeCard({ Id: '1', Classification: 'Justice' }),
      makeCard({ Id: '2', Classification: 'Encounter' }),
    ];

    const afterAddingPlayer = toggleClassification(['Encounter'], 'Player');
    const matched = filterAndSortCards(cards, withFilters({ classifications: afterAddingPlayer }));

    expect(matched.map(card => card.Id)).toEqual(['1']);
  });

  it('deselects a filter by toggling it again', () => {
    expect(toggleClassification(['Player'], 'Player')).toEqual([]);
    expect(toggleClassification(['Justice', 'Aggression'], 'Justice')).toEqual(['Aggression']);
  });
});
