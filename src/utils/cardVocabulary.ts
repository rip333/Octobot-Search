export const CARD_CLASSIFICATIONS = [
  { name: 'Aggression', color: 'red' },
  { name: 'Justice', color: 'yellow' },
  { name: 'Leadership', color: 'blue' },
  { name: 'Protection', color: 'green' },
  { name: 'Pool', color: 'pink' },
  { name: 'Basic', color: 'grey' },
  { name: 'Hero', color: 'white' },
  { name: 'Encounter', color: 'purple' },
] as const;

export const CARD_TYPES = [
  'ally',
  'alter-ego',
  'attachment',
  'environment',
  'event',
  'hero',
  'main scheme',
  'minion',
  'obligation',
  'resource',
  'side scheme',
  'support',
  'treachery',
  'upgrade',
  'villain',
] as const;

export const isCardClassification = (value: string): boolean =>
  CARD_CLASSIFICATIONS.some(classification => classification.name === value);

export const isCardType = (value: string): boolean =>
  (CARD_TYPES as readonly string[]).includes(value);
