import { MerlinCard } from '@/models/MerlinCard';
import { MerlinPack } from '@/models/MerlinPack';
import { requestJson } from './http';
import {
  UpstreamDataError,
  isRecord,
  optionalNumber,
  optionalStringValue,
  parseUpstreamList,
  requiredString,
} from './parse';
import { UpstreamResult } from './result';

/**
 * `db.merlindumesnil.net` now 301-redirects here. Using the canonical host
 * avoids a redirect hop on every card and pack request.
 */
export const MERLIN_ORIGIN = 'https://mc4db.merlindumesnil.net';
const MERLIN_BASE_URL = `${MERLIN_ORIGIN}/api/public`;

const MERLIN_HEADERS = {
  // Merlin's edge rejects requests without a browser-shaped User-Agent.
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

const nullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = optionalNumber(value);
  return parsed === undefined ? null : parsed;
};

const parseMerlinCard = (value: unknown, index: number): MerlinCard => {
  if (!isRecord(value)) throw new UpstreamDataError(`Card at index ${index} is not an object.`);

  try {
    return {
      code: requiredString(value.code, 'code'),
      name: requiredString(value.name, 'name'),
      real_name: optionalStringValue(value.real_name),
      type_name: requiredString(value.type_name, 'type_name'),
      faction_name: requiredString(value.faction_name, 'faction_name'),
      real_traits: optionalStringValue(value.real_traits),
      real_text: optionalStringValue(value.real_text),
      text: optionalStringValue(value.text),
      cost: nullableNumber(value.cost),
      health: nullableNumber(value.health),
      attack: nullableNumber(value.attack),
      thwart: nullableNumber(value.thwart),
      is_unique: value.is_unique === true,
      status: requiredString(value.status, 'status'),
      creator: optionalStringValue(value.creator),
      imagesrc: optionalStringValue(value.imagesrc) ?? null,
      backimagesrc: optionalStringValue(value.backimagesrc) ?? null,
      double_sided: value.double_sided === true,
      pack_code: requiredString(value.pack_code, 'pack_code'),
      position: nullableNumber(value.position),
      card_set_code: optionalStringValue(value.card_set_code),
      flavor: optionalStringValue(value.flavor) ?? null,
    };
  } catch (error) {
    if (error instanceof UpstreamDataError) {
      throw new UpstreamDataError(`Card at index ${index}: ${error.message}`);
    }
    throw error;
  }
};

export const parseMerlinCards = (value: unknown): MerlinCard[] => {
  if (!Array.isArray(value)) throw new UpstreamDataError('Expected a card array from Merlin.');
  return value.map(parseMerlinCard);
};

const parseMerlinPack = (value: unknown, index: number): MerlinPack => {
  if (!isRecord(value)) throw new UpstreamDataError(`Pack at index ${index} is not an object.`);

  try {
    return {
      code: requiredString(value.code, 'code'),
      name: requiredString(value.name, 'name'),
      status: requiredString(value.status, 'status'),
      pack_type: requiredString(value.pack_type, 'pack_type'),
      pack_type_name: optionalStringValue(value.pack_type_name),
    };
  } catch (error) {
    if (error instanceof UpstreamDataError) {
      throw new UpstreamDataError(`Pack at index ${index}: ${error.message}`);
    }
    throw error;
  }
};

export const parseMerlinPacks = (value: unknown): MerlinPack[] => {
  if (!Array.isArray(value)) throw new UpstreamDataError('Expected a pack array from Merlin.');
  return value.map(parseMerlinPack);
};

export const fetchMerlinCards = async (packCode: string): Promise<UpstreamResult<MerlinCard[]>> => {
  const endpoint = 'merlin/cards';
  const raw = await requestJson({
    endpoint,
    url: `${MERLIN_BASE_URL}/cards/${encodeURIComponent(packCode)}`,
    headers: MERLIN_HEADERS,
    emptyStatuses: [404],
  });

  return parseUpstreamList(endpoint, raw, parseMerlinCards);
};

export const fetchMerlinPacks = async (): Promise<UpstreamResult<MerlinPack[]>> => {
  const endpoint = 'merlin/packs';
  const raw = await requestJson({
    endpoint,
    url: `${MERLIN_BASE_URL}/packs/`,
    headers: MERLIN_HEADERS,
    emptyStatuses: [404],
  });

  return parseUpstreamList(endpoint, raw, parseMerlinPacks);
};
