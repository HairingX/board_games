import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { cards } from './cards';
import { newDeck, type DeckState } from './deck';
import Parkort, { storageKey } from './Parkort';

function save(state: DeckState): void {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function saved(): DeckState {
  return JSON.parse(localStorage.getItem(storageKey) ?? 'null') as DeckState;
}

const click = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('button', { name }));
};

/** A saved deck with the given cards first, in that order. */
function deckStartingWith(...ids: string[]): DeckState {
  const rest = cards.map((card) => card.id).filter((id) => !ids.includes(id));
  return { ...newDeck(cards), order: [...ids, ...rest] };
}

describe('Parkort setup', () => {
  it('starts with every category chosen and nothing talked about', () => {
    render(<Parkort />);
    expect(screen.getByText('0 af 200')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    for (const chip of screen.getAllByRole('button', { pressed: true })) {
      expect(chip).toHaveTextContent('25');
    }
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Start forfra' })).not.toBeInTheDocument();
  });

  it('turns categories off and on, keeping their order, and needs at least one', () => {
    save({ ...newDeck(cards), categories: ['os-to'] });
    render(<Parkort />);
    expect(screen.getByText('0 af 25')).toBeInTheDocument();

    click(/Minder/);
    expect(saved().categories).toEqual(['os-to', 'minder']);

    click(/Os to/);
    click(/Minder/);
    expect(saved().categories).toEqual([]);
    expect(screen.getByText('0 af 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    expect(screen.getByText('Vælg mindst én kategori.')).toBeInTheDocument();
  });

  it('chooses the order', () => {
    render(<Parkort />);
    fireEvent.click(screen.getByRole('radio', { name: 'Let til dyb' }));
    expect(screen.getByRole('radio', { name: 'Let til dyb' })).toBeChecked();
    expect(saved().mode).toBe('let-til-dyb');
  });

  it('continues where it was left, and starts over only once confirmed', () => {
    save({ ...newDeck(cards), seen: ['os-to-1', 'minder-2'] });
    render(<Parkort />);
    expect(screen.getByText('2 af 200')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fortsæt' })).toBeInTheDocument();

    click('Start forfra');
    click('Annullér');
    expect(saved().seen).toHaveLength(2);

    click('Start forfra');
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Er I sikre?');
    click('Ja, start forfra');
    expect(saved().seen).toEqual([]);
    expect(screen.getByText('0 af 200')).toBeInTheDocument();
  });

  it('starts afresh when the saved deck is unreadable', () => {
    localStorage.setItem(storageKey, '{"order":1}');
    render(<Parkort />);
    expect(screen.getByText('0 af 200')).toBeInTheDocument();
  });
});

describe('Parkort play', () => {
  it('turns the top card, then goes on to the next and remembers it', () => {
    save(deckStartingWith('os-to-1', 'os-to-2'));
    render(<Parkort />);
    click('Start');

    expect(screen.getByRole('button', { name: 'Næste kort' })).toBeDisabled();
    expect(screen.getByText('Tryk på kortet for at vende det.')).toBeInTheDocument();
    click('Vend kortet');

    expect(screen.getByText('Hvad lagde du først mærke til ved mig, da vi mødtes?')).toBeVisible();
    expect(screen.getByText('Os to')).toBeInTheDocument();
    expect(screen.getByLabelText('Niveau: Let')).toBeInTheDocument();
    click('Næste kort');

    expect(saved().seen).toEqual(['os-to-1']);
    expect(screen.getByLabelText('1 af 200 kort snakket om')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vend kortet' })).toBeEnabled();
  });

  it('puts a skipped card at the bottom without counting it', () => {
    save(deckStartingWith('os-to-1', 'os-to-2'));
    render(<Parkort />);
    click('Start');
    click('Vend kortet');
    click('Spring over');

    expect(saved().seen).toEqual([]);
    expect(saved().order.at(-1)).toBe('os-to-1');
  });

  it('celebrates when every chosen card has been talked about, and can start over', () => {
    const all = cards.filter((card) => card.category === 'minder').map((card) => card.id);
    save({ ...newDeck(cards), categories: ['minder'], seen: all });
    render(<Parkort />);
    click('Fortsæt');

    expect(screen.getByRole('heading', { name: 'Godt snakket!' })).toBeInTheDocument();
    expect(
      screen.getByText('I har været alle 25 kort i de valgte kategorier igennem.'),
    ).toBeVisible();
    click('Start forfra');
    expect(saved().seen).toEqual([]);
    expect(screen.getByRole('button', { name: 'Vend kortet' })).toBeInTheDocument();
  });

  it('goes back to the setup from the deck and from the end', () => {
    const all = cards.filter((card) => card.category === 'minder').map((card) => card.id);
    save({ ...newDeck(cards), categories: ['minder'], seen: all.slice(1) });
    render(<Parkort />);
    click('Fortsæt');
    click('Tilbage');
    expect(screen.getByText('24 af 25')).toBeInTheDocument();

    click('Fortsæt');
    click('Vend kortet');
    click('Næste kort');
    click('Vælg andre kategorier');
    expect(within(screen.getByLabelText('Fremskridt')).getByText('25 af 25')).toBeInTheDocument();
  });

  it('shows the cards underneath only while there are any', () => {
    save({
      ...newDeck(cards),
      categories: ['minder'],
      seen: cards
        .filter((card) => card.category === 'minder')
        .slice(2)
        .map((card) => card.id),
    });
    const { container } = render(<Parkort />);
    click('Fortsæt');
    expect(container.querySelectorAll('.pk-stack')).toHaveLength(1);
  });
});
