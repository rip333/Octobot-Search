import { describe, expect, it } from 'vitest';
import { merlinCardToCard, merlinPackToCardSet } from './merlin-adapter';
import { MerlinCard } from './models/MerlinCard';
import { MerlinPack } from './models/MerlinPack';

const makePack = (pack_type: string, pack_type_name = 'Custom Pack'): MerlinPack => ({
  name: 'Pack',
  code: 'pack',
  status: 'released',
  pack_type,
  pack_type_name,
});

const makeCard = (overrides: Partial<MerlinCard> = {}): MerlinCard => ({
  code: '202801a',
  name: 'Alligator Loki',
  type_name: 'Hero',
  faction_name: 'Hero',
  status: 'released',
  pack_code: 'alligator_loki_by_ripper3',
  ...overrides,
});

describe('merlinPackToCardSet', () => {
  it('normalizes fm_story packs as campaigns', () => {
    expect(merlinPackToCardSet(makePack('fm_story')).Type).toBe('Campaign Set');
  });

  it('maps every live pack type onto a known set type', () => {
    const liveTypes: Record<string, string> = {
      core: 'Supplementary Set',
      encounter: 'Modular Set',
      fm_story: 'Campaign Set',
      fm_theme: 'Modular Set',
      hero: 'Hero Set',
      hero_fanmade: 'Hero Set',
      scenar_fanmade: 'Villain Set',
      scenario: 'Villain Set',
      story: 'Campaign Set',
    };

    for (const [packType, expected] of Object.entries(liveTypes)) {
      expect(merlinPackToCardSet(makePack(packType)).Type).toBe(expected);
    }
  });

  it('uses the upstream display name for unknown pack types', () => {
    expect(merlinPackToCardSet(makePack('future_type', 'Future Pack')).Type).toBe('Future Pack');
  });

  it('falls back to a named default when the upstream sends no display name', () => {
    expect(merlinPackToCardSet({ ...makePack('future_type'), pack_type_name: undefined }).Type)
      .toBe('Merlin Custom Set');
  });
});

describe('merlinCardToCard', () => {
  it('leaves absent stats undefined rather than zero or null', () => {
    const card = merlinCardToCard(makeCard({ health: 9, cost: undefined, attack: null }));

    expect(card.Health).toBe('9');
    expect(card.Cost).toBe('');
    expect(card.Attack).toBeUndefined();
    expect(card.Thwart).toBeUndefined();
  });

  it('keeps a zero stat distinguishable from a missing one', () => {
    expect(merlinCardToCard(makeCard({ thwart: 0 })).Thwart).toBe('0');
  });

  it('builds absolute image URLs and omits back images for single-sided cards', () => {
    const card = merlinCardToCard(makeCard({
      imagesrc: '/bundles/cards/EN/pack/202801a.webp',
      backimagesrc: '/bundles/cards/EN/pack/202801b.webp',
      double_sided: false,
    }));

    expect(card.ImageUrl).toBe('https://mc4db.merlindumesnil.net/bundles/cards/EN/pack/202801a.webp');
    expect(card.BackImageUrl).toBeUndefined();
  });

  it('exposes the back image for double-sided cards', () => {
    const card = merlinCardToCard(makeCard({
      imagesrc: '/front.webp',
      backimagesrc: '/back.webp',
      double_sided: true,
    }));

    expect(card.BackImageUrl).toBe('https://mc4db.merlindumesnil.net/back.webp');
  });

  it('treats only the Official status as official', () => {
    expect(merlinCardToCard(makeCard({ status: 'released' })).Official).toBe(false);
    expect(merlinCardToCard(makeCard({ status: 'Official' })).Official).toBe(true);
  });

  it('leaves printing numbers blank when the upstream has no position', () => {
    const [printing] = merlinCardToCard(makeCard({ position: null })).Printings;

    expect(printing.PackNumber).toBe('');
    expect(printing.SetNumber).toBe('');
  });
});
