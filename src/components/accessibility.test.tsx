// @vitest-environment jsdom
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Card } from '@/models/Card';
import { CardSet, UnofficialCardSet } from '@/models/CardSet';
import { CardPack } from '@/models/CardPack';
import CardPacks from './card-packs/CardPacks';
import CardSets from './card-sets/CardSets';
import UnofficialCardSets from './card-sets/UnofficialCardSets';
import Footer from './footer/Footer';
import Header from './header/Header';
import Results from './results/Results';

vi.mock('next/router', () => ({
  useRouter: () => ({ isReady: true, query: {}, push: vi.fn(), pathname: '/' }),
}));

const SETS: CardSet[] = [
  { Id: 'set-a', Name: 'Spider-Man', Type: 'Hero Set' },
  { Id: 'set-b', Name: 'Rhino', Type: 'Villain Set' },
];

const PACKS: CardPack[] = [
  { Id: 'pack-a', Name: 'Core Set', Number: '1' },
  { Id: 'pack-b', Name: 'The Green Goblin', Number: '2' },
];

const UNOFFICIAL: UnofficialCardSet[] = [
  { Id: 'merlin-a', Name: 'Alligator Loki', Type: 'Hero Set', Source: 'ms' },
  { Id: 'cerebro-a', Name: 'Angela', Type: 'Hero Set', Source: 'usi' },
];

const makeCard = (Id: string, overrides: Partial<Card> = {}): Card => ({
  Deleted: false,
  Id,
  Official: true,
  Classification: 'Justice',
  Cost: '1',
  Name: `Card ${Id}`,
  Printings: [],
  Subname: '',
  Traits: ['Avenger'],
  Type: 'Event',
  Unique: false,
  ImageUrl: '',
  ...overrides,
});

describe('landmark and list semantics', () => {
  it('renders the site header as a banner landmark', () => {
    render(<Header miniLogo={true} />);

    expect(screen.getByRole('banner')).toBeDefined();
  });

  it('gives the header logo an accessible name rather than "logo"', () => {
    render(<Header miniLogo={true} />);

    expect(screen.getByRole('link', { name: /octobot search home/i })).toBeDefined();
  });

  it('renders the footer as a contentinfo landmark with a named navigation', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeDefined();
    expect(screen.getByRole('navigation', { name: /sources/i })).toBeDefined();
  });

  it('puts every browse link inside a list item, not bare in a ul', () => {
    const { container } = render(<CardSets cardSets={SETS} />);

    for (const list of Array.from(container.querySelectorAll('ul'))) {
      for (const child of Array.from(list.children)) {
        expect(child.tagName).toBe('LI');
      }
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(SETS.length);
  });

  it('does the same for packs and community sets', () => {
    const { unmount } = render(<CardPacks cardPacks={PACKS} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(PACKS.length);
    unmount();

    render(<UnofficialCardSets sets={UNOFFICIAL} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(UNOFFICIAL.length);
  });

  it('renders browse entries as links, not buttons wearing a link', () => {
    render(<CardSets cardSets={SETS} />);

    expect(screen.getAllByRole('link')).toHaveLength(SETS.length);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('groups sets under a heading for each type', () => {
    render(<CardSets cardSets={SETS} />);

    expect(screen.getByRole('heading', { name: 'Hero Set' })).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Villain Set' })).toBeDefined();
  });
});

describe('results keyboard and naming behavior', () => {
  const renderResults = () =>
    render(<Results results={[makeCard('1'), makeCard('2')]} cerebroQuery="input=x" detailsEnabled={true} />);

  it('names each result link after its card', () => {
    renderResults();

    expect(screen.getByRole('link', { name: 'Card 1' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Card 2' })).toBeDefined();
  });

  it('exposes the API link as a link, so it works with keyboard and middle-click', () => {
    renderResults();

    const apiLink = screen.getByRole('link', { name: /view api/i });
    expect(apiLink.getAttribute('target')).toBe('_blank');
    expect(apiLink.getAttribute('rel')).toContain('noopener');
  });

  it('reaches the filter controls by keyboard alone', async () => {
    const user = userEvent.setup();
    renderResults();

    const sortSelect = screen.getByLabelText(/sort/i);
    sortSelect.focus();
    expect(document.activeElement).toBe(sortSelect);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /filters/i }));
  });

  it('reports the filter panel expansion state to assistive tech', async () => {
    const user = userEvent.setup();
    renderResults();

    const toggle = screen.getByRole('button', { name: /filters/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('marks selected filter chips as pressed', async () => {
    const user = userEvent.setup();
    render(<Results
      results={[makeCard('1', { Type: 'Ally' }), makeCard('2', { Type: 'Event' })]}
      detailsEnabled={false}
    />);

    await user.click(screen.getByRole('button', { name: /filters/i }));
    const allyChip = screen.getByRole('button', { name: 'Ally', pressed: false });

    await user.click(allyChip);
    expect(screen.getByRole('button', { name: 'Ally' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('status').textContent).toContain('1 card');
  });

  it('gives each active-filter remove button a distinct accessible name', async () => {
    const user = userEvent.setup();
    render(<Results
      results={[makeCard('1', { Type: 'Ally' }), makeCard('2', { Type: 'Event' })]}
      detailsEnabled={false}
    />);

    await user.click(screen.getByRole('button', { name: /filters/i }));
    await user.click(screen.getByRole('button', { name: 'Ally', pressed: false }));

    const summary = screen.getByRole('button', { name: /remove ally filter/i });
    expect(summary).toBeDefined();

    await user.click(summary);
    expect(screen.queryByRole('button', { name: /remove ally filter/i })).toBeNull();
  });

  it('announces the result count as a live status', () => {
    renderResults();

    expect(within(screen.getByRole('status')).getByText(/2 cards/)).toBeDefined();
  });
});
