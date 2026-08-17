// @vitest-environment jsdom
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Card } from '@/models/Card';
import CardDisplay from './CardDisplay';

type Printing = Card['Printings'][number];

const makePrinting = (overrides: Partial<Printing> = {}): Printing => ({
  ArtificialId: 'art-1',
  PackId: 'pack-1',
  PackNumber: '1',
  SetNumber: '1',
  SetId: 'set-1',
  UniqueArt: true,
  ...overrides,
});

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  Deleted: false,
  Id: 'card-1',
  Official: true,
  Classification: 'Justice',
  Cost: '1',
  Name: 'Safe Card',
  Printings: [],
  Subname: '',
  Traits: [],
  Type: 'Event',
  Unique: false,
  ImageUrl: '',
  ...overrides,
});

const printingButtons = () => {
  const group = screen.queryByRole('group', { name: /printings/i });
  return group ? within(group).getAllByRole('button') : [];
};

describe('CardDisplay printings', () => {
  it('renders a card with zero printings without throwing', () => {
    render(<CardDisplay card={makeCard()} />);

    expect(screen.getByRole('heading', { name: /Safe Card/ })).toBeDefined();
    expect(screen.queryByText(/Pack Number:/)).toBeNull();
    expect(printingButtons()).toHaveLength(0);
  });

  it('renders a single printing without offering a printing switcher', () => {
    render(<CardDisplay card={makeCard({ Printings: [makePrinting({ PackNumber: '7' })] })} />);

    expect(screen.getByText('Pack Number: 7')).toBeDefined();
    expect(printingButtons()).toHaveLength(0);
  });

  it('falls back to non-unique-art printings when no printing has unique art', () => {
    render(<CardDisplay card={makeCard({
      Printings: [makePrinting({ ArtificialId: 'fallback-art', PackNumber: '7', UniqueArt: false })],
    })} />);

    expect(screen.getByText('Pack Number: 7')).toBeDefined();
  });

  it('prefers unique-art printings when both kinds are present', () => {
    render(<CardDisplay card={makeCard({
      Printings: [
        makePrinting({ ArtificialId: 'reprint', PackNumber: '99', UniqueArt: false }),
        makePrinting({ ArtificialId: 'original', PackNumber: '5', UniqueArt: true }),
      ],
    })} />);

    expect(screen.getByText('Pack Number: 5')).toBeDefined();
    expect(printingButtons()).toHaveLength(0);
  });

  it('switches the displayed printing when a tab is chosen', async () => {
    const user = userEvent.setup();
    render(<CardDisplay card={makeCard({
      Printings: [
        makePrinting({ ArtificialId: 'a', PackNumber: '1' }),
        makePrinting({ ArtificialId: 'b', PackNumber: '2' }),
      ],
    })} />);

    expect(screen.getByText('Pack Number: 1')).toBeDefined();
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('Pack Number: 2')).toBeDefined();
  });

  it('clamps back to the first printing when the card changes under a selection', async () => {
    const user = userEvent.setup();
    const manyPrintings = makeCard({
      Printings: [
        makePrinting({ ArtificialId: 'a', PackNumber: '1' }),
        makePrinting({ ArtificialId: 'b', PackNumber: '2' }),
        makePrinting({ ArtificialId: 'c', PackNumber: '3' }),
      ],
    });
    const { rerender } = render(<CardDisplay card={manyPrintings} />);

    await user.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByText('Pack Number: 3')).toBeDefined();

    rerender(<CardDisplay card={makeCard({
      Id: 'card-2',
      Name: 'Other Card',
      Printings: [makePrinting({ ArtificialId: 'z', PackNumber: '11' })],
    })} />);

    expect(screen.getByText('Pack Number: 11')).toBeDefined();
  });

  it('labels printings that report no pack number', () => {
    render(<CardDisplay card={makeCard({
      Printings: [
        makePrinting({ ArtificialId: 'a', PackNumber: '' }),
        makePrinting({ ArtificialId: 'b', PackNumber: '' }),
      ],
    })} />);

    expect(printingButtons().map(button => button.textContent)).toEqual(['#1', '#2']);
  });
});

describe('CardDisplay rules text', () => {
  const rulesText = () => screen.getByText(/^Rules:/).textContent ?? '';

  it('preserves leading and trailing single characters around icons', () => {
    render(<CardDisplay card={makeCard({ Rules: 'A{d}B' })} />);

    expect(rulesText()).toBe('Rules: AdB');
  });

  it('leaves malformed and multi-character braces as plain text', () => {
    render(<CardDisplay card={makeCard({ Rules: 'Pay {mental} then {d} then {' })} />);

    expect(rulesText()).toBe('Rules: Pay {mental} then d then {');
  });

  it('styles only the single-character icon tokens', () => {
    const { container } = render(<CardDisplay card={makeCard({ Rules: 'Deal 2 {d} and {mental}.' })} />);
    const icons = Array.from(container.querySelectorAll('span[class]'))
      .filter(node => node.textContent?.length === 1);

    expect(icons.map(node => node.textContent)).toEqual(['d']);
  });

  it('renders rules that are entirely plain text', () => {
    render(<CardDisplay card={makeCard({ Rules: 'No icons here.' })} />);

    expect(rulesText()).toBe('Rules: No icons here.');
  });
});
