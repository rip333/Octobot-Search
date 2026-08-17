import { CardPack } from '@/models/CardPack';
import { CardSet } from '@/models/CardSet';

export const CARD_SET_TYPE_ORDER = [
  'Hero Set',
  'Leader Set',
  'Villain Set',
  'Modular Set',
  'Nemesis Set',
  'Campaign Set',
  'Supplementary Set',
] as const;

const getSetTypeRank = (type: string): number => {
  const rank = CARD_SET_TYPE_ORDER.indexOf(type as typeof CARD_SET_TYPE_ORDER[number]);
  return rank === -1 ? CARD_SET_TYPE_ORDER.length : rank;
};

export const compareCardSets = (a: CardSet, b: CardSet): number => {
  const rankDifference = getSetTypeRank(a.Type) - getSetTypeRank(b.Type);
  if (rankDifference !== 0) return rankDifference;

  if (getSetTypeRank(a.Type) === CARD_SET_TYPE_ORDER.length) {
    const typeDifference = a.Type.localeCompare(b.Type);
    if (typeDifference !== 0) return typeDifference;
  }

  const nameDifference = a.Name.localeCompare(b.Name);
  return nameDifference !== 0 ? nameDifference : a.Id.localeCompare(b.Id);
};

const getPackOrder = (pack: CardPack): number | null => {
  const order = Number.parseInt(pack.Number, 10);
  return Number.isFinite(order) && order !== 0 ? order : null;
};

export const compareCardPacks = (a: CardPack, b: CardPack): number => {
  const orderA = getPackOrder(a);
  const orderB = getPackOrder(b);

  if (orderA !== null && orderB !== null && orderA !== orderB) return orderA - orderB;
  if (orderA !== null && orderB === null) return -1;
  if (orderA === null && orderB !== null) return 1;

  const nameDifference = a.Name.localeCompare(b.Name);
  return nameDifference !== 0 ? nameDifference : a.Id.localeCompare(b.Id);
};
