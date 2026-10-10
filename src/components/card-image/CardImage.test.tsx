// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from '@/models/Card';
import CardImage from './CardImage';

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  Deleted: false,
  Id: 'card-1',
  Official: true,
  Classification: 'Justice',
  Cost: '1',
  Name: 'Test Card',
  Printings: [],
  Subname: '',
  Traits: [],
  Type: 'Event',
  Unique: false,
  ImageUrl: '',
  ...overrides,
});

const image = () => screen.queryByRole('img', { name: 'Test Card' });
const fallback = () => screen.queryByRole('img', { name: /image unavailable/i });

describe('CardImage failure handling', () => {
  it('shows a named fallback when the image fails', () => {
    render(<CardImage card={makeCard()} artificialId="0001" />);

    fireEvent.error(image()!);
    expect(fallback()).not.toBeNull();
  });

  /**
   * Regression: failure was stored as a boolean for the component's lifetime.
   * `CardDisplay` swaps `artificialId` without remounting, so one bad printing
   * left every later printing stuck on the fallback.
   */
  it('retries when a different printing changes the image URL', () => {
    const card = makeCard();
    const { rerender } = render(<CardImage card={card} artificialId="broken" />);

    fireEvent.error(image()!);
    expect(fallback()).not.toBeNull();

    rerender(<CardImage card={card} artificialId="working" />);

    expect(fallback()).toBeNull();
    expect(image()!.getAttribute('src')).toContain('working');
  });

  it('keeps showing the fallback while the failed URL is still displayed', () => {
    const card = makeCard();
    const { rerender } = render(<CardImage card={card} artificialId="broken" />);

    fireEvent.error(image()!);
    rerender(<CardImage card={card} artificialId="broken" />);

    expect(fallback()).not.toBeNull();
  });

  it('retries when switching to the back face of a double-sided card', () => {
    const card = makeCard({
      ImageUrl: 'https://mc4db.merlindumesnil.net/front.webp',
      BackImageUrl: 'https://mc4db.merlindumesnil.net/back.webp',
    });
    const { rerender } = render(<CardImage card={card} />);

    fireEvent.error(image()!);
    expect(fallback()).not.toBeNull();

    rerender(<CardImage card={card} showBack />);
    expect(fallback()).toBeNull();
  });
});

describe('CardImage orientation', () => {
  it('uses landscape dimensions for schemes and portrait for everything else', () => {
    const { container, rerender } = render(<CardImage card={makeCard({ Type: 'Side Scheme' })} />);
    expect(container.querySelector('[data-orientation="landscape"]')).not.toBeNull();

    rerender(<CardImage card={makeCard({ Type: 'Ally' })} />);
    expect(container.querySelector('[data-orientation="portrait"]')).not.toBeNull();
  });

  it('prefers and migrates an explicit ImageUrl over the constructed path', () => {
    render(<CardImage card={makeCard({ ImageUrl: 'https://cerebrodatastorage.blob.core.windows.net/cerebro-cards/official/00002.jpg' })} artificialId="0001" />);

    const url = new URL(image()!.getAttribute('src')!, 'http://localhost:3000');
    expect(url.pathname).toBe('/api/card-images/v1/official/00002.jpg');
    expect(url.origin).toBe('http://localhost:3000');
    expect(image()!.getAttribute('srcset')).toBeNull();
  });
});

describe('Cerebro same-origin delivery', () => {
  it.each([
    [{ Id: '00001' }, false, '/official/00001.jpg'],
    [{ Official: false, Id: 'custom-1' }, false, '/unofficial/custom-1.jpg'],
    [{ Official: false, Id: '237660307835715585/01001B' }, false, '/unofficial/237660307835715585/01001B.jpg'],
    [{ ImageUrl: 'https://pub-d27e6715f4ba4529bc9d8fd13938a5a1.r2.dev/cerebro-cards/official/00002.jpg' }, false, '/official/00002.jpg'],
    [{ BackImageUrl: 'https://cerebrodatastorage.blob.core.windows.net/cerebro-cards/official/00001B.jpg' }, true, '/official/00001B.jpg'],
  ] as const)('keeps resolved art stable across rerenders without origin or optimizer variants', (card, showBack, suffix) => {
    const props = { card: makeCard(card), showBack };
    const { rerender, container } = render(<CardImage {...props} />);
    const src = image()!.getAttribute('src')!;
    expect(new URL(src, 'http://localhost:3000').pathname).toBe(`/api/card-images/v1${suffix}`);
    expect(image()!.getAttribute('loading')).toBe('lazy');
    expect(image()!.getAttribute('srcset')).toBeNull();
    rerender(<CardImage {...props} />);
    expect(image()!.getAttribute('src')).toBe(src);
    fireEvent.error(image()!);
    expect(fallback()).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows the placeholder for unsupported explicit URLs without fetching them', () => {
    const { container } = render(<CardImage card={makeCard({ ImageUrl: 'https://unknown.test/card.jpg' })} />);
    expect(fallback()).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('CardImage main scheme stage sides', () => {
  const mainScheme = (overrides: Partial<Card>) =>
    makeCard({ Type: 'Main Scheme', ...overrides });

  const source = () => image()!.getAttribute('src')!;

  it('appends the stage side when the ID omits it', () => {
    render(<CardImage card={mainScheme({ Id: '60135', Stage: '1B' })} />);

    expect(source()).toContain('60135B.jpg');
  });

  it('appends the stage side to the selected printing too', () => {
    render(<CardImage card={mainScheme({ Id: '60135', Stage: '1B' })} artificialId="60135" />);

    expect(source()).toContain('60135B.jpg');
  });

  it('leaves an ID that already carries its side letter alone', () => {
    render(<CardImage card={mainScheme({ Id: '60134B', Stage: '1B' })} />);

    expect(source()).toContain('60134B.jpg');
    expect(source()).not.toContain('60134BB');
  });

  it('leaves a single-sided stage alone', () => {
    render(<CardImage card={mainScheme({ Id: '32142', Stage: '1' })} />);

    expect(source()).toContain('32142.jpg');
  });

  it('does not touch lettered stages on other card types', () => {
    render(<CardImage card={makeCard({ Id: '07018', Type: 'Villain', Stage: 'B' })} />);

    expect(source()).toContain('07018.jpg');
  });
});

describe('CardImage loading priority', () => {
  it('is not deferred when marked as the priority image', () => {
    render(<CardImage card={makeCard()} artificialId="0001" priority />);

    expect(image()!.getAttribute('loading')).not.toBe('lazy');
  });

  it('stays lazy by default, so grids do not race the priority image', () => {
    render(<CardImage card={makeCard()} artificialId="0001" />);

    expect(image()!.getAttribute('loading')).toBe('lazy');
  });
});
