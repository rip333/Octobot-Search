import { Card } from '@/models/Card';
import { CardPack } from '@/models/CardPack';
import { CardSet } from '@/models/CardSet';
import { requestJson } from './http';
import {
  UpstreamDataError,
  isRecord,
  optionalStringValue,
  parseUpstreamList,
  requiredString,
  stringValue,
  withoutUndefined,
} from './parse';
import { UpstreamResult } from './result';

export const CEREBRO_BASE_URL = 'https://cerebro-beta-bot.herokuapp.com';

/** Kept as a distinct name because it is the documented card-parsing failure. */
export class CerebroResponseError extends UpstreamDataError {
  constructor(message: string) {
    super(message);
    this.name = 'CerebroResponseError';
  }
}

const parsePrinting = (value: unknown): Card['Printings'][number] | null => {
  if (!isRecord(value)) return null;

  return withoutUndefined({
    ArtificialId: stringValue(value.ArtificialId),
    PackId: stringValue(value.PackId),
    PackNumber: stringValue(value.PackNumber),
    Flavor: optionalStringValue(value.Flavor),
    SetNumber: stringValue(value.SetNumber),
    SetId: stringValue(value.SetId),
    UniqueArt: value.UniqueArt === true,
  });
};

const parseCard = (value: unknown, index: number): Card => {
  if (!isRecord(value) || typeof value.Id !== 'string' || typeof value.Name !== 'string') {
    throw new CerebroResponseError(`Invalid card at index ${index}.`);
  }

  const printings = Array.isArray(value.Printings)
    ? value.Printings.map(parsePrinting).filter((printing): printing is Card['Printings'][number] => printing !== null)
    : [];

  return withoutUndefined({
    Deleted: value.Deleted === true,
    Id: value.Id,
    Official: value.Official === true,
    AuthorId: optionalStringValue(value.AuthorId),
    Attack: optionalStringValue(value.Attack),
    Classification: stringValue(value.Classification),
    Cost: stringValue(value.Cost),
    Health: optionalStringValue(value.Health),
    Name: value.Name,
    Printings: printings,
    Resource: optionalStringValue(value.Resource),
    Rules: optionalStringValue(value.Rules),
    Subname: stringValue(value.Subname),
    Thwart: optionalStringValue(value.Thwart),
    Traits: Array.isArray(value.Traits)
      ? value.Traits.filter((trait): trait is string => typeof trait === 'string')
      : [],
    Type: stringValue(value.Type),
    Unique: value.Unique === true,
    ImageUrl: stringValue(value.ImageUrl),
  });
};

export const parseCerebroCards = (value: unknown): Card[] => {
  if (!Array.isArray(value)) {
    throw new CerebroResponseError('Expected a card array from Cerebro.');
  }

  return value.map(parseCard);
};

const parseSet = (value: unknown, index: number): CardSet => {
  if (!isRecord(value)) throw new CerebroResponseError(`Set at index ${index} is not an object.`);

  try {
    return {
      Id: requiredString(value.Id, 'Id'),
      Name: requiredString(value.Name, 'Name'),
      Type: stringValue(value.Type),
    };
  } catch (error) {
    if (error instanceof UpstreamDataError) {
      throw new CerebroResponseError(`Set at index ${index}: ${error.message}`);
    }
    throw error;
  }
};

/** Cerebro reports `Official` on sets; the browse UI needs the flag only to split the two views. */
const isOfficialSet = (value: unknown): boolean => isRecord(value) && value.Official === true;

export const parseCerebroSets = (value: unknown): CardSet[] => {
  if (!Array.isArray(value)) throw new CerebroResponseError('Expected a set array from Cerebro.');
  return value.map(parseSet);
};

const parsePack = (value: unknown, index: number): CardPack => {
  if (!isRecord(value)) throw new CerebroResponseError(`Pack at index ${index} is not an object.`);

  try {
    return {
      Id: requiredString(value.Id, 'Id'),
      Name: requiredString(value.Name, 'Name'),
      Number: stringValue(value.Number),
    };
  } catch (error) {
    if (error instanceof UpstreamDataError) {
      throw new CerebroResponseError(`Pack at index ${index}: ${error.message}`);
    }
    throw error;
  }
};

export const parseCerebroPacks = (value: unknown): CardPack[] => {
  if (!Array.isArray(value)) throw new CerebroResponseError('Expected a pack array from Cerebro.');
  return value.map(parsePack);
};

/**
 * Runs one serialized Cerebro query. Build `serializedQuery` with
 * `@/api/cerebroQuery`; never hand-assemble it.
 */
export const fetchCerebroCards = async (
  serializedQuery: string,
  signal?: AbortSignal,
): Promise<UpstreamResult<Card[]>> => {
  const endpoint = 'cerebro/query';
  const raw = await requestJson({
    endpoint,
    url: `${CEREBRO_BASE_URL}/query?${serializedQuery}`,
    signal,
    // Cerebro answers some no-match queries with 404 rather than an empty array.
    emptyStatuses: [404],
  });

  return parseUpstreamList(endpoint, raw, parseCerebroCards);
};

export const fetchCerebroSets = async (official: boolean): Promise<UpstreamResult<CardSet[]>> => {
  const endpoint = official ? 'cerebro/sets(official)' : 'cerebro/sets(unofficial)';
  const raw = await requestJson({
    endpoint,
    url: official
      ? `${CEREBRO_BASE_URL}/sets?official=true`
      : `${CEREBRO_BASE_URL}/sets?origin=unofficial`,
    emptyStatuses: [404],
  });

  if (raw.status !== 'success') return parseUpstreamList(endpoint, raw, parseCerebroSets);

  // `origin=unofficial` still returns official sets, so filter before parsing.
  const filtered = Array.isArray(raw.data) && !official
    ? raw.data.filter(entry => !isOfficialSet(entry))
    : raw.data;

  return parseUpstreamList(endpoint, { status: 'success', data: filtered }, parseCerebroSets);
};

export const fetchCerebroPacks = async (): Promise<UpstreamResult<CardPack[]>> => {
  const endpoint = 'cerebro/packs';
  const raw = await requestJson({
    endpoint,
    url: `${CEREBRO_BASE_URL}/packs?official=true`,
    emptyStatuses: [404],
  });

  return parseUpstreamList(endpoint, raw, parseCerebroPacks);
};
