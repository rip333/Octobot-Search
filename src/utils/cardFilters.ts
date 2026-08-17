import { Card } from '@/models/Card';

/**
 * Filtering and sorting for result lists.
 *
 * Semantics, fixed here so the UI can state them plainly:
 * - Selecting several values in one group means **any** of them (union).
 * - Selecting values in different groups means **all** groups must match.
 * - A card missing the stat being sorted on always sorts last, in either direction.
 */

export type CardSortKey = 'id' | 'name' | 'cost' | 'attack' | 'thwart' | 'health' | 'resource';

export interface CardFilterState {
  classifications: string[];
  types: string[];
  traits: string[];
  sortBy: CardSortKey;
}

export const EMPTY_CARD_FILTERS: CardFilterState = {
  classifications: [],
  types: [],
  traits: [],
  sortBy: 'id',
};

/** Synthetic classification meaning "anything a player can include in a deck". */
export const PLAYER_CLASSIFICATION = 'Player';
export const ENCOUNTER_CLASSIFICATION = 'Encounter';

/**
 * Resources are icons, not numbers, so "sorting by resource" groups cards by
 * icon in the game's own order rather than comparing magnitudes.
 */
const RESOURCE_ORDER = ['{p}', '{m}', '{e}', '{w}'];

const resourceRank = (resource: string | undefined): number | null => {
  if (!resource) return null;
  const index = RESOURCE_ORDER.indexOf(resource);
  return index === -1 ? RESOURCE_ORDER.length : index;
};

/** Extracts the leading number from stats like `"2 {d}"`; `"X {d}"` has none. */
const numericStat = (value: string | undefined): number | null => {
  if (!value) return null;
  const match = value.match(/-?\d+/);
  if (!match) return null;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Missing values sort last whichever direction the present values run. */
const compareNullableNumbers = (
  a: number | null,
  b: number | null,
  direction: 'asc' | 'desc',
): number => {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === 'asc' ? a - b : b - a;
};

const CARD_ID_PATTERN = /^(\d+)([A-Za-z]?)$/;

const compareCardIds = (a: string, b: string): number => {
  const matchA = a.match(CARD_ID_PATTERN);
  const matchB = b.match(CARD_ID_PATTERN);
  if (!matchA || !matchB) return a.localeCompare(b);

  const numericDifference = Number.parseInt(matchA[1], 10) - Number.parseInt(matchB[1], 10);
  return numericDifference !== 0 ? numericDifference : matchA[2].localeCompare(matchB[2]);
};

const compareBySortKey = (a: Card, b: Card, sortBy: CardSortKey): number => {
  switch (sortBy) {
    case 'name':
      return a.Name.localeCompare(b.Name);
    case 'cost':
      return compareNullableNumbers(numericStat(a.Cost), numericStat(b.Cost), 'asc');
    case 'attack':
      return compareNullableNumbers(numericStat(a.Attack), numericStat(b.Attack), 'desc');
    case 'health':
      return compareNullableNumbers(numericStat(a.Health), numericStat(b.Health), 'desc');
    case 'thwart':
      return compareNullableNumbers(numericStat(a.Thwart), numericStat(b.Thwart), 'desc');
    case 'resource':
      return compareNullableNumbers(resourceRank(a.Resource), resourceRank(b.Resource), 'asc');
    case 'id':
      return compareCardIds(a.Id, b.Id);
  }
};

const matchesClassifications = (card: Card, selected: string[]): boolean => {
  if (selected.length === 0) return true;
  if (selected.includes(card.Classification)) return true;
  return selected.includes(PLAYER_CLASSIFICATION) && card.Classification !== ENCOUNTER_CLASSIFICATION;
};

export const filterCards = (cards: Card[], filters: CardFilterState): Card[] =>
  cards.filter(card =>
    matchesClassifications(card, filters.classifications)
    && (filters.types.length === 0 || filters.types.includes(card.Type))
    && (filters.traits.length === 0 || filters.traits.some(trait => card.Traits?.includes(trait))));

/** Pure: returns a new array and never mutates `cards`. */
export const filterAndSortCards = (cards: Card[], filters: CardFilterState): Card[] =>
  filterCards(cards, filters).sort((a, b) => {
    const primary = compareBySortKey(a, b, filters.sortBy);
    // Stable, deterministic ordering for equal keys.
    return primary !== 0 ? primary : compareCardIds(a.Id, b.Id);
  });

export interface CardFacets {
  classifications: string[];
  types: string[];
  traits: string[];
}

/** The filter values worth offering for a given result set. */
export const deriveCardFacets = (cards: Card[]): CardFacets => {
  const classifications = Array.from(new Set(cards.map(card => card.Classification))).sort();
  const hasEncounter = classifications.includes(ENCOUNTER_CLASSIFICATION);
  const hasPlayerCards = cards.some(card => card.Classification !== ENCOUNTER_CLASSIFICATION);

  const traits = new Set<string>();
  for (const card of cards) {
    for (const trait of card.Traits ?? []) traits.add(trait);
  }

  return {
    classifications: hasEncounter && hasPlayerCards
      ? [PLAYER_CLASSIFICATION, ...classifications]
      : classifications,
    types: Array.from(new Set(cards.map(card => card.Type))).sort(),
    traits: Array.from(traits).sort(),
  };
};

/**
 * `Player` means "not Encounter", so holding it alongside `Encounter` or a
 * named classification would match every card while displaying active filters.
 * Selecting `Player` therefore replaces the whole selection, and selecting
 * anything else drops `Player`.
 */
export const toggleClassification = (selected: string[], classification: string): string[] => {
  if (selected.includes(classification)) return selected.filter(entry => entry !== classification);
  if (classification === PLAYER_CLASSIFICATION) return [PLAYER_CLASSIFICATION];
  return [...selected.filter(entry => entry !== PLAYER_CLASSIFICATION), classification];
};

export const toggleValue = (selected: string[], value: string): string[] =>
  selected.includes(value) ? selected.filter(entry => entry !== value) : [...selected, value];
